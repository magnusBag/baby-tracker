package api

import (
	"baby-tracker/database"
	"baby-tracker/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DailyReport struct {
	Date            time.Time        `json:"date"`
	Diapers         []models.Diaper  `json:"diapers"`
	Nursings        []models.Nursing `json:"nursings"`
	Sleeps          []models.Sleep   `json:"sleeps"`
	TotalHoursSlept float64          `json:"totalHoursSlept"`
}

type DailySummary struct {
	Date            time.Time `json:"date"`
	TotalHoursSlept float64   `json:"totalHoursSlept"`
	DiaperCount     int       `json:"diaperCount"`
	NursingCount    int       `json:"nursingCount"`
}

type WeeklyReport struct {
	StartDate         time.Time      `json:"startDate"`
	EndDate           time.Time      `json:"endDate"`
	DailySummaries    []DailySummary `json:"dailySummaries"`
	AvgSleepHours     float64        `json:"avgSleepHours"`
	AvgDiapersPerDay  float64        `json:"avgDiapersPerDay"`
	AvgNursingsPerDay float64        `json:"avgNursingsPerDay"`
}

func getDailyReport(c *gin.Context, babyID string, date time.Time) {
	// Get start and end of the day
	// go from 01:00 to 01:00
	cet, _ := time.LoadLocation("Europe/Paris")
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 1, 0, 0, 0, cet)
	endOfDay := startOfDay.Add(24 * time.Hour)

	var diapers []models.Diaper
	if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
		babyID, startOfDay, endOfDay).Order("time").Find(&diapers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var nursings []models.Nursing
	if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
		babyID, startOfDay, endOfDay).Order("time").Find(&nursings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var sleeps []models.Sleep
	if err := database.DB.Where("baby_id = ? AND start >= ? AND start < ?",
		babyID, startOfDay.Add(-1*time.Hour), startOfDay.Add(23*time.Hour)).Order("start").Find(&sleeps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format with notes included
	sleepResponse := make([]gin.H, len(sleeps))
	for i, sleep := range sleeps {
		sleepResponse[i] = gin.H{
			"id":     sleep.ID,
			"start":  sleep.Start.Format(time.RFC3339),
			"end":    sleep.End.Format(time.RFC3339),
			"babyId": sleep.BabyID,
			"note":   sleep.Note,
		}
	}

	diaperResponse := make([]gin.H, len(diapers))
	for i, diaper := range diapers {
		diaperResponse[i] = gin.H{
			"id":     diaper.ID,
			"type":   diaper.Type,
			"time":   diaper.Time.Format(time.RFC3339),
			"babyId": diaper.BabyID,
			"note":   diaper.Note,
		}
	}

	nursingResponse := make([]gin.H, len(nursings))
	for i, nursing := range nursings {
		nursingResponse[i] = gin.H{
			"id":     nursing.ID,
			"type":   nursing.Type,
			"amount": nursing.Amount,
			"time":   nursing.Time.Format(time.RFC3339),
			"babyId": nursing.BabyID,
			"note":   nursing.Note,
		}
	}

	// Calculate total hours slept
	var totalHoursSlept float64
	for _, sleep := range sleeps {
		totalHoursSlept += sleep.End.Sub(sleep.Start).Hours()
	}

	// Send response directly
	c.JSON(http.StatusOK, gin.H{
		"date":            startOfDay,
		"diapers":         diaperResponse,
		"nursings":        nursingResponse,
		"sleeps":          sleepResponse,
		"totalHoursSlept": totalHoursSlept,
	})
}

func getWeeklyReport(c *gin.Context, babyID string, endDate time.Time) {
	startDate := endDate.AddDate(0, 0, -6) // 7 days including end date
	startOfFirstDay := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 23, 0, 0, 0, startDate.Location())
	endOfLastDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 0, 0, 0, endDate.Location())
	currentDay := time.Now().Truncate(24 * time.Hour)

	var dailySummaries []DailySummary
	var totalSleepHours float64
	var daysWithSleep, totalDiapers, daysWithDiapers, totalNursings, daysWithNursings int

	// Calculate summaries for each day
	for d := startOfFirstDay; d.Before(endOfLastDay.Add(time.Second)); d = d.AddDate(0, 0, 1) {
		dayEnd := d.AddDate(0, 0, 1) // Next day at 23:00

		// Get sleeps for the day
		var sleeps []models.Sleep
		if err := database.DB.Where("baby_id = ? AND (start < ? AND \"end\" > ? OR start BETWEEN ? AND ? OR \"end\" BETWEEN ? AND ?)",
			babyID, dayEnd, d, d, dayEnd, d, dayEnd).Find(&sleeps).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Calculate total sleep hours for the day
		var dailySleepHours float64
		for _, sleep := range sleeps {
			sleepStart := sleep.Start
			sleepEnd := sleep.End
			if sleepStart.Before(d) {
				sleepStart = d
			}
			if sleepEnd.After(dayEnd) {
				sleepEnd = dayEnd
			}
			dailySleepHours += sleepEnd.Sub(sleepStart).Hours()
		}

		// Get diapers for the day
		var diapers []models.Diaper
		if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
			babyID, d, dayEnd).Find(&diapers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Get nursings for the day
		var nursings []models.Nursing
		if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
			babyID, d, dayEnd).Find(&nursings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		summary := DailySummary{
			Date:            d,
			TotalHoursSlept: dailySleepHours,
			DiaperCount:     len(diapers),
			NursingCount:    len(nursings),
		}
		dailySummaries = append(dailySummaries, summary)

		// Update totals for averages, excluding current day
		if !d.Truncate(24 * time.Hour).Equal(currentDay) {
			if dailySleepHours > 0 {
				totalSleepHours += dailySleepHours
				daysWithSleep++
			}
			if len(diapers) > 0 {
				totalDiapers += len(diapers)
				daysWithDiapers++
			}
			if len(nursings) > 0 {
				totalNursings += len(nursings)
				daysWithNursings++
			}
		}
	}

	// Calculate averages, avoiding division by zero
	avgSleepHours := 0.0
	if daysWithSleep > 0 {
		avgSleepHours = totalSleepHours / float64(daysWithSleep)
	}

	avgDiapers := 0.0
	if daysWithDiapers > 0 {
		avgDiapers = float64(totalDiapers) / float64(daysWithDiapers)
	}

	avgNursings := 0.0
	if daysWithNursings > 0 {
		avgNursings = float64(totalNursings) / float64(daysWithNursings)
	}

	report := WeeklyReport{
		StartDate:         startOfFirstDay,
		EndDate:           endOfLastDay,
		DailySummaries:    reverseDailySummaries(dailySummaries),
		AvgSleepHours:     avgSleepHours,
		AvgDiapersPerDay:  avgDiapers,
		AvgNursingsPerDay: avgNursings,
	}

	c.JSON(http.StatusOK, report)
}

