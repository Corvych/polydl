package handlers

import (
	"strings"

	"polydl/models"
	"polydl/repositories"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func Protected(userRepo *repositories.UserRepository) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token format"})
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return SecretKey, nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims := token.Claims.(jwt.MapClaims)

		// Fetch fresh user data from DB
		if userID, ok := claims["user_id"].(float64); ok {
			user, err := userRepo.GetByID(uint(userID))
			if err != nil {
				return c.Status(401).JSON(fiber.Map{"error": "User not found"})
			}
			c.Locals("currentUser", user)
		} else {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token payload"})
		}

		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		user, ok := c.Locals("currentUser").(*models.User)
		if !ok {
			return c.Status(500).JSON(fiber.Map{"error": "User context missing"})
		}

		for _, role := range roles {
			if user.Role == role {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}

// Shortcut for admin access
func AdminOnly() fiber.Handler {
	return RequireRole(models.RoleAdmin, models.RoleSuperAdmin)
}

// Shortcut for superadmin access
func SuperAdminOnly() fiber.Handler {
	return RequireRole(models.RoleSuperAdmin)
}
