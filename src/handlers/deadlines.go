package handlers

import (
	"log"
	"strconv"
	"time"

	"polydl/models"
	"polydl/services"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// RegisterDeadlineRoutes registers the deadline handlers to the given router
func (h *API) RegisterDeadlineRoutes(router fiber.Router) {
	// Deadlines group
	deadlines := router.Group("/deadlines")

	deadlines.Get("/", h.MainPage)
	deadlines.Get("/:subj", h.MainPage)

	// Protected routes (Admin only)
	protected := deadlines.Group("/")
	protected.Use(Protected(), AdminOnly())

	protected.Post("/", h.AddDeadline)
	protected.Put("/:id", h.UpdateDeadline)
	protected.Delete("/:id", h.DeleteDeadline)
}

// Helper to extract user ID from token without failing if missing
func getUserIdFromToken(c fiber.Ctx) uint {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return 0
	}

	// Basic parsing similar to middleware
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString := authHeader[7:]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return SecretKey, nil
		})

		if err == nil && token.Valid {
			claims := token.Claims.(jwt.MapClaims)
			if idFloat, ok := claims["user_id"].(float64); ok {
				return uint(idFloat)
			}
		}
	}
	return 0
}

// MainPage Handler - Returns list of deadlines as JSON
func (h *API) MainPage(c fiber.Ctx) error {
	var deadlines []models.Deadline
	var err error

	// Logic for subject filtering
	subjParam := c.Params("subj")

	if subjParam != "" {
		// Lookup subject by SHORTLINK (e.g. "highmath")
		subject, err := h.SubjectRepo.GetByShortlink(subjParam)

		if err == nil {
			// Found subject, filter deadlines
			deadlines, err = h.DeadlineRepo.GetBySubjectID(subject.ID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Database error"})
			}
		} else {
			// Subject not found, return empty
			return c.JSON([]models.DeadlineView{})
		}
	} else {
		// "all" case, Preload Subject to have data
		deadlines, err = h.DeadlineRepo.GetAllWithSubject()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}
	}

	// Roadmap Check
	completedMap := make(map[uint]bool)
	userID := getUserIdFromToken(c)
	if userID != 0 {
		user, err := h.UserRepo.GetByIDWithCompletedDeadlines(userID)
		if err == nil {
			for _, d := range user.CompletedDeadlines {
				completedMap[d.ID] = true
			}
		}
	}

	var response []models.DeadlineView
	for _, dl := range deadlines {
		isCompleted := completedMap[dl.ID]
		response = append(response, services.Counter(dl, isCompleted))
	}

	if response == nil {
		response = []models.DeadlineView{}
	}

	return c.JSON(response)
}

// Structs for JSON inputs
type AddDeadlineRequest struct {
	SubjectID uint   `json:"subject_id"`
	Name      string `json:"name"`
	TsFrom    string `json:"ts_from"`
	TsDue     string `json:"ts_due"`
	FAwesome  string `json:"f_awesome"`
	SdoLink   string `json:"sdo_link"`
}

// Add Deadline Handler
func (h *API) AddDeadline(c fiber.Ctx) error {
	var req AddDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	layout := "02.01.2006 15:04"
	tsFrom, err1 := time.Parse(layout, req.TsFrom)
	tsDue, err2 := time.Parse(layout, req.TsDue)

	if err1 == nil && err2 == nil {
		dl := models.Deadline{
			SubjectID: req.SubjectID,
			Name:      req.Name,
			TsFrom:    tsFrom,
			TsDue:     tsDue,
			FAwesome:  req.FAwesome,
			SdoLink:   req.SdoLink,
		}
		err := h.DeadlineRepo.Create(&dl)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Database error: message" + err.Error()})
		}
		return c.JSON(fiber.Map{"success": true, "id": dl.ID})
	} else {
		log.Println("Date parse error:", err1, err2)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date format"})
	}
}

// Delete Handler
func (h *API) DeleteDeadline(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	err = h.DeadlineRepo.Delete(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(fiber.Map{"success": true})
}

// Update Deadline Handler
func (h *API) UpdateDeadline(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	type UpdateDeadlineRequest struct {
		SubjectID uint   `json:"subject_id"`
		Name      string `json:"name"`
		TsFrom    string `json:"ts_from"`
		TsDue     string `json:"ts_due"`
		FAwesome  string `json:"f_awesome"`
		SdoLink   string `json:"sdo_link"`
	}

	var req UpdateDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	dl, err := h.DeadlineRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Update fields
	if req.SubjectID != 0 {
		dl.SubjectID = req.SubjectID
	}
	if req.Name != "" {
		dl.Name = req.Name
	}
	if req.FAwesome != "" {
		dl.FAwesome = req.FAwesome
	}
	if req.SdoLink != "" {
		dl.SdoLink = req.SdoLink
	}

	// Date parsing
	layout := "02.01.2006 15:04"
	if req.TsFrom != "" {
		if t, err := time.Parse(layout, req.TsFrom); err == nil {
			dl.TsFrom = t
		}
	}
	if req.TsDue != "" {
		if t, err := time.Parse(layout, req.TsDue); err == nil {
			dl.TsDue = t
		}
	}

	if err := h.DeadlineRepo.Update(dl); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}
