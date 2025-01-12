package routers

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupNursingRoutes(api *gin.RouterGroup) {
	nursing := api.Group("/nursing")
	{
		nursing.POST("", checkBabyAccess(), func(c *gin.Context) {
			var nursing models.Nursing
			if err := c.ShouldBindJSON(&nursing); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			nursing.ID = uuid.NewString()
			if err := database.DB.Create(&nursing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, nursing)
		})

		nursing.GET("", func(c *gin.Context) {
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

			var nursings []models.Nursing
			if err := database.DB.Where("baby_id IN ?", babyIDs).Find(&nursings).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, nursings)
		})

		nursing.DELETE("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			if err := database.DB.Delete(&models.Nursing{}, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true})
		})
	}
}
