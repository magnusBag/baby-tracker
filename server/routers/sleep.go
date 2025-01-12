package routers

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
			userID := c.GetHeader("X-Parrent-User-ID")
			if userID == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not provided"})
				return
			}

			var user models.User
			if err := database.DB.Preload("Babies").First(&user, "id = ?", userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				return
			}

			var babyIDs []string
			for _, baby := range user.Babies {
				babyIDs = append(babyIDs, baby.ID)
			}

			var sleeps []models.Sleep
			if err := database.DB.Where("baby_id IN ?", babyIDs).Find(&sleeps).Error; err != nil {
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
}
