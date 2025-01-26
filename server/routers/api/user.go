package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(api *gin.RouterGroup) {
	user := api.Group("/user")
	{
		// GET /api/user - Validate user exists
		user.GET("", func(c *gin.Context) {
			userID := c.GetHeader("X-Parrent-User-ID")
			if userID == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not provided"})
				return
			}

			var user models.User
			if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}

			c.JSON(http.StatusOK, user)
		})

		// POST /api/user - Create new user
		user.POST("", func(c *gin.Context) {
			var user models.User
			if err := c.ShouldBindJSON(&user); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Ensure ID is provided
			if user.ID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
				return
			}

			// Check if user already exists
			var existingUser models.User
			if err := database.DB.First(&existingUser, "id = ?", user.ID).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
				return
			}

			// Create new user
			if err := database.DB.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, user)
		})
	}
}
