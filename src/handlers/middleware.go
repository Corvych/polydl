package handlers

import (
	"strings"

	"deadline-website/database"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func Protected() fiber.Handler {
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
		c.Locals("user", claims)

		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		user := c.Locals("user").(jwt.MapClaims)
		userRole := user["role"].(string)

		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}

// Shortcut for admin access
func AdminOnly() fiber.Handler {
	return RequireRole(database.RoleAdmin, database.RoleSuperAdmin)
}

// Shortcut for superadmin access
func SuperAdminOnly() fiber.Handler {
	return RequireRole(database.RoleSuperAdmin)
}
