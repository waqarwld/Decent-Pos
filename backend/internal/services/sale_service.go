package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// SaleService defines the business-logic interface for sales and returns.
type SaleService interface {
	List(ctx context.Context, page, pageSize int) ([]models.Sale, int, error)
	Get(ctx context.Context, id int) (*models.Sale, error)
	Create(ctx context.Context, req models.CreateSaleRequest, createdBy string) (*models.Sale, error)
	Purchases(ctx context.Context, customerID int) (*models.CustomerPurchases, error)
	CreateReturn(ctx context.Context, saleID int, req models.CreateReturnRequest, createdBy string) (*models.Return, error)
}

type saleService struct {
	repo repository.SaleRepository
}

// NewSaleService returns a SaleService backed by the given repository.
func NewSaleService(repo repository.SaleRepository) SaleService {
	return &saleService{repo: repo}
}

func (s *saleService) List(ctx context.Context, page, pageSize int) ([]models.Sale, int, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *saleService) Get(ctx context.Context, id int) (*models.Sale, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *saleService) Create(ctx context.Context, req models.CreateSaleRequest, createdBy string) (*models.Sale, error) {
	return s.repo.Create(ctx, req, createdBy)
}

func (s *saleService) Purchases(ctx context.Context, customerID int) (*models.CustomerPurchases, error) {
	return s.repo.ListByCustomer(ctx, customerID)
}

func (s *saleService) CreateReturn(ctx context.Context, saleID int, req models.CreateReturnRequest, createdBy string) (*models.Return, error) {
	return s.repo.CreateReturn(ctx, saleID, req, createdBy)
}