package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// CustomerService defines the business-logic interface for customers.
type CustomerService interface {
	List(ctx context.Context, page, pageSize int) ([]models.Customer, int, error)
	Get(ctx context.Context, id int) (*models.Customer, error)
	Create(ctx context.Context, req models.CreateCustomerRequest) (*models.Customer, error)
	Update(ctx context.Context, id int, req models.UpdateCustomerRequest) (*models.Customer, error)
}

type customerService struct {
	repo repository.CustomerRepository
}

// NewCustomerService returns a CustomerService backed by the given repository.
func NewCustomerService(repo repository.CustomerRepository) CustomerService {
	return &customerService{repo: repo}
}

func (s *customerService) List(ctx context.Context, page, pageSize int) ([]models.Customer, int, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *customerService) Get(ctx context.Context, id int) (*models.Customer, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *customerService) Create(ctx context.Context, req models.CreateCustomerRequest) (*models.Customer, error) {
	return s.repo.Create(ctx, req)
}

func (s *customerService) Update(ctx context.Context, id int, req models.UpdateCustomerRequest) (*models.Customer, error) {
	return s.repo.Update(ctx, id, req)
}
