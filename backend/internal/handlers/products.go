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

// ProductHandler handles HTTP requests for the products resource.
type ProductHandler struct {
	svc      services.ProductService
	validate *validator.Validate
}

// NewProductHandler returns a new ProductHandler.
func NewProductHandler(svc services.ProductService) *ProductHandler {
	return &ProductHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// List handles GET /products — returns a paginated, filterable list of products.
func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	page, pageSize := parsePagination(r)

	f := models.ProductFilter{
		Page:     page,
		PageSize: pageSize,
		Status:   r.URL.Query().Get("status"),
	}

	if v := r.URL.Query().Get("category_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			f.CategoryID = &n
		}
	}

	products, total, err := h.svc.List(r.Context(), f)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	respondPaginated(w, http.StatusOK, models.PaginatedResponse{
		Data:       products,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// Get handles GET /products/{id} — returns a single product by ID.
func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	product, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "product not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, product)
}

// GetBySKU handles GET /products/sku/{sku} — returns a single product by SKU.
func (h *ProductHandler) GetBySKU(w http.ResponseWriter, r *http.Request) {
	sku := chi.URLParam(r, "sku")

	product, err := h.svc.GetBySKU(r.Context(), sku)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "product not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, product)
}

// Create handles POST /products — creates a new product.
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.svc.Create(r.Context(), req)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateSKU) {
			respondError(w, http.StatusConflict, "SKU already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, product)
}

// Update handles PUT /products/{id} — updates an existing product.
func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	var req models.UpdateProductRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "product not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, product)
}

// Delete handles DELETE /products/{id} — soft-deletes a product.
func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			respondError(w, http.StatusNotFound, "product not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "product deleted"})
}
