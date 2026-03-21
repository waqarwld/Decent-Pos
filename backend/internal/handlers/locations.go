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

// LocationHandler handles HTTP requests for the locations resource.
type LocationHandler struct {
	svc      services.LocationService
	validate *validator.Validate
}

// NewLocationHandler returns a new LocationHandler.
func NewLocationHandler(svc services.LocationService) *LocationHandler {
	return &LocationHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// List handles GET /locations — returns a paginated, filterable list of locations.
func (h *LocationHandler) List(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	locationType := r.URL.Query().Get("type")

	var isActive *bool
	if v := r.URL.Query().Get("is_active"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid is_active value")
			return
		}
		isActive = &b
	}

	locations, total, err := h.svc.List(r.Context(), locationType, isActive, page, pageSize)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       locations,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Get handles GET /locations/{id} — returns a single location by ID.
func (h *LocationHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid location id")
		return
	}

	location, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "location not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, location)
}

// Create handles POST /locations — creates a new location.
func (h *LocationHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLocationRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	location, err := h.svc.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, location)
}

// Update handles PUT /locations/{id} — updates an existing location.
func (h *LocationHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid location id")
		return
	}

	var req models.UpdateLocationRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	location, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "location not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, location)
}
