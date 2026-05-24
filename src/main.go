package main

import (
	"log"
	"os"
	"time"

	"polydl/database"
	"polydl/handlers"
	"polydl/models"
	"polydl/repositories"
	"polydl/services"
	"polydl/services/websocket"

	fastwebsocket "github.com/fasthttp/websocket"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func main() {
	// Initialize Database
	db := database.Connect()

	// Initialize Repositories
	userRepo := repositories.NewUserRepository(db)
	subjectRepo := repositories.NewSubjectRepository(db)
	deadlineRepo := repositories.NewDeadlineRepository(db)
	groupRepo := repositories.NewGroupRepository(db)

	// Initialize WebSocket Hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize API Handlers
	api := handlers.NewAPI(userRepo, subjectRepo, deadlineRepo, groupRepo, hub)

	// Background Job: Clean up expired deadlines and send notifications
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			// Clean up expired deadlines (> 1 month old)
			threshold := time.Now().AddDate(0, -1, 0) // 1 month ago
			if err := deadlineRepo.DeleteExpired(threshold); err != nil {
				log.Println("Failed to delete expired deadlines:", err)
			}

			// Send notifications for deadlines due in exactly 24 hours
			dueTimeStart := time.Now().Add(24 * time.Hour)
			dueTimeEnd := dueTimeStart.Add(1 * time.Hour)
			
			// Find active deadlines in this timeframe
			var upcomingDeadlines []models.Deadline
			db.Preload("User").Preload("Group").Where("ts_due >= ? AND ts_due < ?", dueTimeStart, dueTimeEnd).Find(&upcomingDeadlines)

			for _, d := range upcomingDeadlines {
				if d.UserID != nil && d.User.TelegramID != nil {
					services.SendNotification(*d.User.TelegramID, "⏰ **Напоминание:** Дедлайн \""+d.Name+"\" истекает через 24 часа!")
				} else if d.GroupID != nil {
					// Group deadline, notify all users in group with TelegramID
					users, _ := userRepo.GetByGroupID(*d.GroupID)
					for _, u := range users {
						if u.TelegramID != nil {
							services.SendNotification(*u.TelegramID, "⏰ **Напоминание (Группа):** Дедлайн \""+d.Name+"\" истекает через 24 часа!")
						}
					}
				}
			}
		}
	}()

	// Start Kafka Consumer
	services.StartKafkaConsumer(userRepo)

	// Seed SuperAdmin
	func() {
		username := os.Getenv("SUPERADMIN_USERNAME")
		password := os.Getenv("SUPERADMIN_PASSWORD")

		if username == "" || password == "" {
			log.Println("Note: SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD not set. Skipping superadmin seeding.")
			return
		}

		hash, err := services.HashPassword(password)
		if err != nil {
			log.Println("Failed to hash superadmin password:", err)
			return
		}

		_, err = userRepo.GetSuperAdmin()
		if err == nil {
			log.Println("SuperAdmin already exists. Skipping update.")
			return
		}

		// Create New
		log.Println("Seeding SuperAdmin...")
		user := models.User{
			Name:         "Данил",
			Surname:      "Колбасенко",
			Username:     username,
			PasswordHash: hash,
			Role:         models.RoleSuperAdmin,
		}

		if err := userRepo.Create(&user); err != nil {
			log.Println("Failed to seed SuperAdmin:", err)
		} else {
			log.Println("SuperAdmin seeded successfully.")
		}
	}()

	app := fiber.New()

	// Static files
	app.Use("/static", static.New("./public"))

	// WebSocket Route
	app.Get("/ws", func(c fiber.Ctx) error {
		tokenString := c.Query("token")
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized: Token missing")
		}

		// Validate Token
		userId, err := handlers.ValidateToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized: Invalid token")
		}

		// Fetch user to get GroupID
		user, err := userRepo.GetByID(userId)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized: User not found")
		}

		// Now upgrade with the data we already have
		return websocket.New(func(_ fiber.Ctx, conn *fastwebsocket.Conn) {
			// Create a new client
			client := &websocket.Client{
				Hub:     hub,
				Conn:    conn,
				Send:    make(chan []byte, 256),
				UserID:  user.ID,
				GroupID: user.GroupID,
			}
			client.Hub.Register <- client

			// Allow collection of memory referenced by the caller by doing all work in
			// new goroutines.
			go client.WritePump()
			client.ReadPump()
		})(c)
	})

	// Public Group Routes
	app.Get("/groups/invite/:code", api.GetGroupByInviteCode)

	// Routes
	api.RegisterDeadlineRoutes(app)

	// Auth Routes
	auth := app.Group("/auth")
	auth.Post("/register", api.Register)
	auth.Post("/login", api.Login)

	// Group Management (SuperAdmin)
	groups := app.Group("/groups")
	groups.Use(handlers.Protected(userRepo), handlers.SuperAdminOnly())

	groups.Get("/", api.ListGroups)
	groups.Get("/:id", api.GetGroup)
	groups.Post("/", api.CreateGroup)
	groups.Put("/:id", api.UpdateGroup)
	groups.Delete("/:id", api.DeleteGroup)
	groups.Get("/:id/members", api.GetGroupMembers)
	groups.Delete("/:id/members/:userId", api.RemoveMemberFromGroup)

	// Admin Group Actions
	adminGroup := app.Group("/group")
	adminGroup.Use(handlers.Protected(userRepo), handlers.AdminOnly())
	adminGroup.Put("/", api.UpdateOwnGroup)

	// User Management
	users := app.Group("/users")
	users.Use(handlers.Protected(userRepo))

	users.Get("/", api.ListUsers)
	users.Post("/", api.CreateUser)

	usersSA := users.Group("/")
	usersSA.Use(handlers.SuperAdminOnly())
	usersSA.Put("/:id", api.UpdateUser)
	usersSA.Put("/:id/role", api.UpdateRole)
	usersSA.Delete("/:id", api.DeleteUser)

	// Profile Management (Authenticated)
	profile := app.Group("/profile")
	profile.Use(handlers.Protected(userRepo))

	profile.Get("/", api.GetProfile)
	profile.Put("/", api.UpdateProfile)
	profile.Put("/password", api.ChangePassword)
	profile.Post("/join-group", api.JoinGroup)
	profile.Post("/leave-group", api.LeaveGroup)
	profile.Post("/telegram-link", api.GenerateTelegramLink)
	profile.Post("/telegram-unlink", api.UnlinkTelegram)

	// Group Management (Admin)
	adminGroup.Get("/members", api.GetMyGroupMembers)
	adminGroup.Delete("/members/:id", api.KickMember)
	adminGroup.Put("/members/:id/promote", api.MakeGroupAdmin)
	adminGroup.Put("/members/:id/demote", api.RemoveGroupAdmin)

	// Subject Management
	subjects := app.Group("/subjects")
	subjects.Get("/", api.ListSubjects)
	subjects.Get("/:id", api.GetSubject)

	subjectsProtected := subjects.Group("/")
	subjectsProtected.Use(handlers.Protected(userRepo), handlers.AdminOnly())

	subjectsProtected.Post("/", api.CreateSubject)
	subjectsProtected.Put("/:id", api.UpdateSubject)
	subjectsProtected.Delete("/:id", api.DeleteSubject)

	// Roadmap (Completion)
	apiDeadlines := app.Group("/deadlines")
	apiDeadlinesProtected := apiDeadlines.Group("/")
	apiDeadlinesProtected.Use(handlers.Protected(userRepo))

	apiDeadlinesProtected.Post("/:id/complete", api.MarkCompleted)
	apiDeadlinesProtected.Delete("/:id/complete", api.MarkIncomplete)

	// Bot API (Internal & WebApp)
	botAPI := app.Group("/bot")
	botAPI.Get("/deadlines", api.GetBotDeadlines)
	botAPI.Post("/webapp-auth", api.WebAppAuth)
	botAPI.Post("/deadlines/:id/complete", api.BotMarkCompleted)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Fatal(app.Listen(":" + port))
}
