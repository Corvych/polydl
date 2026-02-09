package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// Mark Deadline as Completed
func (h *API) MarkCompleted(c fiber.Ctx) error {
	idParam := c.Params("id")
	deadlineID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	currentUser := GetUser(c)
	if currentUser == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	user, err := h.UserRepo.GetByIDWithCompletedDeadlines(currentUser.ID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	deadline, err := h.DeadlineRepo.GetByID(uint(deadlineID))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Check if already completed
	for _, d := range user.CompletedDeadlines {
		if d.ID == uint(deadlineID) {
			return c.JSON(fiber.Map{"success": true, "message": "Already completed"})
		}
	}

	// Association
	if err := h.UserRepo.MarkDeadlineCompleted(user, deadline); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not mark as completed"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// Mark Deadline as Incomplete
func (h *API) MarkIncomplete(c fiber.Ctx) error {
	idParam := c.Params("id")
	deadlineID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	deadline, err := h.DeadlineRepo.GetByID(uint(deadlineID))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Delete association
	if err := h.UserRepo.MarkDeadlineIncomplete(user, deadline); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not remove completion"})
	}

	return c.JSON(fiber.Map{"success": true})
}
