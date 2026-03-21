package handlers

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
	"inventory-api/internal/services"
)

// SupplierHandler handles HTTP requests for the suppliers resource.
type SupplierHandler struct {
	svc      services.SupplierService
	validate *validator.Validate
}

// NewSupplierHandler returns a new SupplierHandler.
func NewSupplierHandler(svc services.SupplierService) *SupplierHandler {
	return &SupplierHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// List handles GET /suppliers — returns a paginated list of suppliers.
func (h *SupplierHandler) List(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	suppliers, total, err := h.svc.List(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       suppliers,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Get handles GET /suppliers/{id} — returns a single supplier by ID.
func (h *SupplierHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	supplier, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "supplier not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, supplier)
}

// Create handles POST /suppliers — creates a new supplier.
func (h *SupplierHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateSupplierRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	supplier, err := h.svc.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, supplier)
}

// Update handles PUT /suppliers/{id} — updates an existing supplier.
func (h *SupplierHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	var req models.UpdateSupplierRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	supplier, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "supplier not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, supplier)
}
