package main

import (
	"log"
	"os"

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
			Name:         "Super",
			Surname:      "Admin",
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
	app.Use("/ws", func(c fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return c.Status(fiber.StatusUpgradeRequired).SendString("Upgrade Required")
	})

	app.Get("/ws", websocket.New(func(c *fastwebsocket.Conn) {
		// Create a new client
		client := &websocket.Client{Hub: hub, Conn: c, Send: make(chan []byte, 256)}
		client.Hub.Register <- client

		// Allow collection of memory referenced by the caller by doing all work in
		// new goroutines.
		go client.WritePump()
		client.ReadPump()
	}))

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
	groups.Use(handlers.Protected(), handlers.SuperAdminOnly())

	groups.Get("/", api.ListGroups)
	groups.Get("/:id", api.GetGroup)
	groups.Post("/", api.CreateGroup)
	groups.Put("/:id", api.UpdateGroup)
	groups.Delete("/:id", api.DeleteGroup)
	groups.Get("/:id/members", api.GetGroupMembers)
	groups.Delete("/:id/members/:userId", api.RemoveMemberFromGroup)

	// Admin Group Actions
	adminGroup := app.Group("/group")
	adminGroup.Use(handlers.Protected(), handlers.AdminOnly())
	adminGroup.Put("/", api.UpdateOwnGroup)

	// User Management
	users := app.Group("/users")
	users.Use(handlers.Protected())

	users.Get("/", api.ListUsers)
	users.Post("/", api.CreateUser)

	usersSA := users.Group("/")
	usersSA.Use(handlers.SuperAdminOnly())
	usersSA.Put("/:id", api.UpdateUser)
	usersSA.Put("/:id/role", api.UpdateRole)
	usersSA.Delete("/:id", api.DeleteUser)

	// Profile Management (Authenticated)
	profile := app.Group("/profile")
	profile.Use(handlers.Protected())

	profile.Get("/", api.GetProfile)
	profile.Put("/", api.UpdateProfile)
	profile.Put("/password", api.ChangePassword)
	profile.Post("/join-group", api.JoinGroup)
	profile.Post("/leave-group", api.LeaveGroup)

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
	subjectsProtected.Use(handlers.Protected(), handlers.AdminOnly())

	subjectsProtected.Post("/", api.CreateSubject)
	subjectsProtected.Put("/:id", api.UpdateSubject)
	subjectsProtected.Delete("/:id", api.DeleteSubject)

	// Roadmap (Completion)
	apiDeadlines := app.Group("/deadlines")
	apiDeadlinesProtected := apiDeadlines.Group("/")
	apiDeadlinesProtected.Use(handlers.Protected())

	apiDeadlinesProtected.Post("/:id/complete", api.MarkCompleted)
	apiDeadlinesProtected.Delete("/:id/complete", api.MarkIncomplete)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Fatal(app.Listen(":" + port))
}
