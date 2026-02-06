package handlers

import (
	"polydl/models"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// List Users
func (h *API) ListUsers(c fiber.Ctx) error {
	users, err := h.UserRepo.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Sanitize output (don't send password hashes)
	type UserView struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Surname  string `json:"surname"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}

	var response []UserView
	for _, u := range users {
		response = append(response, UserView{
			ID:       u.ID,
			Name:     u.Name,
			Surname:  u.Surname,
			Username: u.Username,
			Role:     u.Role,
		})
	}

	if response == nil {
		response = []UserView{}
	}

	return c.JSON(response)
}

// Update User Request
type UpdateUserRequest struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Username string `json:"username"`
}

// Update User
func (h *API) UpdateUser(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req UpdateUserRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user, err := h.UserRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Update allowed fields
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Surname != "" {
		user.Surname = req.Surname
	}
	if req.Username != "" {
		user.Username = req.Username
	}

	if err := h.UserRepo.Update(user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update user"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Update Role Request
type UpdateRoleRequest struct {
	Role string `json:"role"`
}

// Update Role
func (h *API) UpdateRole(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	var req UpdateRoleRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	// Validate Role
	validRoles := map[string]bool{
		models.RoleSuperAdmin: true,
		models.RoleAdmin:      true,
		models.RoleUser:       true,
	}
	if !validRoles[req.Role] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}

	user, err := h.UserRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	user.Role = req.Role
	if err := h.UserRepo.Update(user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update role"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Delete User
func (h *API) DeleteUser(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	if err := h.UserRepo.Delete(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete user"})
	}

	return c.JSON(fiber.Map{"success": true})
}
