package models

import "gorm.io/gorm"

// Role Enum
const (
	RoleSuperAdmin = "superadmin"
	RoleAdmin      = "admin"
	RoleUser       = "user"
)

type User struct {
	gorm.Model
	Name               string      `json:"name"`
	Surname            string      `json:"surname"`
	Username           string      `json:"username" gorm:"unique"`
	PasswordHash       string      `json:"-"`
	Role               string      `json:"role"`
	GroupID            *uint       `json:"group_id"`
	Group              *Group      `json:"group,omitempty"`
	CompletedDeadlines []*Deadline `json:"completed_deadlines" gorm:"many2many:user_completed_deadlines;"`
	TelegramID         *int64      `json:"telegram_id" gorm:"unique;index"`
	TelegramAuthToken  string      `json:"-"`
}
