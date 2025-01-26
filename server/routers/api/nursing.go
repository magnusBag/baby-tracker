package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupNursingRoutes(api *gin.RouterGroup) {
	nursing := api.Group("/nursing")
	nursing.Use(AuthMiddleware()) // Add authentication middleware
	{
		nursing.POST("", checkBabyAccess(), func(c *gin.Context) {
			var nursingInput struct {
				Type   string `json:"type"`
				Amount string `json:"amount"`
				Time   string `json:"time"`
				BabyID string `json:"babyId"`
				Note   string `json:"note"`
			}
			if err := c.ShouldBindJSON(&nursingInput); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Parse the time string
			nursingTime, err := time.Parse(time.RFC3339, nursingInput.Time)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format"})
				return
			}

			nursing := models.Nursing{
				ID:     uuid.NewString(),
				Type:   nursingInput.Type,
				Amount: nursingInput.Amount,
				Time:   nursingTime.UTC(),
				BabyID: nursingInput.BabyID,
				Note:   nursingInput.Note,
			}

			if err := database.DB.Create(&nursing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"id":     nursing.ID,
				"type":   nursing.Type,
				"amount": nursing.Amount,
				"time":   nursing.Time.Format(time.RFC3339),
				"babyId": nursing.BabyID,
				"note":   nursing.Note,
			})
		})

		nursing.GET("", func(c *gin.Context) {
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

			var nursings []models.Nursing
			if err := database.DB.Where("baby_id = ?", babyID).Find(&nursings).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert times to RFC3339 format
			response := make([]gin.H, len(nursings))
			for i, nursing := range nursings {
				response[i] = gin.H{
					"id":     nursing.ID,
					"type":   nursing.Type,
					"amount": nursing.Amount,
					"time":   nursing.Time.Format(time.RFC3339),
					"babyId": nursing.BabyID,
					"note":   nursing.Note,
				}
			}
			c.JSON(http.StatusOK, response)
		})

		nursing.DELETE("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			if err := database.DB.Delete(&models.Nursing{}, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true})
		})

		nursing.PUT("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			var nursing models.Nursing
			if err := c.ShouldBindJSON(&nursing); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			nursing.ID = id
			if err := database.DB.Save(&nursing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, nursing)
		})
	}
}
