package handlers

import (
	"os"
	"time"

	"polydl/models"
	"polydl/services"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Config
var SecretKey = []byte(getSecretKey())

func getSecretKey() string {
	key := os.Getenv("JWT_SECRET")
	if key == "" {
		return "secret-key-change-me"
	}
	return key
}

type RegisterRequest struct {
	Name       string `json:"name"`
	Surname    string `json:"surname"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	InviteCode string `json:"invite_code"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *API) Register(c fiber.Ctx) error {
	var req RegisterRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "errors.invalidJson"})
	}

	// Basic validation
	if req.Username == "" || req.Password == "" || req.Name == "" || req.Surname == "" {
		return c.Status(400).JSON(fiber.Map{"error": "errors.allFieldsRequired"})
	}

	// Check if user exists
	existing, err := h.UserRepo.GetByUsername(req.Username)
	if err == nil && existing != nil && existing.ID != 0 {
		return c.Status(400).JSON(fiber.Map{"error": "errors.usernameTaken"})
	}

	hash, err := services.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "errors.registerFailed"})
	}

	user := models.User{
		Name:         req.Name,
		Surname:      req.Surname,
		Username:     req.Username,
		PasswordHash: hash,
		Role:         models.RoleUser, // Default role
	}

	if req.InviteCode != "" {
		group, err := h.GroupRepo.GetByInviteCode(req.InviteCode)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "errors.invalidInviteCode"})
		}
		user.GroupID = &group.ID
	}

	if err := h.UserRepo.Create(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "errors.registerFailed"})
	}

	return c.JSON(fiber.Map{"success": true})
}

func (h *API) Login(c fiber.Ctx) error {
	var req LoginRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user, err := h.UserRepo.GetByUsername(req.Username)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if !services.VerifyPassword(req.Password, user.PasswordHash) {
		return c.Status(401).JSON(fiber.Map{"error": "Incorrect password"})
	}

	// Create JWT
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(SecretKey)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not login"})
	}

	return c.JSON(fiber.Map{"token": t})
}
