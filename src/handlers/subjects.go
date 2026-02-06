package handlers

import (
	"polydl/models"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// List Subjects (Public)
func (h *API) ListSubjects(c fiber.Ctx) error {
	subjects, err := h.SubjectRepo.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(subjects)
}

// Get Subject (Public)
func (h *API) GetSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	subject, err := h.SubjectRepo.GetByID(uint(id))
	if err != nil {
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
func (h *API) CreateSubject(c fiber.Ctx) error {
	var req CreateSubjectRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" || req.Shortname == "" || req.Shortlink == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name, Shortname and Shortlink are required"})
	}

	subject := models.Subject{
		Name:      req.Name,
		Shortname: req.Shortname,
		Shortlink: req.Shortlink,
		Icon:      req.Icon,
		PVSPLink:  req.PVSPLink,
		PPhisLink: req.PPhisLink,
	}

	if err := h.SubjectRepo.Create(&subject); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create subject"})
	}

	return c.JSON(fiber.Map{"success": true, "id": subject.ID})
}

// Update Subject (Admin)
func (h *API) UpdateSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req CreateSubjectRequest // Reuse struct since fields are the same
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	subject, err := h.SubjectRepo.GetByID(uint(id))
	if err != nil {
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

	if err := h.SubjectRepo.Update(subject); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update subject"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Delete Subject (Admin)
func (h *API) DeleteSubject(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	if err := h.SubjectRepo.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}
