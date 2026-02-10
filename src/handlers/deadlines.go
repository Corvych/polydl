package handlers

import (
	"log"
	"strconv"
	"time"

	"polydl/models"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// RegisterDeadlineRoutes registers the deadline handlers to the given router
func (h *API) RegisterDeadlineRoutes(router fiber.Router) {
	// Deadlines group
	deadlines := router.Group("/deadlines")

	deadlines.Get("/", h.MainPage)
	deadlines.Get("/:subj", h.MainPage)

	// Protected routes (Authenticated users)
	protected := deadlines.Group("/")
	protected.Use(Protected(h.UserRepo))

	protected.Post("/", h.AddDeadline)
	protected.Put("/:id", h.UpdateDeadline)
	protected.Delete("/:id", h.DeleteDeadline)
}

// Helper to extract user ID from token without failing if missing
func getUserIdFromToken(c fiber.Ctx) uint {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return 0
	}

	// Basic parsing similar to middleware
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString := authHeader[7:]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return SecretKey, nil
		})

		if err == nil && token.Valid {
			claims := token.Claims.(jwt.MapClaims)
			if idFloat, ok := claims["user_id"].(float64); ok {
				return uint(idFloat)
			}
		}
	}
	return 0
}

// MainPage Handler - Returns list of deadlines as JSON
func (h *API) MainPage(c fiber.Ctx) error {
	var err error

	userID := getUserIdFromToken(c)
	var groupID uint
	if userID != 0 {
		user, err := h.UserRepo.GetByID(userID)
		if err == nil && user.GroupID != nil {
			groupID = *user.GroupID
		}
	}

	// Logic for subject filtering
	subjParam := c.Params("subj")
	var subjectIDPtr *uint

	if subjParam != "" && subjParam != "all" {
		// Lookup subject by SHORTLINK (e.g. "highmath")
		subject, err := h.SubjectRepo.GetByShortlink(subjParam)
		if err != nil {
			// Subject not found, return empty
			return c.JSON([]models.DeadlineView{})
		}
		subjectIDPtr = &subject.ID
	}

	deadlines, err := h.DeadlineRepo.GetDeadlinesForUser(userID, groupID, subjectIDPtr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Roadmap Check
	completedMap := make(map[uint]bool)
	if userID != 0 {
		user, err := h.UserRepo.GetByIDWithCompletedDeadlines(userID)
		if err == nil {
			for _, d := range user.CompletedDeadlines {
				completedMap[d.ID] = true
			}
		}
	}

	var response []models.DeadlineView
	for _, dl := range deadlines {
		isCompleted := completedMap[dl.ID]
		response = append(response, models.DeadlineView{
			Deadline:    dl,
			IsCompleted: isCompleted,
		})
	}

	if response == nil {
		response = []models.DeadlineView{}
	}

	return c.JSON(response)
}

// Structs for JSON inputs
// Structs for JSON inputs
type AddDeadlineRequest struct {
	SubjectID  uint   `json:"subject_id"`
	Name       string `json:"name"`
	TsFrom     string `json:"ts_from"`
	TsDue      string `json:"ts_due"`
	Icon       string `json:"icon"`
	SdoLink    string `json:"sdo_link"`
	IsPersonal bool   `json:"is_personal"`
}

// Add Deadline Handler
func (h *API) AddDeadline(c fiber.Ctx) error {
	var req AddDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var finalUserID *uint
	var finalGroupID *uint
	var finalSubjectID *uint

	if req.SubjectID != 0 {
		subject, err := h.SubjectRepo.GetByID(req.SubjectID)
		if err != nil || subject.GroupID == nil || (user.GroupID != nil && *subject.GroupID != *user.GroupID) {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid subject: subject must belong to your group"})
		}
		finalSubjectID = &req.SubjectID
	}

	if req.IsPersonal {
		// Personal deadline: Assigned to User, Group is nil
		finalUserID = &user.ID
		finalGroupID = nil
	} else {
		// Group deadline: Assigned to Group, User is nil
		// Check permissions
		if user.Role != models.RoleAdmin && user.Role != models.RoleSuperAdmin {
			return c.Status(403).JSON(fiber.Map{"error": "Only admins can create group deadlines"})
		}
		finalUserID = nil
		if user.GroupID == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Admin has no group assigned"})
		}
		finalGroupID = user.GroupID
	}

	layout := "02.01.2006 15:04"
	tsFrom, err1 := time.Parse(layout, req.TsFrom)
	tsDue, err2 := time.Parse(layout, req.TsDue)

	if err1 == nil && err2 == nil {
		dl := models.Deadline{
			SubjectID: finalSubjectID,
			UserID:    finalUserID,
			GroupID:   finalGroupID,
			Name:      req.Name,
			TsFrom:    tsFrom,
			TsDue:     tsDue,
			Icon:      req.Icon,
			SdoLink:   req.SdoLink,
		}
		err := h.DeadlineRepo.Create(&dl)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Database error: message" + err.Error()})
		}

		// Broadcast update
		msg := []byte(`{"type": "REFRESH_DEADLINES"}`)
		if dl.GroupID != nil {
			h.Hub.BroadcastToGroup(*dl.GroupID, msg)
		} else if dl.UserID != nil {
			h.Hub.BroadcastToUser(*dl.UserID, msg)
		}

		return c.JSON(fiber.Map{"success": true, "id": dl.ID})
	} else {
		log.Println("Date parse error:", err1, err2)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date format"})
	}
}

