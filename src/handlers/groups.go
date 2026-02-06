package handlers

import (
	"polydl/models"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// --- SuperAdmin Handlers ---

// ListGroups returns all groups
func (h *API) ListGroups(c fiber.Ctx) error {
	groups, err := h.GroupRepo.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(groups)
}

// CreateGroupRequest
type CreateGroupRequest struct {
	Name       string `json:"name"`
	InviteCode string `json:"invite_code"`
}

// CreateGroup creates a new group
func (h *API) CreateGroup(c fiber.Ctx) error {
	var req CreateGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" || req.InviteCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name and Invite Code are required"})
	}

	group := models.Group{
		Name:       req.Name,
		InviteCode: req.InviteCode,
	}

	if err := h.GroupRepo.Create(&group); err != nil {
		// Check for duplicate key error ideally
		return c.Status(500).JSON(fiber.Map{"error": "Could not create group. Invite code might be taken."})
	}

	return c.JSON(fiber.Map{"success": true, "id": group.ID})
}

// UpdateGroup updates general info by SuperAdmin
func (h *API) UpdateGroup(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req CreateGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	group, err := h.GroupRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	if req.Name != "" {
		group.Name = req.Name
	}
	if req.InviteCode != "" {
		group.InviteCode = req.InviteCode
	}

	if err := h.GroupRepo.Update(group); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update group"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// DeleteGroup deletes a group
func (h *API) DeleteGroup(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	if err := h.GroupRepo.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// --- Admin Handlers ---

// RenameOwnGroup allows an Admin to rename their own group
func (h *API) RenameOwnGroup(c fiber.Ctx) error {
	userID := getUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	user, err := h.UserRepo.GetByID(userID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if user.GroupID == nil {
		return c.Status(400).JSON(fiber.Map{"error": "User does not belong to a group"})
	}

	type RenameGroupRequest struct {
		Name string `json:"name"`
	}
	var req RenameGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	group, err := h.GroupRepo.GetByID(*user.GroupID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	group.Name = req.Name
	if err := h.GroupRepo.Update(group); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update group"})
	}

	return c.JSON(fiber.Map{"success": true})
}
