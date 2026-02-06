package handlers

import (
	"log"
	"time"

	"deadline-website/database"

	"github.com/gofiber/fiber/v3"
)

// RegisterDeadlineRoutes registers the deadline handlers to the given router
func RegisterDeadlineRoutes(router fiber.Router) {
	// Main group
	root := router.Group("/")

	root.Get("/", MainPage)
	root.Get("/:subj", MainPage)

	// Protected routes (Admin only)
	protected := root.Group("/")
	protected.Use(Protected(), AdminOnly())

	protected.Post("/add", AddDeadline)
	protected.Post("/del", DeleteDeadline)
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

	var response []database.DeadlineView
	for _, dl := range deadlines {
		response = append(response, database.Counter(dl))
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

type DeleteDeadlineRequest struct {
	DlID int `json:"dl_id"`
}

// Delete Handler
func DeleteDeadline(c fiber.Ctx) error {
	var req DeleteDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	result := database.DB.Delete(&database.Deadline{}, req.DlID)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(fiber.Map{"success": true, "deleted_count": result.RowsAffected})
}
