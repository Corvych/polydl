package models

type Group struct {
	ID         uint   `gorm:"primaryKey"`
	Name       string `gorm:"not null"`
	InviteCode string `gorm:"unique;not null"`
}
