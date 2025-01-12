package routers

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

func getDailyReport(c *gin.Context, babyID string, date time.Time) {
	// Get start and end of the day
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var diapers []models.Diaper
	if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
		babyID, startOfDay, endOfDay).Find(&diapers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var nursings []models.Nursing
	if err := database.DB.Where("baby_id = ? AND time >= ? AND time < ?",
		babyID, startOfDay, endOfDay).Find(&nursings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var sleeps []models.Sleep
	if err := database.DB.Where("baby_id = ? AND (start < ? AND \"end\" > ? OR start BETWEEN ? AND ? OR \"end\" BETWEEN ? AND ?)",
		babyID, endOfDay, startOfDay, startOfDay, endOfDay, startOfDay, endOfDay).Find(&sleeps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	report := DailyReport{
		Date:     startOfDay,
		Diapers:  diapers,
		Nursings: nursings,
		Sleeps:   sleeps,
	}

	c.JSON(http.StatusOK, report)
}

func SetupReportRoutes(api *gin.RouterGroup) {
	report := api.Group("/report")
	{
		// Existing endpoint with date as query parameter
		report.GET("/:id", checkBabyAccess(), func(c *gin.Context) {
			babyID := c.Param("id")
			dateStr := c.Query("date") // expects date in format "2006-01-02"

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

		// New endpoint with date in URL path
		report.GET("/:id/date/:year/:month/:day", checkBabyAccess(), func(c *gin.Context) {
			babyID := c.Param("id")
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
	}
}
