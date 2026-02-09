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

// GetGroup returns a specific group by ID
func (h *API) GetGroup(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	group, err := h.GroupRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	return c.JSON(group)
}

// GetGroupByInviteCode returns limited group info by invite code (Public)
func (h *API) GetGroupByInviteCode(c fiber.Ctx) error {
	code := c.Params("code")
	if code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Invite code is required"})
	}

	group, err := h.GroupRepo.GetByInviteCode(code)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Invalid invite code"})
	}

	// Return only safe info
	return c.JSON(fiber.Map{
		"id":   group.ID,
		"name": group.Name,
		"icon": group.Icon,
	})
}

// CreateGroupRequest
type CreateGroupRequest struct {
	Name       string `json:"name"`
	InviteCode string `json:"invite_code"`
	Icon       string `json:"icon"`
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
		Icon:       req.Icon,
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

// UpdateOwnGroup allows an Admin to update their own group
func (h *API) UpdateOwnGroup(c fiber.Ctx) error {
	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if user.GroupID == nil {
		return c.Status(400).JSON(fiber.Map{"error": "User does not belong to a group"})
	}

	type UpdateGroupRequest struct {
		Name       string `json:"name"`
		InviteCode string `json:"invite_code"`
		Icon       string `json:"icon"`
	}
	var req UpdateGroupRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	group, err := h.GroupRepo.GetByID(*user.GroupID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}

	if req.Name != "" {
		group.Name = req.Name
	}
	if req.InviteCode != "" {
		group.InviteCode = req.InviteCode
	}
	if req.Icon != "" {
		group.Icon = req.Icon
	}

	if err := h.GroupRepo.Update(group); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update group. Code might be taken."})
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetMyGroupMembers returns members of the admin's group
func (h *API) GetMyGroupMembers(c fiber.Ctx) error {
	user := GetUser(c)
	if user == nil || user.GroupID == nil {
		return c.Status(400).JSON(fiber.Map{"error": "No group found"})
	}

	members, err := h.UserRepo.GetByGroupID(*user.GroupID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Sanitize
	type MemberView struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Surname  string `json:"surname"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}
	var res []MemberView
	for _, m := range members {
		res = append(res, MemberView{
			ID:       m.ID,
			Name:     m.Name,
			Surname:  m.Surname,
			Username: m.Username,
			Role:     m.Role,
		})
	}

	return c.JSON(res)
}

// KickMember removes a user from the group (Admin only)
func (h *API) KickMember(c fiber.Ctx) error {
	admin := GetUser(c)
	if admin == nil || admin.GroupID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	targetIDParam := c.Params("id")
	targetID, err := strconv.Atoi(targetIDParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	target, err := h.UserRepo.GetByID(uint(targetID))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if target.GroupID == nil || *target.GroupID != *admin.GroupID {
		return c.Status(400).JSON(fiber.Map{"error": "User is not in your group"})
	}

	// Cannot kick yourself (use LeaveGroup) or other Admins/SuperAdmins ideally (unless Super)
	// For simplicity, allowed if same group, providing Admin role is checked by middleware
	if target.ID == admin.ID {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot kick yourself"})
	}

	if err := h.UserRepo.LeaveGroup(target.ID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not remove member"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// --- SuperAdmin Member Management ---

// GetGroupMembers returns members of a specific group
func (h *API) GetGroupMembers(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	members, err := h.UserRepo.GetByGroupID(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	type MemberView struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Surname  string `json:"surname"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}
	var res []MemberView
	for _, m := range members {
		res = append(res, MemberView{
			ID:       m.ID,
			Name:     m.Name,
			Surname:  m.Surname,
			Username: m.Username,
			Role:     m.Role,
		})
	}
	// Return empty array instead of null
	if res == nil {
		res = []MemberView{}
	}

	return c.JSON(res)
}

// RemoveMemberFromGroup removes a user from a specific group
func (h *API) RemoveMemberFromGroup(c fiber.Ctx) error {
	groupIdParam := c.Params("id")
	groupId, err := strconv.Atoi(groupIdParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Group ID"})
	}

	userIdParam := c.Params("userId")
	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid User ID"})
	}

	user, err := h.UserRepo.GetByID(uint(userId))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if user.GroupID == nil || *user.GroupID != uint(groupId) {
		return c.Status(400).JSON(fiber.Map{"error": "User does not belong to this group"})
	}

	if err := h.UserRepo.LeaveGroup(user.ID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not remove member"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// --- Group Admin Advanced ---

// MakeGroupAdmin promotes a member to admin
func (h *API) MakeGroupAdmin(c fiber.Ctx) error {
	return h.changeMemberRole(c, models.RoleAdmin)
}

// RemoveGroupAdmin demotes a member to user
func (h *API) RemoveGroupAdmin(c fiber.Ctx) error {
	return h.changeMemberRole(c, models.RoleUser)
}

// Helper for changing role within own group
func (h *API) changeMemberRole(c fiber.Ctx, newRole string) error {
	admin := GetUser(c)
	if admin == nil || admin.GroupID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	targetIDParam := c.Params("id")
	targetID, err := strconv.Atoi(targetIDParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	target, err := h.UserRepo.GetByID(uint(targetID))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Verify target is in same group
	if target.GroupID == nil || *target.GroupID != *admin.GroupID {
		return c.Status(400).JSON(fiber.Map{"error": "User is not in your group"})
	}

	// Prevent demoting yourself (must exist at least one admin ideally, but letting them shoot foot is simpler for now, or just block self-demotion)
	if target.ID == admin.ID && newRole != models.RoleAdmin {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot demote yourself"})
	}

	target.Role = newRole
	if err := h.UserRepo.Update(target); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update user role"})
	}

	return c.JSON(fiber.Map{"success": true})
}
