package models

import "time"

type Sleep struct {
	ID     string    `json:"id" gorm:"primaryKey"`
	Start  time.Time `json:"start" gorm:"type:timestamptz"`
	End    time.Time `json:"end" gorm:"type:timestamptz"`
	BabyID string    `json:"babyId"`
	Note   string    `json:"note"`
}

type Diaper struct {
	ID     string    `json:"id" gorm:"primaryKey"`
	Type   string    `json:"type"`
	Time   time.Time `json:"time"`
	BabyID string    `json:"babyId"`
	Note   string    `json:"note"`
}

type Nursing struct {
	ID     string    `json:"id" gorm:"primaryKey"`
	Type   string    `json:"type"`
	Amount string    `json:"amount"`
	Time   time.Time `json:"time"`
	BabyID string    `json:"babyId"`
	Note   string    `json:"note"`
}

type User struct {
	ID       string `json:"id" gorm:"primaryKey"`
	Username string `json:"username" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"` // "-" means this field won't be included in JSON
	Babies   []Baby `json:"babies,omitempty" gorm:"many2many:user_babies"`
}

type Baby struct {
	ID       string    `json:"id" gorm:"primaryKey"`
	Name     string    `json:"name"`
	Parents  []User    `json:"parents,omitempty" gorm:"many2many:user_babies"`
	Nursings []Nursing `json:"nursings,omitempty" gorm:"foreignKey:BabyID"`
	Diapers  []Diaper  `json:"diapers,omitempty" gorm:"foreignKey:BabyID"`
	Sleeps   []Sleep   `json:"sleeps,omitempty" gorm:"foreignKey:BabyID"`
}