func reverseDailySummaries(summaries []DailySummary) []DailySummary {
	summaries = summaries[:len(summaries)-1]
	for i, j := 0, len(summaries)-1; i < j; i, j = i+1, j-1 {
		summaries[i], summaries[j] = summaries[j], summaries[i]
	}
	return summaries
}

func SetupReportRoutes(api *gin.RouterGroup) {
	report := api.Group("/report")
	report.Use(AuthMiddleware()) // Add authentication middleware
	{
		report.GET("/:id", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			babyID := c.Param("id")
			dateStr := c.Query("date") // expects date in format "2006-01-02"

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

			var date time.Time
			var err error
			if dateStr == "" {
				date = time.Now()
			} else {
				date, err = time.Parse("2006-01-02", dateStr)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
					return
				}
			}

			getDailyReport(c, babyID, date)
		})

		report.GET("/:id/date/:year/:month/:day", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			babyID := c.Param("id")

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

			year := c.Param("year")
			month := c.Param("month")
			day := c.Param("day")

			dateStr := year + "-" + month + "-" + day
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format in URL. Use /id/YYYY/MM/DD"})
				return
			}

			getDailyReport(c, babyID, date)
		})

		report.GET("/:id/weekly", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			babyID := c.Param("id")

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

			dateStr := c.Query("endDate") // optional, defaults to today

			var endDate time.Time
			if dateStr == "" {
				endDate = time.Now()
			} else {
				var err error
				endDate, err = time.Parse("2006-01-02", dateStr)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
					return
				}
			}

			getWeeklyReport(c, babyID, endDate)
		})

		report.GET("/:id/history/:date", func(c *gin.Context) {
			// Get user from context
			userInterface, _ := c.Get("user")
			user := userInterface.(models.User)

			babyID := c.Param("id")

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

			dateStr := c.Param("date")
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
				return
			}
			getDailyReport(c, babyID, date)
		})
	}
}
