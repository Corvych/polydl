package models

import (
	"time"
)

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

type DeadlineView struct {
	Deadline    Deadline
	Progress    float64
	TimeVal     int
	TimeUnit    string
	Color       string // "danger" or "success"
	IsCompleted bool
}
