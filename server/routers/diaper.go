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

func SetupDiaperRoutes(api *gin.RouterGroup) {
	diaper := api.Group("/diaper")
	{
		diaper.POST("", checkBabyAccess(), func(c *gin.Context) {
			var diaper models.Diaper
			if err := c.ShouldBindJSON(&diaper); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			diaper.ID = uuid.NewString()
			if err := database.DB.Create(&diaper).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, diaper)
		})

		diaper.GET("", func(c *gin.Context) {
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

			var diapers []models.Diaper
			if err := database.DB.Where("baby_id IN ?", babyIDs).Find(&diapers).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, diapers)
		})
		diaper.DELETE("/:id/date/:year/:month/:day", checkBabyAccess(), func(c *gin.Context) {
			id := c.GetHeader("X-Parrent-User-ID")
			babyID := c.Param("id")
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

			var diapers []models.Diaper
			if err := database.DB.Find(&diapers, "id = ? AND baby_id = ? AND created_at >= ? AND created_at < ?", id, babyID, startOfDay, endOfDay).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, diapers)
		})

		diaper.PUT("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			var diaper models.Diaper
			if err := c.ShouldBindJSON(&diaper); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			diaper.ID = id
			if err := database.DB.Save(&diaper).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, diaper)
		})
	}
}
