package handlers

import (
	"polydl/services"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Helper to get user ID from context
func getUserID(c fiber.Ctx) uint {
	userLocals := c.Locals("user")
	if userLocals == nil {
		return 0
	}
	claims := userLocals.(jwt.MapClaims)

	// JWT numeric values are float64 by default when parsed from JSON
	idFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0
	}
	return uint(idFloat)
}

// Get Profile
func (h *API) GetProfile(c fiber.Ctx) error {
	id := getUserID(c)
	if id == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	user, err := h.UserRepo.GetByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"id":       user.ID,
		"name":     user.Name,
		"surname":  user.Surname,
		"username": user.Username,
		"role":     user.Role,
	})
}

// Update Profile Request
type UpdateProfileRequest struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Username string `json:"username"`
}

// Update Profile
func (h *API) UpdateProfile(c fiber.Ctx) error {
	id := getUserID(c)
	if id == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req UpdateProfileRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user, err := h.UserRepo.GetByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Update fields if provided
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
		return c.Status(500).JSON(fiber.Map{"error": "Could not update profile"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Change Password Request
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// Change Password
func (h *API) ChangePassword(c fiber.Ctx) error {
	id := getUserID(c)
	if id == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req ChangePasswordRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if req.NewPassword == "" {
		return c.Status(400).JSON(fiber.Map{"error": "New password cannot be empty"})
	}

	user, err := h.UserRepo.GetByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Verify old password
	if !services.VerifyPassword(req.OldPassword, user.PasswordHash) {
		return c.Status(401).JSON(fiber.Map{"error": "Incorrect old password"})
	}

	// Hash new password
	hash, err := services.HashPassword(req.NewPassword)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not hash password"})
	}

	user.PasswordHash = hash
	if err := h.UserRepo.Update(user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update password"})
	}

	return c.JSON(fiber.Map{"success": true})
}
