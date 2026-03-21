package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// ReportService defines the business-logic interface for reporting operations.
type ReportService interface {
	CurrentStock(ctx context.Context, f models.StockFilter) ([]models.StockLevel, int, error)
	LowStockAlerts(ctx context.Context) ([]models.LowStockAlert, error)
	ProductSummary(ctx context.Context, page, pageSize int) ([]models.ProductStockSummary, int, error)
	InventoryAging(ctx context.Context) ([]models.AgingRecord, error)
	SupplierPerformance(ctx context.Context) ([]models.SupplierPerformance, error)
	RecentMovements(ctx context.Context, page, pageSize int) ([]models.Movement, int, error)
	Valuation(ctx context.Context, method string, productID, locationID *int) ([]models.ValuationRecord, error)
	Turnover(ctx context.Context, startDate, endDate string, productID, locationID *int) ([]models.ValuationRecord, error)
}

type reportService struct {
	repo repository.ReportRepository
}

// NewReportService returns a ReportService backed by the given repository.
func NewReportService(repo repository.ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func (s *reportService) CurrentStock(ctx context.Context, f models.StockFilter) ([]models.StockLevel, int, error) {
	return s.repo.CurrentStock(ctx, f)
}

func (s *reportService) LowStockAlerts(ctx context.Context) ([]models.LowStockAlert, error) {
	return s.repo.LowStockAlerts(ctx)
}

func (s *reportService) ProductSummary(ctx context.Context, page, pageSize int) ([]models.ProductStockSummary, int, error) {
	return s.repo.ProductSummary(ctx, page, pageSize)
}

func (s *reportService) InventoryAging(ctx context.Context) ([]models.AgingRecord, error) {
	return s.repo.InventoryAging(ctx)
}

func (s *reportService) SupplierPerformance(ctx context.Context) ([]models.SupplierPerformance, error) {
	return s.repo.SupplierPerformance(ctx)
}

func (s *reportService) RecentMovements(ctx context.Context, page, pageSize int) ([]models.Movement, int, error) {
	return s.repo.RecentMovements(ctx, page, pageSize)
}

func (s *reportService) Valuation(ctx context.Context, method string, productID, locationID *int) ([]models.ValuationRecord, error) {
	return s.repo.Valuation(ctx, method, productID, locationID)
}

func (s *reportService) Turnover(ctx context.Context, startDate, endDate string, productID, locationID *int) ([]models.ValuationRecord, error) {
	return s.repo.Turnover(ctx, startDate, endDate, productID, locationID)
}
