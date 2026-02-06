package main

import (
	"log"
	"os"

	"deadline-website/database"
	"deadline-website/handlers"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func main() {
	// Initialize Database
	database.Connect()

	app := fiber.New()

	// Static files
	app.Use("/static", static.New("./public"))

	// Routes
	handlers.RegisterDeadlineRoutes(app)

	// Auth Routes
	auth := app.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// User Management (SuperAdmin)
	users := app.Group("/users")
	users.Use(handlers.Protected(), handlers.SuperAdminOnly())

	users.Get("/", handlers.ListUsers)
	users.Put("/:id", handlers.UpdateUser)
	users.Put("/:id/role", handlers.UpdateRole)
	users.Delete("/:id", handlers.DeleteUser)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Fatal(app.Listen(":" + port))
}
