package models

import (
	"time"
)

type Deadline struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SubjectID *uint     `gorm:"index" json:"subject_id"`                                      // Nullable Foreign key
	Subject   Subject   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"subject"` // Association
	UserID    *uint     `gorm:"index" json:"user_id"`                                         // Nullable Foreign key for Personal Deadlines
	User      User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`       // Association (skip JSON to avoid cycles/bloat)
	GroupID   *uint     `gorm:"index" json:"group_id"`                                        // Nullable Foreign key for Group Deadlines
	Group     Group     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`       // Association
	Name      string    `gorm:"not null" json:"name"`
	TsFrom    time.Time `gorm:"not null" json:"ts_from"`
	TsDue     time.Time `gorm:"not null" json:"ts_due"`
	SdoLink   string    `json:"sdo_link"`
	Icon      string    `json:"icon"`
}

type DeadlineView struct {
	Deadline
	IsCompleted bool `json:"is_completed"`
}
