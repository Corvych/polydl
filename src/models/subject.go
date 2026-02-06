package models

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
