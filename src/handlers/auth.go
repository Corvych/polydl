package handlers

import (
	"os"
	"time"

	"polydl/models"
	"polydl/services"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Config
var SecretKey = []byte(getSecretKey())

func getSecretKey() string {
	key := os.Getenv("JWT_SECRET")
	if key == "" {
		return "secret-key-change-me"
	}
	return key
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *API) Register(c fiber.Ctx) error {
	var req RegisterRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	// Check if user exists (optional but good practice)
	// For now, assuming username unique constraint handles it

	hash, _ := services.HashPassword(req.Password) // Handle error in prod

	user := models.User{
		Name:         req.Name,
		Surname:      req.Surname,
		Username:     req.Username,
		PasswordHash: hash,
		Role:         models.RoleUser, // Default role
	}

	if err := h.UserRepo.Create(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Could not create user"})
	}

	return c.JSON(fiber.Map{"success": true})
}

func (h *API) Login(c fiber.Ctx) error {
	var req LoginRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user, err := h.UserRepo.GetByUsername(req.Username)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if !services.VerifyPassword(req.Password, user.PasswordHash) {
		return c.Status(401).JSON(fiber.Map{"error": "Incorrect password"})
	}

	// Create JWT
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(SecretKey)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not login"})
	}

	return c.JSON(fiber.Map{"token": t})
}
