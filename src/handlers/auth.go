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
	Name       string `json:"name"`
	Surname    string `json:"surname"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	InviteCode string `json:"invite_code"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *API) Register(c fiber.Ctx) error {
	var req RegisterRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "errors.invalidJson"})
	}

	// Basic validation
	if req.Username == "" || req.Password == "" || req.Name == "" || req.Surname == "" {
		return c.Status(400).JSON(fiber.Map{"error": "errors.allFieldsRequired"})
	}

	// Check if user exists (including soft-deleted)
	existing, err := h.UserRepo.GetByUsernameUnscoped(req.Username)
	if err == nil && existing != nil && existing.ID != 0 {
		if existing.DeletedAt.Valid {
			// User was soft-deleted, we can hard-delete the old record to free up the username
			if err := h.UserRepo.DeletePermanently(existing.ID); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "errors.registerFailed"})
			}
		} else {
			// User exists and is active
			return c.Status(400).JSON(fiber.Map{"error": "errors.usernameTaken"})
		}
	}

	hash, err := services.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "errors.registerFailed"})
	}

	user := models.User{
		Name:         req.Name,
		Surname:      req.Surname,
		Username:     req.Username,
		PasswordHash: hash,
		Role:         models.RoleUser, // Default role
	}

	if req.InviteCode != "" {
		group, err := h.GroupRepo.GetByInviteCode(req.InviteCode)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "errors.invalidInviteCode"})
		}
		user.GroupID = &group.ID
	}

	if err := h.UserRepo.Create(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "errors.registerFailed"})
	}

	token, err := generateToken(&user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "errors.loginFailed"})
	}

	return c.JSON(fiber.Map{"success": true, "token": token})
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

	token, err := generateToken(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not login"})
	}

	return c.JSON(fiber.Map{"token": token})
}

func generateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SecretKey)
}

func ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return SecretKey, nil
	})

	if err != nil || !token.Valid {
		return 0, err
	}

	claims := token.Claims.(jwt.MapClaims)
	if idFloat, ok := claims["user_id"].(float64); ok {
		return uint(idFloat), nil
	}
	return 0, jwt.ErrSignatureInvalid
}
