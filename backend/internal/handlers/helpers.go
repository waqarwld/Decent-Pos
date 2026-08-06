package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"inventory-api/internal/models"
)

// respondJSON writes a JSON response with the given status code.
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// respondError writes a JSON error response with the given status code, using
// the standard {"error": "..."} envelope.
func respondError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// decodeJSON decodes the request body into dst. Returns an error if the body
// cannot be decoded as valid JSON.
func decodeJSON(r *http.Request, dst any) error {
	return json.NewDecoder(r.Body).Decode(dst)
}

// parsePagination extracts page and page_size query parameters from the
// request. Defaults: page=1, page_size=50. page_size is capped at 200.
func parsePagination(r *http.Request) (page, pageSize int) {
	page = 1
	pageSize = 50

	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 1 {
			page = n
		}
	}

	if v := r.URL.Query().Get("page_size"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 1 {
			pageSize = n
		}
	}

	if pageSize > 200 {
		pageSize = 200
	}

	return page, pageSize
}

// respondPaginated writes a PaginatedResponse directly as the top-level JSON body.
func respondPaginated(w http.ResponseWriter, status int, resp models.PaginatedResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(resp)
}
