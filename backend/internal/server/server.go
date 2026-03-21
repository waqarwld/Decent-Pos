package server

import (
	"context"
	"encoding/json"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"

	"inventory-api/internal/config"
	"inventory-api/internal/handlers"
	"inventory-api/internal/middleware"
	"inventory-api/internal/repository"
	"inventory-api/internal/services"
)

// Server holds the router, database pool, and configuration.
type Server struct {
	router *chi.Mux
	db     *pgxpool.Pool
	cfg    *config.Config
}

// New creates a new Server, wires the router and middleware, and registers routes.
func New(cfg *config.Config, db *pgxpool.Pool) *Server {
	s := &Server{
		router: chi.NewRouter(),
		db:     db,
		cfg:    cfg,
	}
	s.registerRoutes()
	return s
}

// Start begins listening on cfg.Port and handles graceful shutdown on SIGINT or SIGTERM.
func (s *Server) Start() error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr:    ":" + s.cfg.Port,
		Handler: s.router,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info().Str("port", s.cfg.Port).Msg("server listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		log.Info().Msg("shutting down server")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	}
}

// registerRoutes mounts the middleware chain and all route groups.
func (s *Server) registerRoutes() {
	r := s.router

	// Global middleware chain
	r.Use(chimiddleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.NewCORSMiddleware(s.cfg.AllowedOrigin))

	// Health check — no auth required
	r.Get("/health", s.healthHandler)

	// Build repos → services → handlers
	productRepo := repository.NewProductRepository(s.db)
	productSvc := services.NewProductService(productRepo)
	productH := handlers.NewProductHandler(productSvc)

	categoryRepo := repository.NewCategoryRepository(s.db)
	categorySvc := services.NewCategoryService(categoryRepo)
	categoryH := handlers.NewCategoryHandler(categorySvc)

	locationRepo := repository.NewLocationRepository(s.db)
	locationSvc := services.NewLocationService(locationRepo)
	locationH := handlers.NewLocationHandler(locationSvc)

	supplierRepo := repository.NewSupplierRepository(s.db)
	supplierSvc := services.NewSupplierService(supplierRepo)
	supplierH := handlers.NewSupplierHandler(supplierSvc)

	inventoryRepo := repository.NewInventoryRepository(s.db)
	inventorySvc := services.NewInventoryService(inventoryRepo)
	inventoryH := handlers.NewInventoryHandler(inventorySvc)

	reportRepo := repository.NewReportRepository(s.db)
	reportSvc := services.NewReportService(reportRepo)
	reportH := handlers.NewReportHandler(reportSvc)

	// Protected API group — all routes require a valid JWT
	r.Group(func(r chi.Router) {
		r.Use(middleware.NewAuthMiddleware(s.cfg.JWTSecret))
		r.Route("/api/v1", func(r chi.Router) {

			// Products
			r.Get("/products", productH.List)
			r.Post("/products", productH.Create)
			r.Get("/products/sku/{sku}", productH.GetBySKU)
			r.Get("/products/{id}", productH.Get)
			r.Put("/products/{id}", productH.Update)
			r.Delete("/products/{id}", productH.Delete)

			// Categories
			r.Get("/categories", categoryH.List)
			r.Post("/categories", categoryH.Create)
			r.Get("/categories/{id}", categoryH.Get)
			r.Put("/categories/{id}", categoryH.Update)

			// Locations
			r.Get("/locations", locationH.List)
			r.Post("/locations", locationH.Create)
			r.Get("/locations/{id}", locationH.Get)
			r.Put("/locations/{id}", locationH.Update)

			// Suppliers
			r.Get("/suppliers", supplierH.List)
			r.Post("/suppliers", supplierH.Create)
			r.Get("/suppliers/{id}", supplierH.Get)
			r.Put("/suppliers/{id}", supplierH.Update)

			// Inventory operations
			r.Post("/inventory/receive", inventoryH.Receive)
			r.Post("/inventory/ship", inventoryH.Ship)
			r.Post("/inventory/transfer", inventoryH.Transfer)
			r.Post("/inventory/adjust", inventoryH.Adjust)
			r.Get("/inventory/movements", inventoryH.ListMovements)
			r.Get("/inventory/movements/{id}", inventoryH.GetMovement)

			// Reports
			r.Get("/reports/stock", reportH.CurrentStock)
			r.Get("/reports/stock/summary", reportH.ProductSummary)
			r.Get("/reports/stock/alerts", reportH.LowStockAlerts)
			r.Get("/reports/stock/aging", reportH.InventoryAging)
			r.Get("/reports/valuation", reportH.Valuation)
			r.Get("/reports/turnover", reportH.Turnover)
			r.Get("/reports/suppliers/performance", reportH.SupplierPerformance)
			r.Get("/reports/movements/recent", reportH.RecentMovements)
		})
	})
}

// healthHandler pings the database and returns 200 or 503.
func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if err := s.db.Ping(r.Context()); err != nil {
		log.Error().Err(err).Msg("health check: db ping failed")
		w.WriteHeader(http.StatusServiceUnavailable)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "database unavailable"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"data": "ok"})
}
