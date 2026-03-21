package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// SupplierService defines the business-logic interface for suppliers.
type SupplierService interface {
	List(ctx context.Context, page, pageSize int) ([]models.Supplier, int, error)
	Get(ctx context.Context, id int) (*models.Supplier, error)
	Create(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error)
	Update(ctx context.Context, id int, req models.UpdateSupplierRequest) (*models.Supplier, error)
}

type supplierService struct {
	repo repository.SupplierRepository
}

// NewSupplierService returns a SupplierService backed by the given repository.
func NewSupplierService(repo repository.SupplierRepository) SupplierService {
	return &supplierService{repo: repo}
}

func (s *supplierService) List(ctx context.Context, page, pageSize int) ([]models.Supplier, int, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *supplierService) Get(ctx context.Context, id int) (*models.Supplier, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *supplierService) Create(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error) {
	return s.repo.Create(ctx, req)
}

func (s *supplierService) Update(ctx context.Context, id int, req models.UpdateSupplierRequest) (*models.Supplier, error) {
	return s.repo.Update(ctx, id, req)
}
