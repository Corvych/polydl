package main

import (
	"log"
	"os"

	"polydl/database"
	"polydl/handlers"
	"polydl/models"
	"polydl/repositories"
	"polydl/services"

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

	// Initialize API Handlers
	api := handlers.NewAPI(userRepo, subjectRepo, deadlineRepo, groupRepo)

	// Seed SuperAdmin
	func() {
		_, err := userRepo.GetSuperAdmin()
		if err == nil {
			return // SuperAdmin exists
		}

		username := os.Getenv("SUPERADMIN_USERNAME")
		password := os.Getenv("SUPERADMIN_PASSWORD")

		if username == "" || password == "" {
			log.Println("Note: SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD not set. Skipping superadmin seeding.")
			return
		}

		log.Println("Seeding SuperAdmin...")
		hash, err := services.HashPassword(password)
		if err != nil {
			log.Println("Failed to hash superadmin password:", err)
			return
		}

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
	groups.Post("/", api.CreateGroup)
	groups.Put("/:id", api.UpdateGroup)
	groups.Delete("/:id", api.DeleteGroup)

	// Admin Group Actions
	adminGroup := app.Group("/group")
	adminGroup.Use(handlers.Protected(), handlers.AdminOnly())
	adminGroup.Put("/", api.RenameOwnGroup)

	// User Management
	users := app.Group("/users")
	users.Use(handlers.Protected())

	users.Get("/", api.ListUsers)

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
