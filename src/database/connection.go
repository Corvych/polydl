package database

import (
	"polydl/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() *gorm.DB {
	// Default generic connection string. User should configure their own via env or edit this.
	dsn := "host=localhost user=postgres password=postgres dbname=polydl port=5432 sslmode=disable TimeZone=Europe/Moscow"
	if os.Getenv("DATABASE_URL") != "" {
		dsn = os.Getenv("DATABASE_URL")
	}

	connection, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Println("Note: Ensure you have a PostgreSQL database running and created.")
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Connected to database successfully")

	log.Println("Running migrations...")
	err = connection.AutoMigrate(&models.Subject{}, &models.Deadline{}, &models.User{}, &models.Group{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migrated")

	return connection
}
