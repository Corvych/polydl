package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	// Default generic connection string. User should configure their own via env or edit this.
	dsn := "host=localhost user=postgres password=postgres dbname=polydl port=5432 sslmode=disable TimeZone=Europe/Moscow"
	if os.Getenv("DATABASE_URL") != "" {
		dsn = os.Getenv("DATABASE_URL")
	}

	connection, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Note: Ensure you have a PostgreSQL database running and created.")
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Connected to database successfully")
	DB = connection

	log.Println("Running migrations...")
	err = connection.AutoMigrate(&Subject{}, &Deadline{}, &User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migrated")

	// Seed subjects if empty
	SeedSubjects()

	// Seed SuperAdmin if not exists
	SeedSuperAdmin()
}

func SeedSuperAdmin() {
	var count int64
	DB.Model(&User{}).Where("role = ?", RoleSuperAdmin).Count(&count)
	if count > 0 {
		return
	}

	username := os.Getenv("SUPERADMIN_USERNAME")
	password := os.Getenv("SUPERADMIN_PASSWORD")

	if username == "" || password == "" {
		log.Println("Note: SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD not set. Skipping superadmin seeding.")
		return
	}

	log.Println("Seeding SuperAdmin...")

	// We need to use the utils package for hashing, but we can't import handlers to avoid circular dependency
	// Ideally utils/auth.go should be imported here.
	// Since I already verified utils/auth.go exists and is in a separate package, I can import it.

	hash, err := HashPassword(password)
	if err != nil {
		log.Println("Failed to hash superadmin password:", err)
		return
	}

	user := User{
		Name:         "Super",
		Surname:      "Admin",
		Username:     username,
		PasswordHash: hash,
		Role:         RoleSuperAdmin,
	}

	if err := DB.Create(&user).Error; err != nil {
		log.Println("Failed to seed SuperAdmin:", err)
	} else {
		log.Println("SuperAdmin seeded successfully.")
	}
}

func SeedSubjects() {
	// Seed logic removed per request
	log.Println("Seeding skipped.")
}
