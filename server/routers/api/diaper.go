package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupDiaperRoutes(api *gin.RouterGroup) {
	diaper := api.Group("/diaper")
	diaper.Use(AuthMiddleware()) // Add authentication middleware
	{
		diaper.POST("", checkBabyAccess(), func(c *gin.Context) {
			var diaperInput struct {
				Type   string `json:"type"`
				Time   string `json:"time"`
				BabyID string `json:"babyId"`
				Note   string `json:"note"`
			}
			if err := c.ShouldBindJSON(&diaperInput); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Parse the time string
			diaperTime, err := time.Parse(time.RFC3339, diaperInput.Time)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format"})
				return
			}

			diaper := models.Diaper{
				ID:     uuid.NewString(),
				Type:   diaperInput.Type,
				Time:   diaperTime.UTC(),
				BabyID: diaperInput.BabyID,
				Note:   diaperInput.Note,
			}

			if err := database.DB.Create(&diaper).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"id":     diaper.ID,
				"type":   diaper.Type,
				"time":   diaper.Time.Format(time.RFC3339),
				"babyId": diaper.BabyID,
				"note":   diaper.Note,
			})
		})

		diaper.GET("", func(c *gin.Context) {
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

			var diapers []models.Diaper
			if err := database.DB.Where("baby_id = ?", babyID).Find(&diapers).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert times to RFC3339 format
			response := make([]gin.H, len(diapers))
			for i, diaper := range diapers {
				response[i] = gin.H{
					"id":     diaper.ID,
					"type":   diaper.Type,
					"time":   diaper.Time.Format(time.RFC3339),
					"babyId": diaper.BabyID,
					"note":   diaper.Note,
				}
			}
			c.JSON(http.StatusOK, response)
		})

		diaper.DELETE("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			if err := database.DB.Delete(&models.Diaper{}, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true})
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

	// Public routes (no auth required)
	public := api.Group("/public/diaper")
	{
		public.GET("", func(c *gin.Context) {
			shareToken := c.Query("babyId") // Using babyId param to maintain frontend compatibility
			var baby models.Baby
			if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			var diapers []models.Diaper
			if err := database.DB.Where("baby_id = ?", baby.ID).Find(&diapers).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert times to RFC3339 format
			response := make([]gin.H, len(diapers))
			for i, diaper := range diapers {
				response[i] = gin.H{
					"id":     diaper.ID,
					"type":   diaper.Type,
					"time":   diaper.Time.Format(time.RFC3339),
					"babyId": diaper.BabyID,
					"note":   diaper.Note,
				}
			}
			c.JSON(http.StatusOK, response)
		})
	}
}
