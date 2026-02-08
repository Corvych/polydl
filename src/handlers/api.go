package handlers

import (
	"polydl/repositories"
	"polydl/services/websocket"
)

type API struct {
	UserRepo     *repositories.UserRepository
	SubjectRepo  *repositories.SubjectRepository
	DeadlineRepo *repositories.DeadlineRepository
	GroupRepo    *repositories.GroupRepository
	Hub          *websocket.Hub
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
