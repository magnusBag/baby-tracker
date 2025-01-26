package main

import (
	"baby-tracker/database"
	"baby-tracker/routers/api"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	r := gin.Default()

	// Configure trusted proxies
	// For development, we'll trust only loopback addresses (127.0.0.1/8, ::1/128)
	r.SetTrustedProxies([]string{"127.0.0.1/8", "::1/128"})

	// Load templates and static files
	r.LoadHTMLGlob("templates/*")
	r.Static("/static", "./static")

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Parrent-User-ID")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Public routes
	r.GET("", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	// Auth endpoints
	auth := r.Group("/auth")
	{
		auth.POST("/register", api.Register)
		auth.POST("/login", api.Login)
	}

	// Frontend pages (protected by client-side auth)
	r.GET("/dashboard", func(c *gin.Context) {
		c.HTML(http.StatusOK, "dashboard.html", nil)
	})
	r.GET("/baby/:id", func(c *gin.Context) {
		c.HTML(http.StatusOK, "baby.html", nil)
	})

	// Protected API routes
	apiGroup := r.Group("/api")
	apiGroup.Use(api.AuthMiddleware())
	{
		api.SetupUserRoutes(apiGroup)
		api.SetupSleepRoutes(apiGroup)
		api.SetupDiaperRoutes(apiGroup)
		api.SetupBabyRoutes(apiGroup)
		api.SetupReportRoutes(apiGroup)
		api.SetupNursingRoutes(apiGroup)
	}

	r.Run(":3000")
}
