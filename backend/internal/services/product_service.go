package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// ProductService defines the business-logic interface for products.
type ProductService interface {
	List(ctx context.Context, f models.ProductFilter) ([]models.Product, int, error)
	Get(ctx context.Context, id int) (*models.Product, error)
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error)
	Update(ctx context.Context, id int, req models.UpdateProductRequest) (*models.Product, error)
	Delete(ctx context.Context, id int) error
}

type productService struct {
	repo repository.ProductRepository
}

// NewProductService returns a ProductService backed by the given repository.
func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) List(ctx context.Context, f models.ProductFilter) ([]models.Product, int, error) {
	return s.repo.List(ctx, f)
}

func (s *productService) Get(ctx context.Context, id int) (*models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *productService) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	return s.repo.GetBySKU(ctx, sku)
}

func (s *productService) Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	return s.repo.Create(ctx, req)
}

func (s *productService) Update(ctx context.Context, id int, req models.UpdateProductRequest) (*models.Product, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *productService) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
