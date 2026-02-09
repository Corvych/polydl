package handlers

import (
	"polydl/models"
	"strconv"

	"github.com/golang-jwt/jwt/v5"

	"github.com/gofiber/fiber/v3"
)

// List Subjects (Public)
// List Subjects (Group-specific or Global for SuperAdmin)
func (h *API) ListSubjects(c fiber.Ctx) error {
	userID := getUserIdFromToken(c)

	// Safely check for superadmin role if logged in
	if userLocals := c.Locals("user"); userLocals != nil {
		if claims, ok := userLocals.(jwt.MapClaims); ok {
			if role, ok := claims["role"].(string); ok && role == models.RoleSuperAdmin {
				groupIDParam := c.Query("group_id")
				if groupIDParam != "" {
					gid, _ := strconv.Atoi(groupIDParam)
					subjects, err := h.SubjectRepo.GetByGroupID(uint(gid))
					if err != nil {
						return c.Status(500).JSON(fiber.Map{"error": "Database error"})
					}
					return c.JSON(subjects)
				}
			}
		}
	}

	if userID != 0 {
		user, err := h.UserRepo.GetByID(userID)
		if err == nil && user.GroupID != nil {
			subjects, err := h.SubjectRepo.GetByGroupID(*user.GroupID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Database error"})
			}
			return c.JSON(subjects)
		}
	}

	// No user or no group - return empty list
	return c.JSON([]models.Subject{})
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
	Icon      string `json:"icon"`
	PVSPLink  string `json:"pvsp_link"`
	PPhisLink string `json:"pphis_link"`
}

// Create Subject (Admin)
// Create Subject (Admin)
func (h *API) CreateSubject(c fiber.Ctx) error {
	user := GetUser(c)
	if user == nil || user.GroupID == nil {
		return c.Status(400).JSON(fiber.Map{"error": "You must be in a group to create subjects"})
	}

	var req CreateSubjectRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" || req.Shortname == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name and Shortname are required"})
	}

	subject := models.Subject{
		Name:      req.Name,
		Shortname: req.Shortname,
		Icon:      req.Icon,
		PVSPLink:  req.PVSPLink,
		PPhisLink: req.PPhisLink,
		GroupID:   user.GroupID,
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

	// Security: Check if subject belongs to user's group
	user := GetUser(c)
	if user == nil {
		// Should be handled by middleware but safety check
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if user.Role != models.RoleSuperAdmin {
		if user.GroupID == nil || subject.GroupID == nil || *user.GroupID != *subject.GroupID {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden: Subject belongs to another group"})
		}
	}

	// Update fields if provided
	if req.Name != "" {
		subject.Name = req.Name
	}
	if req.Shortname != "" {
		subject.Shortname = req.Shortname
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

	subject, err := h.SubjectRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Subject not found"})
	}

	// Security: Check if subject belongs to user's group
	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if user.Role != models.RoleSuperAdmin {
		if user.GroupID == nil || subject.GroupID == nil || *user.GroupID != *subject.GroupID {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden: Subject belongs to another group"})
		}
	}

	if err := h.SubjectRepo.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}
