package handlers

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"inventory-api/internal/models"
	"inventory-api/internal/services"
)

// ReportHandler handles HTTP requests for reporting endpoints.
type ReportHandler struct {
	svc services.ReportService
}

// NewReportHandler returns a new ReportHandler.
func NewReportHandler(svc services.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

// CurrentStock handles GET /reports/stock.
// Query params: product_id, location_id, page, page_size
func (h *ReportHandler) CurrentStock(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)
	f := models.StockFilter{
		Page:     page,
		PageSize: pageSize,
	}

	q := r.URL.Query()
	if v := q.Get("product_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			f.ProductID = &n
		}
	}
	if v := q.Get("location_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			f.LocationID = &n
		}
	}

	levels, total, err := h.svc.CurrentStock(r.Context(), f)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       levels,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// LowStockAlerts handles GET /reports/stock/alerts.
func (h *ReportHandler) LowStockAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.svc.LowStockAlerts(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, alerts)
}

// ProductSummary handles GET /reports/stock/summary.
// Query params: page, page_size
func (h *ReportHandler) ProductSummary(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	summaries, total, err := h.svc.ProductSummary(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       summaries,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// InventoryAging handles GET /reports/stock/aging.
func (h *ReportHandler) InventoryAging(w http.ResponseWriter, r *http.Request) {
	records, err := h.svc.InventoryAging(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, records)
}

// SupplierPerformance handles GET /reports/suppliers/performance.
func (h *ReportHandler) SupplierPerformance(w http.ResponseWriter, r *http.Request) {
	results, err := h.svc.SupplierPerformance(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, results)
}

// RecentMovements handles GET /reports/movements/recent.
// Query params: page, page_size
func (h *ReportHandler) RecentMovements(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	movements, total, err := h.svc.RecentMovements(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       movements,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Valuation handles GET /reports/valuation.
// Query params: method (default "avg"), product_id, location_id
func (h *ReportHandler) Valuation(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	method := q.Get("method")
	if method == "" {
		method = "avg"
	}

	var productID, locationID *int
	if v := q.Get("product_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			productID = &n
		}
	}
	if v := q.Get("location_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			locationID = &n
		}
	}

	records, err := h.svc.Valuation(r.Context(), method, productID, locationID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, records)
}

// Turnover handles GET /reports/turnover.
// Query params: start_date, end_date (ISO date strings, default last 90 days), product_id, location_id
func (h *ReportHandler) Turnover(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	endDate := q.Get("end_date")
	startDate := q.Get("start_date")

	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}
	if startDate == "" {
		startDate = time.Now().AddDate(0, 0, -90).Format("2006-01-02")
	}

	var productID, locationID *int
	if v := q.Get("product_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			productID = &n
		}
	}
	if v := q.Get("location_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			locationID = &n
		}
	}

	records, err := h.svc.Turnover(r.Context(), startDate, endDate, productID, locationID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, records)
}
