package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SetupBabyRoutes(api *gin.RouterGroup) {
	baby := api.Group("/baby")
	baby.Use(AuthMiddleware()) // Add authentication middleware
	{
		baby.GET("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var baby models.Baby
			if err := database.DB.Preload("Parents").First(&baby, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			// Check if the current user has access to this baby
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)
			hasAccess := false
			for _, parent := range baby.Parents {
				if parent.ID == user.ID {
					hasAccess = true
					break
				}
			}

			if !hasAccess {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No access to this baby"})
				return
			}

			c.JSON(http.StatusOK, baby)
		})

		baby.GET("", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			// Reload user with babies
			if err := database.DB.Preload("Babies").First(&user, "id = ?", user.ID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusOK, user.Babies)
		})

		baby.POST("", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

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

		baby.POST("/:id/parent", func(c *gin.Context) {
			id := c.Param("id")

			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			var baby models.Baby
			if err := database.DB.Preload("Parents").First(&baby, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			// Check if parent is already added
			for _, existingParent := range baby.Parents {
				if existingParent.ID == user.ID {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Parent already added to this baby"})
					return
				}
			}

			baby.Parents = append(baby.Parents, user)
			if err := database.DB.Save(&baby).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, baby)
		})

		baby.POST("/:id/share", func(c *gin.Context) {
			id := c.Param("id")

			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			var baby models.Baby
			if err := database.DB.Preload("Parents").First(&baby, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			// Check if user has access to this baby
			hasAccess := false
			for _, parent := range baby.Parents {
				if parent.ID == user.ID {
					hasAccess = true
					break
				}
			}

			if !hasAccess {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No access to this baby"})
				return
			}

			// Generate new share token if one doesn't exist
			if baby.ShareToken == "" {
				baby.ShareToken = uuid.NewString()
				if err := database.DB.Save(&baby).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}

			c.JSON(http.StatusOK, gin.H{"shareToken": baby.ShareToken})
		})

		baby.DELETE("/:id/share", func(c *gin.Context) {
			id := c.Param("id")

			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			var baby models.Baby
			if err := database.DB.Preload("Parents").First(&baby, "id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
				return
			}

			// Check if user has access to this baby
			hasAccess := false
			for _, parent := range baby.Parents {
				if parent.ID == user.ID {
					hasAccess = true
					break
				}
			}

			if !hasAccess {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No access to this baby"})
				return
			}

			baby.ShareToken = ""
			if err := database.DB.Save(&baby).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"success": true})
		})
	}
}
