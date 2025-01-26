package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// SetupPublicRoutes configures all public routes that don't require authentication
func SetupPublicRoutes(api *gin.RouterGroup) {
	// Public baby endpoint
	api.GET("/baby/:shareToken", func(c *gin.Context) {
		shareToken := c.Param("shareToken")
		var baby models.Baby
		if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
			return
		}

		c.JSON(http.StatusOK, baby)
	})

	// Public sleep endpoint
	api.GET("/sleep", func(c *gin.Context) {
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

	// Public diaper endpoint
	api.GET("/diaper", func(c *gin.Context) {
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
			}
		}
		c.JSON(http.StatusOK, response)
	})

	// Public nursing endpoint
	api.GET("/nursing", func(c *gin.Context) {
		shareToken := c.Query("babyId") // Using babyId param to maintain frontend compatibility
		var baby models.Baby
		if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
			return
		}

		var nursings []models.Nursing
		if err := database.DB.Where("baby_id = ?", baby.ID).Find(&nursings).Error; err != nil {
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
			}
		}
		c.JSON(http.StatusOK, response)
	})

	// Public report endpoints
	api.GET("/report/:shareToken", func(c *gin.Context) {
		shareToken := c.Param("shareToken")
		var baby models.Baby
		if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
			return
		}

		// Get all records for the baby
		var sleeps []models.Sleep
		var diapers []models.Diaper
		var nursings []models.Nursing

		if err := database.DB.Where("baby_id = ?", baby.ID).Find(&sleeps).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := database.DB.Where("baby_id = ?", baby.ID).Find(&diapers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := database.DB.Where("baby_id = ?", baby.ID).Find(&nursings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"sleeps":   sleeps,
			"diapers":  diapers,
			"nursings": nursings,
		})
	})

	api.GET("/report/:shareToken/weekly", func(c *gin.Context) {
		shareToken := c.Param("shareToken")
		var baby models.Baby
		if err := database.DB.First(&baby, "share_token = ?", shareToken).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Baby not found"})
			return
		}

		// Get all records for the last 7 days
		now := time.Now().UTC()
		weekAgo := now.AddDate(0, 0, -7)

		var sleeps []models.Sleep
		var diapers []models.Diaper
		var nursings []models.Nursing

		if err := database.DB.Where("baby_id = ? AND start >= ?", baby.ID, weekAgo).Find(&sleeps).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := database.DB.Where("baby_id = ? AND time >= ?", baby.ID, weekAgo).Find(&diapers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := database.DB.Where("baby_id = ? AND time >= ?", baby.ID, weekAgo).Find(&nursings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"sleeps":   sleeps,
			"diapers":  diapers,
			"nursings": nursings,
		})
	})
}
