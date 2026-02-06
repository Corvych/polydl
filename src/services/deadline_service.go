package services

import (
	"math"
	"strconv"
	"time"

	"polydl/models" // Assuming module name is polydl, based on previous imports seen in handlers
)

// Counter logic migrated from interface.py
func Counter(dl models.Deadline, isCompleted bool) models.DeadlineView {
	now := time.Now().UTC().Add(3 * time.Hour) // app.py used utcnow + 3 hours (Moscow time?)

	// diff = due - from
	// diff_td = now - from (progress so far)

	diff := dl.TsDue.Sub(dl.TsFrom).Seconds()
	diffTd := now.Sub(dl.TsFrom).Seconds()

	var percent float64
	if diff > 0 {
		percent = math.Round((diffTd/diff)*100*100) / 100 // Round to 2 decimal places
	} else {
		percent = 100
	}

	// Delta logic: time remaining from NOW to DUE
	deltaDuration := dl.TsDue.Sub(now)

	val := 0
	unit := "seconds"
	color := "success"

	totalSeconds := int(deltaDuration.Seconds())

	if totalSeconds < 0 {
		// Overdue
		return models.DeadlineView{
			Deadline:    dl,
			Progress:    percent,
			TimeVal:     0,
			TimeUnit:    "seconds",
			Color:       "danger",
			IsCompleted: isCompleted,
		}
	}

	years := totalSeconds / (365 * 24 * 3600)
	totalSeconds %= 365 * 24 * 3600
	months := totalSeconds / (30 * 24 * 3600) // Approx
	totalSeconds %= 30 * 24 * 3600
	days := totalSeconds / (24 * 3600)
	totalSeconds %= 24 * 3600
	hours := totalSeconds / 3600
	totalSeconds %= 3600
	minutes := totalSeconds / 60
	seconds := totalSeconds % 60

	if years > 0 {
		val = years
		unit = "years"
	} else if months > 0 {
		val = months
		unit = "months"
	} else if days > 0 {
		val = days
		unit = "days"
	} else if hours > 0 {
		val = hours
		unit = "hours"
	} else if minutes > 0 {
		val = minutes
		unit = "minutes"
	} else {
		val = seconds
		unit = "seconds"
	}

	// Python logic: if (value < 2 and unit == "days") or unit in ["hours", "minutes", "seconds"]: danger
	if (unit == "days" && val < 2) || unit == "hours" || unit == "minutes" || unit == "seconds" {
		color = "danger"
	} else {
		color = "success"
	}

	return models.DeadlineView{
		Deadline:    dl,
		Progress:    percent,
		TimeVal:     val,
		TimeUnit:    unit,
		Color:       color,
		IsCompleted: isCompleted,
	}
}

// Helper to Format float to string if needed
func FormatFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', 2, 64)
}
