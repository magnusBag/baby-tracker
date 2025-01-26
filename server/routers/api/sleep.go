package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupSleepRoutes(api *gin.RouterGroup) {
	sleep := api.Group("/sleep")
	sleep.Use(AuthMiddleware()) // Add authentication middleware
	{
		sleep.POST("", checkBabyAccess(), func(c *gin.Context) {
			var sleepInput struct {
				Start  string `json:"start"`
				End    string `json:"end"`
				BabyID string `json:"babyId"`
			}
			if err := c.ShouldBindJSON(&sleepInput); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Parse the time strings with their original timezone (from RFC3339)
			start, err := time.Parse(time.RFC3339, sleepInput.Start)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format"})
				return
			}

			end, err := time.Parse(time.RFC3339, sleepInput.End)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end time format"})
				return
			}

			// Store times in UTC
			sleep := models.Sleep{
				ID:     uuid.NewString(),
				Start:  start.UTC(),
				End:    end.UTC(),
				BabyID: sleepInput.BabyID,
			}

			if err := database.DB.Create(&sleep).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Return the original times with their timezone information
			c.JSON(http.StatusOK, gin.H{
				"id":     sleep.ID,
				"start":  start.Format(time.RFC3339),
				"end":    end.Format(time.RFC3339),
				"babyId": sleep.BabyID,
			})
		})

		sleep.GET("", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			// Get babyId from query parameter
			babyID := c.Query("babyId")
			if babyID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Baby ID not provided"})
				return
			}

			// Check if user has access to this baby
			if err := database.DB.Preload("Babies").First(&user, "id = ?", user.ID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				return
			}

			hasAccess := false
			for _, baby := range user.Babies {
				if baby.ID == babyID {
					hasAccess = true
					break
				}
			}

			if !hasAccess {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No access to this baby"})
				return
			}

			var sleeps []models.Sleep
			if err := database.DB.Where("baby_id = ?", babyID).Find(&sleeps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert times to RFC3339 format
			response := make([]gin.H, len(sleeps))
			for i, sleep := range sleeps {
				response[i] = gin.H{
					"id":     sleep.ID,
					"start":  sleep.Start.Format(time.RFC3339),
					"end":    sleep.End.Format(time.RFC3339),
					"babyId": sleep.BabyID,
				}
			}
			c.JSON(http.StatusOK, response)
		})

		sleep.DELETE("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			if err := database.DB.Delete(&models.Sleep{}, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true})
		})

		sleep.PUT("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			var sleep models.Sleep
			if err := c.ShouldBindJSON(&sleep); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			sleep.ID = id
			if err := database.DB.Save(&sleep).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, sleep)
		})

		sleep.GET("/:id/date/:year/:month/:day", checkBabyAccess(), func(c *gin.Context) {
			//get total hours slept in a day
			year := c.Param("year")
			month := c.Param("month")
			day := strings.Split(c.Param("day"), "T")[0] // Remove any time component

			dateStr := year + "-" + month + "-" + day
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format in URL. Use /id/YYYY/MM/DD"})
				return
			}
			startOfDay := date.AddDate(0, 0, 0)
			endOfDay := startOfDay.AddDate(0, 0, 1)
			babyID := c.Param("id")

			//get all sleeps in a day
			var sleeps []models.Sleep
			if err := database.DB.Where("baby_id = ? AND (start >= ? AND start < ? OR \"end\" >= ? AND \"end\" < ?)",
				babyID, startOfDay, endOfDay, startOfDay, endOfDay).Find(&sleeps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, sleeps)
		})
	}

	// Public routes (no auth required)
	public := api.Group("/public/sleep")
	{
		public.GET("", func(c *gin.Context) {
			shareToken := c.Query("babyId") // Using babyId param to maintain frontend compatibility
			var baby models.Baby
			if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			var sleeps []models.Sleep
			if err := database.DB.Where("baby_id = ?", baby.ID).Find(&sleeps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert times to RFC3339 format
			response := make([]gin.H, len(sleeps))
			for i, sleep := range sleeps {
				response[i] = gin.H{
					"id":     sleep.ID,
					"start":  sleep.Start.Format(time.RFC3339),
					"end":    sleep.End.Format(time.RFC3339),
					"babyId": sleep.BabyID,
				}
			}
			c.JSON(http.StatusOK, response)
		})
	}
}
