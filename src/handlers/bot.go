package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
)

// GetBotDeadlines handles synchronous deadline fetches from the bot
func (h *API) GetBotDeadlines(c fiber.Ctx) error {
	telegramIDStr := c.Query("telegram_id")
	if telegramIDStr == "" {
		return c.Status(400).JSON(fiber.Map{"error": "telegram_id is required"})
	}

	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid telegram_id"})
	}

	// Find user by Telegram ID
	user, err := h.UserRepo.GetByTelegramID(telegramID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found or not linked"})
	}

	// Fetch active deadlines
	var groupID uint
	if user.GroupID != nil {
		groupID = *user.GroupID
	}
	deadlines, err := h.DeadlineRepo.GetDeadlinesForUser(user.ID, groupID, nil)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch deadlines"})
	}

	// Fetch completed deadlines
	userWithCompleted, err := h.UserRepo.GetByIDWithCompletedDeadlines(user.ID)
	completedMap := make(map[uint]bool)
	if err == nil {
		for _, d := range userWithCompleted.CompletedDeadlines {
			completedMap[d.ID] = true
		}
	}

	// Format response
	var response []map[string]interface{}
	now := time.Now()
	for _, d := range deadlines {
		// Skip completed deadlines
		if completedMap[d.ID] {
			continue
		}
		// Skip missed deadlines
		if d.TsDue.Before(now) {
			continue
		}

		response = append(response, map[string]interface{}{
			"id":       d.ID,
			"name":     d.Name,
			"subject":  d.Subject.Name,
			"ts_from":  d.TsFrom.Format(time.RFC3339),
			"ts_due":   d.TsDue.Format(time.RFC3339),
			"sdo_link": d.SdoLink,
		})
	}

	return c.JSON(response)
}

type WebAppAuthRequest struct {
	InitData string `json:"initData"`
}

func (h *API) WebAppAuth(c fiber.Ctx) error {

	var req WebAppAuthRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	botToken := os.Getenv("BOT_TOKEN")
	if botToken == "" {
		return c.Status(500).JSON(fiber.Map{"error": "BOT_TOKEN not configured"})
	}

	parsed, err := url.ParseQuery(req.InitData)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid initData format"})
	}

	hash := parsed.Get("hash")
	if hash == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing hash"})
	}

	var keys []string
	for k := range parsed {
		if k != "hash" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var dataCheckArr []string
	for _, k := range keys {
		dataCheckArr = append(dataCheckArr, k+"="+parsed.Get(k))
	}
	dataCheckString := strings.Join(dataCheckArr, "\n")

	secretKey := hmacSHA256([]byte("WebAppData"), []byte(botToken))
	expectedHash := hex.EncodeToString(hmacSHA256(secretKey, []byte(dataCheckString)))

	if expectedHash != hash {
		return c.Status(401).JSON(fiber.Map{"error": "invalid hash signature"})
	}

	userStr := parsed.Get("user")
	var tgUser map[string]interface{}
	if err := json.Unmarshal([]byte(userStr), &tgUser); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "failed to parse user json"})
	}

	idFloat, ok := tgUser["id"].(float64)
	if !ok {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id type"})
	}
	telegramID := int64(idFloat)

	user, err := h.UserRepo.GetByTelegramID(telegramID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Telegram account is not linked to any PolyDL profile"})
	}

	token, err := generateToken(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to generate authentication token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": map[string]interface{}{
			"id": user.ID,
			"name": user.Name,
			"surname": user.Surname,
			"role": user.Role,
		},
	})
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
