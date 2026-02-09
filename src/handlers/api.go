package handlers

import (
	"polydl/models"
	"polydl/repositories"
	"polydl/services/websocket"

	"github.com/gofiber/fiber/v3"
)

type API struct {
	UserRepo     *repositories.UserRepository
	SubjectRepo  *repositories.SubjectRepository
	DeadlineRepo *repositories.DeadlineRepository
	GroupRepo    *repositories.GroupRepository
	Hub          *websocket.Hub
}

// Helper to get authenticated user from context
func GetUser(c fiber.Ctx) *models.User {
	if user, ok := c.Locals("currentUser").(*models.User); ok {
		return user
	}
	return nil
}

func NewAPI(u *repositories.UserRepository, s *repositories.SubjectRepository, d *repositories.DeadlineRepository, g *repositories.GroupRepository, h *websocket.Hub) *API {
	return &API{
		UserRepo:     u,
		SubjectRepo:  s,
		DeadlineRepo: d,
		GroupRepo:    g,
		Hub:          h,
	}
}
