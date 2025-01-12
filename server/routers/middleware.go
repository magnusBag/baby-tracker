package routers

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func checkBabyAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-Parrent-User-ID")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not provided"})
			c.Abort()
			return
		}

		var user models.User
		if err := database.DB.Preload("Babies").First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		if c.Request.Method == "POST" {
			// Read the body
			bodyBytes, err := c.GetRawData()
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				c.Abort()
				return
			}

			// Parse the body
			var body map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &body); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				c.Abort()
				return
			}

			// Check babyId
			babyID, ok := body["babyId"].(string)
			if !ok {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Baby ID not provided"})
				c.Abort()
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
				c.Abort()
				return
			}

			// Restore the body for the next handler
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		c.Next()
	}
}
