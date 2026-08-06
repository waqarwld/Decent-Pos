package handlers

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"inventory-api/internal/middleware"
	"inventory-api/internal/models"
	"inventory-api/internal/repository"
	"inventory-api/internal/services"
)

// SaleHandler handles HTTP requests for sales and returns.
type SaleHandler struct {
	svc      services.SaleService
	validate *validator.Validate
}

// NewSaleHandler returns a new SaleHandler.
func NewSaleHandler(svc services.SaleService) *SaleHandler {
	return &SaleHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// List handles GET /sales — returns a paginated list of sales.
func (h *SaleHandler) List(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	sales, total, err := h.svc.List(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       sales,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Get handles GET /sales/{id} — returns a single sale with line items.
func (h *SaleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid sale id")
		return
	}

	sale, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "sale not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, sale)
}

// Purchases handles GET /customers/{id}/purchases — returns a customer's history.
func (h *SaleHandler) Purchases(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer id")
		return
	}

	purchases, err := h.svc.Purchases(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "customer not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, purchases)
}

// Create handles POST /sales — creates a new sale.
func (h *SaleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateSaleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())

	sale, err := h.svc.Create(r.Context(), req, createdBy)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusBadRequest, "customer not found")
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, sale)
}

// CreateReturn handles POST /sales/{id}/returns — records a return on a sale line.
func (h *SaleHandler) CreateReturn(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid sale id")
		return
	}

	var req models.CreateReturnRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdBy := middleware.GetUserFromContext(r.Context())

	ret, err := h.svc.CreateReturn(r.Context(), id, req, createdBy)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "sale not found")
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, ret)
}