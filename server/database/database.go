package database

import (
	"log"
	"os"
	"strings"

	"baby-tracker/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Use UTC for database connection
	dbURL := os.Getenv("DATABASE_URL")
	if !strings.Contains(dbURL, "TimeZone=") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&TimeZone=UTC"
		} else {
			dbURL += "?TimeZone=UTC"
		}
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database")
	}

	// Set timezone to UTC
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get underlying *sql.DB")
	}

	_, err = sqlDB.Exec("SET timezone TO 'UTC'")
	if err != nil {
		log.Fatal("Failed to set timezone")
	}

	// Handle column migrations for existing users table
	if db.Migrator().HasTable(&models.User{}) {
		// Handle username column
		if !db.Migrator().HasColumn(&models.User{}, "username") {
			// First add the column as nullable
			if err := db.Exec("ALTER TABLE users ADD COLUMN username text").Error; err != nil {
				log.Fatal("Failed to add username column:", err)
			}

			// Update existing records with a default username based on their ID
			if err := db.Exec("UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL").Error; err != nil {
				log.Fatal("Failed to update existing users with default username:", err)
			}

			// Make the column non-nullable
			if err := db.Exec("ALTER TABLE users ALTER COLUMN username SET NOT NULL").Error; err != nil {
				log.Fatal("Failed to make username non-nullable:", err)
			}
		}

		// Handle password column
		if !db.Migrator().HasColumn(&models.User{}, "password") {
			// First add the column as nullable
			if err := db.Exec("ALTER TABLE users ADD COLUMN password text").Error; err != nil {
				log.Fatal("Failed to add password column:", err)
			}

			// Generate a default hashed password for existing users
			defaultPassword := []byte("changeme123")
			hashedPassword, err := bcrypt.GenerateFromPassword(defaultPassword, bcrypt.DefaultCost)
			if err != nil {
				log.Fatal("Failed to generate default password:", err)
			}

			// Update existing records with the default hashed password
			if err := db.Exec("UPDATE users SET password = ? WHERE password IS NULL", string(hashedPassword)).Error; err != nil {
				log.Fatal("Failed to update existing users with default password:", err)
			}

			// Make the column non-nullable
			if err := db.Exec("ALTER TABLE users ALTER COLUMN password SET NOT NULL").Error; err != nil {
				log.Fatal("Failed to make password non-nullable:", err)
			}
		}
	}

	// Run normal migrations
	err = db.AutoMigrate(&models.User{}, &models.Baby{}, &models.Sleep{}, &models.Diaper{}, &models.Nursing{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	DB = db
}
