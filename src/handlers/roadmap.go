package handlers

import (
	"deadline-website/database"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// Mark Deadline as Completed
func MarkCompleted(c fiber.Ctx) error {
	idParam := c.Params("id")
	deadlineID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	userID := getUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user database.User
	if err := database.DB.Preload("CompletedDeadlines").First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	var deadline database.Deadline
	if err := database.DB.First(&deadline, deadlineID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Check if already completed
	for _, d := range user.CompletedDeadlines {
		if d.ID == uint(deadlineID) {
			return c.JSON(fiber.Map{"success": true, "message": "Already completed"})
		}
	}

	// Association
	if err := database.DB.Model(&user).Association("CompletedDeadlines").Append(&deadline); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not mark as completed"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Mark Deadline as Incomplete
func MarkIncomplete(c fiber.Ctx) error {
	idParam := c.Params("id")
	deadlineID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	userID := getUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user database.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	var deadline database.Deadline
	if err := database.DB.First(&deadline, deadlineID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Delete association
	if err := database.DB.Model(&user).Association("CompletedDeadlines").Delete(&deadline); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not remove completion"})
	}

	return c.JSON(fiber.Map{"success": true})
}
