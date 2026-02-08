package models

type Group struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Name       string `gorm:"not null" json:"name"`
	InviteCode string `gorm:"unique;not null" json:"invite_code"`
	Icon       string `json:"icon"`
}
