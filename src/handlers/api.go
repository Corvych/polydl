package handlers

import (
	"polydl/repositories"
)

type API struct {
	UserRepo     *repositories.UserRepository
	SubjectRepo  *repositories.SubjectRepository
	DeadlineRepo *repositories.DeadlineRepository
	GroupRepo    *repositories.GroupRepository
}

func NewAPI(u *repositories.UserRepository, s *repositories.SubjectRepository, d *repositories.DeadlineRepository, g *repositories.GroupRepository) *API {
	return &API{
		UserRepo:     u,
		SubjectRepo:  s,
		DeadlineRepo: d,
		GroupRepo:    g,
	}
}
