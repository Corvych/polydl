package handlers

import (
	"deadline-website/database"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// --- SuperAdmin Handlers ---

// ListGroups returns all groups
func ListGroups(c fiber.Ctx) error {
	var groups []database.Group
	if err := database.DB.Find(&groups).Error; err != nil {
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
func CreateGroup(c fiber.Ctx) error {
	var req CreateGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.Name == "" || req.InviteCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name and Invite Code are required"})
	}

	group := database.Group{
		Name:       req.Name,
		InviteCode: req.InviteCode,
	}

	if err := database.DB.Create(&group).Error; err != nil {
		// Check for duplicate key error ideally
		return c.Status(500).JSON(fiber.Map{"error": "Could not create group. Invite code might be taken."})
	}

	return c.JSON(fiber.Map{"success": true, "id": group.ID})
}

// UpdateGroup updates general info by SuperAdmin
func UpdateGroup(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req CreateGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	var group database.Group
	if err := database.DB.First(&group, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	if req.Name != "" {
		group.Name = req.Name
	}
	if req.InviteCode != "" {
		group.InviteCode = req.InviteCode
	}

	if err := database.DB.Save(&group).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update group"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// DeleteGroup deletes a group
func DeleteGroup(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	if err := database.DB.Delete(&database.Group{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// --- Admin Handlers ---

// RenameOwnGroup allows an Admin to rename their own group
func RenameOwnGroup(c fiber.Ctx) error {
	userID := getUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user database.User
	if err := database.DB.First(&user, userID).Error; err != nil {
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

	var group database.Group
	if err := database.DB.First(&group, *user.GroupID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	group.Name = req.Name
	if err := database.DB.Save(&group).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update group"})
	}

	return c.JSON(fiber.Map{"success": true})
}
