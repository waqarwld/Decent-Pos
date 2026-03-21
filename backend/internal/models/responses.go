package models

import "time"

// Response is the standard JSON envelope for all API responses.
type Response struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
}

// PaginatedResponse is the JSON envelope for paginated list responses.
type PaginatedResponse struct {
	Data       any `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalPages int `json:"total_pages"`
}

// ProductFilter holds query parameters for filtering and paginating product lists.
type ProductFilter struct {
	Page       int
	PageSize   int
	Status     string
	CategoryID *int
}

// StockFilter holds query parameters for filtering and paginating stock level lists.
type StockFilter struct {
	Page       int
	PageSize   int
	ProductID  *int
	LocationID *int
}

// MovementFilter holds query parameters for filtering and paginating movement lists.
type MovementFilter struct {
	Page           int
	PageSize       int
	ProductID      *int
	LocationID     *int
	MovementTypeID *int
	FromDate       *time.Time
	ToDate         *time.Time
}
