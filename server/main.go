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

	// Healthcheck endpoint
	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Public routes
	r.GET("/", func(c *gin.Context) {
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

	// Share route
	r.GET("/share/:token", func(c *gin.Context) {
		c.HTML(http.StatusOK, "baby.html", nil)
	})

	// API routes
	apiGroup := r.Group("/api")
	{
		// Protected routes
		protected := apiGroup.Group("")
		protected.Use(api.AuthMiddleware())
		{
			api.SetupUserRoutes(protected)
			api.SetupSleepRoutes(protected)
			api.SetupDiaperRoutes(protected)
			api.SetupBabyRoutes(protected)
			api.SetupReportRoutes(protected)
			api.SetupNursingRoutes(protected)
		}

		// Public routes
		public := apiGroup.Group("/public")
		{
			api.SetupBabyRoutes(public)
			api.SetupSleepRoutes(public)
			api.SetupDiaperRoutes(public)
			api.SetupNursingRoutes(public)
			api.SetupReportRoutes(public)
		}
	}

	r.Run(":3000")
}
