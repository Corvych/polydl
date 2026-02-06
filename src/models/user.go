package models

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
