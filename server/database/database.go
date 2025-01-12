package database

import (
	"log"
	"os"
	"strings"

	"baby-tracker/models"

	"github.com/joho/godotenv"
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

	err = db.AutoMigrate(&models.User{}, &models.Baby{}, &models.Sleep{}, &models.Diaper{}, &models.Nursing{})
	if err != nil {
		log.Fatal("Failed to migrate database")
	}

	DB = db
}
