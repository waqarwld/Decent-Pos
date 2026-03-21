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

// CategoryHandler handles HTTP requests for the categories resource.
type CategoryHandler struct {
	svc      services.CategoryService
	validate *validator.Validate
}

// NewCategoryHandler returns a new CategoryHandler.
func NewCategoryHandler(svc services.CategoryService) *CategoryHandler {
	return &CategoryHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// List handles GET /categories — returns a paginated list of categories.
func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	categories, total, err := h.svc.List(r.Context(), page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       categories,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Get handles GET /categories/{id} — returns a single category by ID.
func (h *CategoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	category, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "category not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, category)
}

// Create handles POST /categories — creates a new category.
func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCategoryRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.svc.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, category)
}

// Update handles PUT /categories/{id} — updates an existing category.
func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	var req models.UpdateCategoryRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "category not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, category)
}
