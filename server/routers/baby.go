package routers

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupBabyRoutes(api *gin.RouterGroup) {
	baby := api.Group("/baby")
	{
		baby.POST("", func(c *gin.Context) {
			userID := c.GetHeader("X-Parrent-User-ID")
			if userID == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not provided"})
				return
			}

			var user models.User
			if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				return
			}

			var baby models.Baby
			if err := c.ShouldBindJSON(&baby); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if baby.Name == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Name not provided"})
				return
			}

			baby.ID = uuid.NewString()
			baby.Parents = []models.User{user}
			if err := database.DB.Create(&baby).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, baby)
		})

		baby.GET("", func(c *gin.Context) {
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
			c.JSON(http.StatusOK, user.Babies)
		})

		baby.PUT("/:id", checkBabyAccess(), func(c *gin.Context) {
			id := c.Param("id")
			var baby models.Baby
			if err := database.DB.First(&baby, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			if err := c.ShouldBindJSON(&baby); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := database.DB.Save(&baby).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, baby)
		})
	}
}
