package services

import (
	"context"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// LocationService defines the business-logic interface for locations.
type LocationService interface {
	List(ctx context.Context, locationType string, isActive *bool, page, pageSize int) ([]models.Location, int, error)
	Get(ctx context.Context, id int) (*models.Location, error)
	Create(ctx context.Context, req models.CreateLocationRequest) (*models.Location, error)
	Update(ctx context.Context, id int, req models.UpdateLocationRequest) (*models.Location, error)
}

type locationService struct {
	repo repository.LocationRepository
}

// NewLocationService returns a LocationService backed by the given repository.
func NewLocationService(repo repository.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) List(ctx context.Context, locationType string, isActive *bool, page, pageSize int) ([]models.Location, int, error) {
	return s.repo.List(ctx, locationType, isActive, page, pageSize)
}

func (s *locationService) Get(ctx context.Context, id int) (*models.Location, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *locationService) Create(ctx context.Context, req models.CreateLocationRequest) (*models.Location, error) {
	return s.repo.Create(ctx, req)
}

func (s *locationService) Update(ctx context.Context, id int, req models.UpdateLocationRequest) (*models.Location, error) {
	return s.repo.Update(ctx, id, req)
}