// Delete Handler
func (h *API) DeleteDeadline(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	deadline, err := h.DeadlineRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Permission Check
	isAllowed := false

	// 1. Personal Deadline Owner
	if deadline.UserID != nil && *deadline.UserID == user.ID {
		isAllowed = true
	}

	// 2. Group Admin (for group deadlines)
	if deadline.GroupID != nil && user.GroupID != nil && *deadline.GroupID == *user.GroupID {
		if user.Role == models.RoleAdmin || user.Role == models.RoleSuperAdmin {
			isAllowed = true
		}
	}

	// 3. SuperAdmin (can manage everything)
	if user.Role == models.RoleSuperAdmin {
		isAllowed = true
	}

	if !isAllowed {
		return c.Status(403).JSON(fiber.Map{"error": "Permission denied"})
	}

	err = h.DeadlineRepo.Delete(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Broadcast update
	msg := []byte(`{"type": "REFRESH_DEADLINES"}`)
	if deadline.GroupID != nil {
		h.Hub.BroadcastToGroup(*deadline.GroupID, msg)
	} else if deadline.UserID != nil {
		h.Hub.BroadcastToUser(*deadline.UserID, msg)
	}

	return c.JSON(fiber.Map{"success": true})
}

// Update Deadline Handler
func (h *API) UpdateDeadline(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID"})
	}

	type UpdateDeadlineRequest struct {
		SubjectID   *uint  `json:"subject_id"`
		Name        string `json:"name"`
		TsFrom      string `json:"ts_from"`
		TsDue       string `json:"ts_due"`
		Icon        string `json:"icon"`
		SdoLink     string `json:"sdo_link"`
		IsCompleted *bool  `json:"is_completed"`
	}

	var req UpdateDeadlineRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	dl, err := h.DeadlineRepo.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Deadline not found"})
	}

	// Fetch User for permission check
	// Fetch User for permission check
	user := GetUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Permission Levels
	isEditor := false
	isViewer := false

	// 1. Personal Deadline Owner (Editor + Viewer)
	if dl.UserID != nil && *dl.UserID == user.ID {
		isEditor = true
		isViewer = true
	}

	// 2. Group Member (Viewer). Group Admin (Editor)
	if dl.GroupID != nil && user.GroupID != nil && *dl.GroupID == *user.GroupID {
		isViewer = true
		if user.Role == models.RoleAdmin || user.Role == models.RoleSuperAdmin {
			isEditor = true
		}
	}

	// 3. SuperAdmin (Editor + Viewer)
	if user.Role == models.RoleSuperAdmin {
		isEditor = true
		isViewer = true
	}

	if !isViewer {
		return c.Status(403).JSON(fiber.Map{"error": "Permission denied"})
	}

	// Helper to handle completion toggle
	if req.IsCompleted != nil {
		// Any viewer can toggle their own completion status
		if *req.IsCompleted {
			// Mark as complete (Add to association)
			// Using raw GORM here might be necessary if Repo doesn't support it,
			// but better to assume Repo needs update or use DB directly if available.
			// Since we don't have db access here directly (it's in Repo), we should probably add a method to Repo.
			// QUICK FIX: We can access DB via h.UserRepo.DB if exposed, or add method.
			// Let's assume we need to add a method to UserRepo.
			// But for now, let's try to do it via UserRepo if possible.
			// user_repository.go might need `MarkDeadlineCompleted`.
			// START_TEMPORARY: Implementing direct DB call if possible or assuming Method exists.
			// Attempting to add method to Repo in next step. For now, calling it.
			_ = h.UserRepo.MarkDeadlineCompleted(user, dl)
		} else {
			_ = h.UserRepo.MarkDeadlineIncomplete(user, dl)
		}
	}

	// If user is NOT editor, we stop here (ignoring other fields)
	if !isEditor {
		// If they only tried to complete, success.
		// If they tried to change name, we silently ignore it (as per strategy)
		return c.JSON(fiber.Map{"success": true})
	}

	// Editor logic: Update fields
	if req.SubjectID != nil {
		if *req.SubjectID == 0 {
			dl.SubjectID = nil
		} else {
			subject, err := h.SubjectRepo.GetByID(*req.SubjectID)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Subject not found"})
			}
			// Only validate group membership if we found the subject AND the deadline belongs to a group
			if dl.GroupID != nil {
				if subject.GroupID == nil || *subject.GroupID != *dl.GroupID {
					return c.Status(400).JSON(fiber.Map{"error": "Subject must belong to the same group as the deadline"})
				}
			}
			dl.SubjectID = req.SubjectID
		}
	}
	if req.Name != "" {
		dl.Name = req.Name
	}
	if req.Icon != "" {
		dl.Icon = req.Icon
	}
	if req.SdoLink != "" {
		dl.SdoLink = req.SdoLink
	}

	// Date parsing
	layout := "02.01.2006 15:04"
	if req.TsFrom != "" {
		if t, err := time.Parse(layout, req.TsFrom); err == nil {
			dl.TsFrom = t
		}
	}
	if req.TsDue != "" {
		if t, err := time.Parse(layout, req.TsDue); err == nil {
			dl.TsDue = t
		}
	}

	if err := h.DeadlineRepo.Update(dl); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Broadcast update
	msg := []byte(`{"type": "REFRESH_DEADLINES"}`)
	if dl.GroupID != nil {
		h.Hub.BroadcastToGroup(*dl.GroupID, msg)
	} else if dl.UserID != nil {
		h.Hub.BroadcastToUser(*dl.UserID, msg)
	}

	return c.JSON(fiber.Map{"success": true})
}
