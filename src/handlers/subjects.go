package handlers

import (
	"deadline-website/database"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// Helper duplicated from deadlines.go - cleaner solution is to move to utils
// DELETED - It's in the same package, so it's already available.

// List Subjects (Public)
func ListSubjects(c fiber.Ctx) error {
	var subjects []database.Subject
	if err := database.DB.Find(&subjects).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(subjects)
}

// Get Subject (Public)
func GetSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var subject database.Subject
	if err := database.DB.First(&subject, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Subject not found"})
	}

	return c.JSON(subject)
}

// Create Subject Request
type CreateSubjectRequest struct {
	Name      string `json:"name"`
	Shortname string `json:"shortname"`
	Shortlink string `json:"shortlink"`
	Icon      string `json:"icon"`
	PVSPLink  string `json:"pvsp_link"`
	PPhisLink string `json:"pphis_link"`
}

// Create Subject (Admin)
func CreateSubject(c fiber.Ctx) error {
	var req CreateSubjectRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" || req.Shortname == "" || req.Shortlink == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name, Shortname and Shortlink are required"})
	}

	subject := database.Subject{
		Name:      req.Name,
		Shortname: req.Shortname,
		Shortlink: req.Shortlink,
		Icon:      req.Icon,
		PVSPLink:  req.PVSPLink,
		PPhisLink: req.PPhisLink,
	}

	if err := database.DB.Create(&subject).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create subject"})
	}

	return c.JSON(fiber.Map{"success": true, "id": subject.ID})
}

// Update Subject (Admin)
func UpdateSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req CreateSubjectRequest // Reuse struct since fields are the same
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	var subject database.Subject
	if err := database.DB.First(&subject, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Subject not found"})
	}

	// Update fields if provided
	if req.Name != "" {
		subject.Name = req.Name
	}
	if req.Shortname != "" {
		subject.Shortname = req.Shortname
	}
	if req.Shortlink != "" {
		subject.Shortlink = req.Shortlink
	}
	if req.Icon != "" {
		subject.Icon = req.Icon
	}
	if req.PVSPLink != "" {
		subject.PVSPLink = req.PVSPLink
	}
	if req.PPhisLink != "" {
		subject.PPhisLink = req.PPhisLink
	}

	if err := database.DB.Save(&subject).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update subject"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Delete Subject (Admin)
func DeleteSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	result := database.DB.Delete(&database.Subject{}, id)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true, "deleted_count": result.RowsAffected})
}
