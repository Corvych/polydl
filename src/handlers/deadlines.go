package handlers

import (
	"log"
	"strconv"
	"time"

	"deadline-website/database"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// RegisterDeadlineRoutes registers the deadline handlers to the given router
// RegisterDeadlineRoutes registers the deadline handlers to the given router
func RegisterDeadlineRoutes(router fiber.Router) {
	// Deadlines group
	deadlines := router.Group("/deadlines")

	deadlines.Get("/", MainPage)
	deadlines.Get("/:subj", MainPage)

	// Protected routes (Admin only)
	protected := deadlines.Group("/")
	protected.Use(Protected(), AdminOnly())

	protected.Post("/", AddDeadline)
	protected.Put("/:id", UpdateDeadline)
	protected.Delete("/:id", DeleteDeadline)
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
func MainPage(c fiber.Ctx) error {
	var deadlines []database.Deadline
	db := database.DB

	// Logic for subject filtering
	subjParam := c.Params("subj")

	if subjParam != "" {
		// Lookup subject by SHORTLINK (e.g. "highmath")
		var subject database.Subject
		result := db.Where("shortlink = ?", subjParam).First(&subject)

		if result.Error == nil {
			// Found subject, filter deadlines
			db.Preload("Subject").Where("subject_id = ?", subject.ID).Order("ts_due asc").Find(&deadlines)
		} else {
			// Subject not found, return empty
			return c.JSON([]database.DeadlineView{})
		}
	} else {
		// "all" case, Preload Subject to have data
		db.Preload("Subject").Order("ts_due asc").Find(&deadlines)
	}

	// Roadmap Check
	completedMap := make(map[uint]bool)
	userID := getUserIdFromToken(c)
	if userID != 0 {
		var user database.User
		// Optimize: only select ID from CompletedDeadlines
		if err := db.Preload("CompletedDeadlines").First(&user, userID).Error; err == nil {
			for _, d := range user.CompletedDeadlines {
				completedMap[d.ID] = true
			}
		}
	}

	var response []database.DeadlineView
	for _, dl := range deadlines {
		isCompleted := completedMap[dl.ID]
		response = append(response, database.Counter(dl, isCompleted))
	}

	if response == nil {
		response = []database.DeadlineView{}
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
func AddDeadline(c fiber.Ctx) error {
	var req AddDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	layout := "02.01.2006 15:04"
	tsFrom, err1 := time.Parse(layout, req.TsFrom)
	tsDue, err2 := time.Parse(layout, req.TsDue)

	if err1 == nil && err2 == nil {
		dl := database.Deadline{
			SubjectID: req.SubjectID,
			Name:      req.Name,
			TsFrom:    tsFrom,
			TsDue:     tsDue,
			FAwesome:  req.FAwesome,
			SdoLink:   req.SdoLink,
		}
		result := database.DB.Create(&dl)
		if result.Error != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Database error: message" + result.Error.Error()})
		}
		return c.JSON(fiber.Map{"success": true, "id": dl.ID})
	} else {
		log.Println("Date parse error:", err1, err2)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date format"})
	}
}

// Delete Handler
func DeleteDeadline(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	result := database.DB.Delete(&database.Deadline{}, id)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(fiber.Map{"success": true, "deleted_count": result.RowsAffected})
}

// Update Deadline Handler
func UpdateDeadline(c fiber.Ctx) error {
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

	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	var dl database.Deadline
	if err := database.DB.First(&dl, id).Error; err != nil {
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

	if err := database.DB.Save(&dl).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}
