package services

import (
	"context"
	"errors"

	"inventory-api/internal/models"
	"inventory-api/internal/repository"
)

// InventoryService defines the business-logic interface for inventory operations.
type InventoryService interface {
	Receive(ctx context.Context, req models.ReceiveRequest, createdBy string) (*models.OperationResult, error)
	Ship(ctx context.Context, req models.ShipRequest, createdBy string) (*models.OperationResult, error)
	Transfer(ctx context.Context, req models.TransferRequest, createdBy string) (*models.TransferResult, error)
	Adjust(ctx context.Context, req models.AdjustRequest, createdBy string) (*models.OperationResult, error)
	ListMovements(ctx context.Context, f models.MovementFilter) ([]models.Movement, int, error)
	GetMovement(ctx context.Context, id int) (*models.Movement, error)
}

type inventoryService struct {
	repo repository.InventoryRepository
}

// NewInventoryService returns an InventoryService backed by the given repository.
func NewInventoryService(repo repository.InventoryRepository) InventoryService {
	return &inventoryService{repo: repo}
}

func (s *inventoryService) Receive(ctx context.Context, req models.ReceiveRequest, createdBy string) (*models.OperationResult, error) {
	result, err := s.repo.CallReceive(ctx, repository.ReceiveParams{
		ProductID:         req.ProductID,
		LocationID:        req.LocationID,
		Quantity:          req.Quantity,
		UnitCost:          req.UnitCost,
		ReferenceDocument: req.ReferenceDocument,
		Notes:             req.Notes,
		CreatedBy:         createdBy,
	})
	if err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, errors.New(result.Message)
	}
	return result, nil
}

func (s *inventoryService) Ship(ctx context.Context, req models.ShipRequest, createdBy string) (*models.OperationResult, error) {
	result, err := s.repo.CallShip(ctx, repository.ShipParams{
		ProductID:         req.ProductID,
		LocationID:        req.LocationID,
		Quantity:          req.Quantity,
		UnitCost:          req.UnitCost,
		ReferenceDocument: req.ReferenceDocument,
		Notes:             req.Notes,
		CreatedBy:         createdBy,
	})
	if err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, errors.New(result.Message)
	}
	return result, nil
}

func (s *inventoryService) Transfer(ctx context.Context, req models.TransferRequest, createdBy string) (*models.TransferResult, error) {
	if req.FromLocationID == req.ToLocationID {
		return nil, errors.New("from and to locations must be different")
	}
	result, err := s.repo.CallTransfer(ctx, repository.TransferParams{
		ProductID:         req.ProductID,
		FromLocationID:    req.FromLocationID,
		ToLocationID:      req.ToLocationID,
		Quantity:          req.Quantity,
		UnitCost:          req.UnitCost,
		ReferenceDocument: req.ReferenceDocument,
		Notes:             req.Notes,
		CreatedBy:         createdBy,
	})
	if err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, errors.New(result.Message)
	}
	return result, nil
}

func (s *inventoryService) Adjust(ctx context.Context, req models.AdjustRequest, createdBy string) (*models.OperationResult, error) {
	result, err := s.repo.CallAdjust(ctx, repository.AdjustParams{
		ProductID:         req.ProductID,
		LocationID:        req.LocationID,
		AdjustmentQty:     req.AdjustmentQty,
		Reason:            req.Reason,
		ReferenceDocument: req.ReferenceDocument,
		CreatedBy:         createdBy,
	})
	if err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, errors.New(result.Message)
	}
	return result, nil
}

func (s *inventoryService) ListMovements(ctx context.Context, f models.MovementFilter) ([]models.Movement, int, error) {
	return s.repo.ListMovements(ctx, f)
}

func (s *inventoryService) GetMovement(ctx context.Context, id int) (*models.Movement, error) {
	return s.repo.GetMovementByID(ctx, id)
}
