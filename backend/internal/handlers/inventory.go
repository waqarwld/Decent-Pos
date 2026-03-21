package handlers

import (
	"errors"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"inventory-api/internal/middleware"
	"inventory-api/internal/models"
	"inventory-api/internal/repository"
	"inventory-api/internal/services"
)

// InventoryHandler handles HTTP requests for inventory operations.
type InventoryHandler struct {
	svc      services.InventoryService
	validate *validator.Validate
}

// NewInventoryHandler returns a new InventoryHandler.
func NewInventoryHandler(svc services.InventoryService) *InventoryHandler {
	return &InventoryHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// Receive handles POST /inventory/receive.
func (h *InventoryHandler) Receive(w http.ResponseWriter, r *http.Request) {
	var req models.ReceiveRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())
	result, err := h.svc.Receive(r.Context(), req, createdBy)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// Ship handles POST /inventory/ship.
func (h *InventoryHandler) Ship(w http.ResponseWriter, r *http.Request) {
	var req models.ShipRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())
	result, err := h.svc.Ship(r.Context(), req, createdBy)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// Transfer handles POST /inventory/transfer.
func (h *InventoryHandler) Transfer(w http.ResponseWriter, r *http.Request) {
	var req models.TransferRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())
	result, err := h.svc.Transfer(r.Context(), req, createdBy)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// Adjust handles POST /inventory/adjust.
func (h *InventoryHandler) Adjust(w http.ResponseWriter, r *http.Request) {
	var req models.AdjustRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())
	result, err := h.svc.Adjust(r.Context(), req, createdBy)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// ListMovements handles GET /inventory/movements.
func (h *InventoryHandler) ListMovements(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	f := models.MovementFilter{
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
	if v := q.Get("movement_type_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			f.MovementTypeID = &n
		}
	}
	if v := q.Get("from_date"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			f.FromDate = &t
		}
	}
	if v := q.Get("to_date"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			// Include the full end day
			end := t.Add(24*time.Hour - time.Nanosecond)
			f.ToDate = &end
		}
	}

	movements, total, err := h.svc.ListMovements(r.Context(), f)
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

// GetMovement handles GET /inventory/movements/{id}.
func (h *InventoryHandler) GetMovement(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid movement id")
		return
	}

	movement, err := h.svc.GetMovement(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "movement not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, movement)
}
