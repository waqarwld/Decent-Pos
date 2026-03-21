package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// contextKey is an unexported type for context keys in this package.
type contextKey string

const userContextKey contextKey = "user"

// GetUserFromContext returns the JWT subject claim stored in the context.
// Returns an empty string if no user is found.
func GetUserFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(userContextKey).(string); ok {
		return v
	}
	return ""
}

// NewAuthMiddleware returns a middleware that validates JWT tokens from the
// Authorization: Bearer <token> header. The jwtSecret is used to verify the
// token signature. On success, the JWT subject claim is stored in the request
// context. On failure, it responds with 401 Unauthorized.
func NewAuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeAuthError(w, "missing authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				writeAuthError(w, "invalid authorization header format")
				return
			}

			tokenStr := parts[1]
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			}, jwt.WithValidMethods([]string{"HS256", "HS384", "HS512"}))

			if err != nil || !token.Valid {
				writeAuthError(w, "invalid or expired token")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeAuthError(w, "invalid token claims")
				return
			}

			sub, err := claims.GetSubject()
			if err != nil || sub == "" {
				writeAuthError(w, "missing subject claim")
				return
			}

			ctx := context.WithValue(r.Context(), userContextKey, sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func writeAuthError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
