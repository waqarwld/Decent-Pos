package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// CategoryService defines the business-logic interface for categories.
type CategoryService interface {
	List(ctx context.Context, page, pageSize int) ([]models.Category, int, error)
	Get(ctx context.Context, id int) (*models.Category, error)
	Create(ctx context.Context, req models.CreateCategoryRequest) (*models.Category, error)
	Update(ctx context.Context, id int, req models.UpdateCategoryRequest) (*models.Category, error)
}

type categoryService struct {
	repo repository.CategoryRepository
}

// NewCategoryService returns a CategoryService backed by the given repository.
func NewCategoryService(repo repository.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) List(ctx context.Context, page, pageSize int) ([]models.Category, int, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *categoryService) Get(ctx context.Context, id int) (*models.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *categoryService) Create(ctx context.Context, req models.CreateCategoryRequest) (*models.Category, error) {
	return s.repo.Create(ctx, req)
}

func (s *categoryService) Update(ctx context.Context, id int, req models.UpdateCategoryRequest) (*models.Category, error) {
	return s.repo.Update(ctx, id, req)
}
