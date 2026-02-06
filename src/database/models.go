package database

import (
	"time"
)

// Role Enum
const (
	RoleSuperAdmin = "superadmin"
	RoleAdmin      = "admin"
	RoleUser       = "user"
)

type User struct {
	ID                 uint       `gorm:"primaryKey"`
	Name               string     `gorm:"not null"`
	Surname            string     `gorm:"not null"`
	Username           string     `gorm:"unique;not null"`
	PasswordHash       string     `gorm:"not null"` // Argon2 hash
	Role               string     `gorm:"not null;default:'user'"`
	CompletedDeadlines []Deadline `gorm:"many2many:user_deadlines;"`
	GroupID            *uint      // Nullable for SuperAdmin
	Group              Group      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

type Group struct {
	ID         uint   `gorm:"primaryKey"`
	Name       string `gorm:"not null"`
	InviteCode string `gorm:"unique;not null"`
}

type Deadline struct {
	ID        uint      `gorm:"primaryKey"`
	SubjectID uint      `gorm:"not null"`                                      // Foreign key
	Subject   Subject   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"` // Association
	Name      string    `gorm:"not null"`
	TsFrom    time.Time `gorm:"not null"`
	TsDue     time.Time `gorm:"not null"`
	SdoLink   string
	FAwesome  string
}

type Subject struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"not null"`
	Shortname string `gorm:"not null"`
	Shortlink string `gorm:"not null"`
	Icon      string `gorm:"not null"`
	PVSPLink  string
	PPhisLink string
	GroupID   *uint // Nullable for SuperAdmin global subjects if needed
	Group     Group `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
