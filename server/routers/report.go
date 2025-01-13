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

func getWeeklyReport(c *gin.Context, babyID string, endDate time.Time) {
	startDate := endDate.AddDate(0, 0, -6) // 7 days including end date
	startOfFirstDay := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
	endOfLastDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())

	var dailySummaries []DailySummary
	var totalSleepHours float64
	var daysWithSleep, totalDiapers, daysWithDiapers, totalNursings, daysWithNursings int

	// Calculate summaries for each day
	for d := startOfFirstDay; d.Before(endOfLastDay.Add(time.Second)); d = d.AddDate(0, 0, 1) {
		dayEnd := d.Add(24 * time.Hour)

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

		// Update totals for averages
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

		// Weekly report endpoint
		report.GET("/:id/weekly", checkBabyAccess(), func(c *gin.Context) {
			babyID := c.Param("id")
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
	}
}
