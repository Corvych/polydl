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
	ID           uint   `gorm:"primaryKey"`
	Name         string `gorm:"not null"`
	Surname      string `gorm:"not null"`
	Username     string `gorm:"unique;not null"`
	PasswordHash string `gorm:"not null"` // Argon2 hash
	Role         string `gorm:"not null;default:'user'"`
}

type Deadline struct {
	ID        uint      `gorm:"primaryKey"`
	SubjectID uint      `gorm:"not null"`                                       // Foreign key
	Subject   Subject   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"` // Association
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
	PPhisLink string // Added per user request
}
