package models

type Subject struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"not null" json:"name"`
	Shortname string `gorm:"not null" json:"shortname"`
	Icon      string `gorm:"not null" json:"icon"`
	PVSPLink  string `json:"pvsp_link"`
	PPhisLink string `json:"pphis_link"`
	GroupID   *uint  `json:"group_id"` // Nullable for SuperAdmin global subjects if needed
	Group     Group  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
