package handlers

import (
	"polydl/models"
	"polydl/services"
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
		GroupID  *uint  `json:"group_id"`
	}

	var response []UserView
	for _, u := range users {
		response = append(response, UserView{
			ID:       u.ID,
			Name:     u.Name,
			Surname:  u.Surname,
			Username: u.Username,
			Role:     u.Role,
			GroupID:  u.GroupID,
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
	GroupID  *uint  `json:"group_id"` // Nullable
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

	_, err = h.UserRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Collect updates in a map to avoid association issues and handle nulls
	updates := make(map[string]interface{})

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Surname != "" {
		updates["surname"] = req.Surname
	}
	if req.Username != "" {
		updates["username"] = req.Username
	}

	// Always update GroupID if provided (distinguishing between 0 and actual ID)
	if req.GroupID != nil {
		if *req.GroupID == 0 {
			updates["group_id"] = nil
		} else {
			updates["group_id"] = *req.GroupID
		}
	}

	// Important: Use direct Model(&models.User{}) to avoid association preloading issues from the 'user' object
	if err := h.UserRepo.DB.Model(&models.User{}).Where("id = ?", uint(id)).Updates(updates).Error; err != nil {
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

// Create User Request
type CreateUserRequest struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
	GroupID  *uint  `json:"group_id"`
}

// Create User
func (h *API) CreateUser(c fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	// Basic validation
	if req.Username == "" || req.Password == "" || req.Name == "" || req.Surname == "" {
		return c.Status(400).JSON(fiber.Map{"error": "All fields are required"})
	}

	// Check if user exists
	existing, err := h.UserRepo.GetByUsername(req.Username)
	if err == nil && existing != nil && existing.ID != 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Username already taken"})
	}

	// Hash password
	hash, err := services.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Default role
	role := req.Role
	if role == "" {
		role = models.RoleUser
	}

	// Validate Role
	validRoles := map[string]bool{
		models.RoleSuperAdmin: true,
		models.RoleAdmin:      true,
		models.RoleUser:       true,
	}
	if !validRoles[role] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}

	user := models.User{
		Name:         req.Name,
		Surname:      req.Surname,
		Username:     req.Username,
		PasswordHash: hash,
		Role:         role,
		GroupID:      req.GroupID,
	}

	if req.GroupID != nil && *req.GroupID == 0 {
		user.GroupID = nil
	}

	if err := h.UserRepo.Create(&user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
	}

	// Return created user (sanitized)
	return c.Status(201).JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"group_id": user.GroupID,
	})
}
