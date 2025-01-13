package main

import (
	"baby-tracker/database"
	"baby-tracker/routers"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Parrent-User-ID")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		routers.SetupUserRoutes(api)
		routers.SetupSleepRoutes(api)
		routers.SetupDiaperRoutes(api)
		routers.SetupBabyRoutes(api)
		routers.SetupReportRoutes(api)
		routers.SetupNursingRoutes(api)
		api.GET("/alive", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "I'm"})
		})
	}

	r.Run(":3000")
}
