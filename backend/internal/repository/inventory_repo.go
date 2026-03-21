package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// ReceiveParams holds the parameters for a receive_inventory stored procedure call.
type ReceiveParams struct {
	ProductID         int
	LocationID        int
	Quantity          int
	UnitCost          float64
	ReferenceDocument *string
	Notes             *string
	CreatedBy         string
}

// ShipParams holds the parameters for a ship_inventory stored procedure call.
type ShipParams struct {
	ProductID         int
	LocationID        int
	Quantity          int
	UnitCost          float64
	ReferenceDocument *string
	Notes             *string
	CreatedBy         string
}

// TransferParams holds the parameters for a transfer_inventory stored procedure call.
type TransferParams struct {
	ProductID         int
	FromLocationID    int
	ToLocationID      int
	Quantity          int
	UnitCost          float64
	ReferenceDocument *string
	Notes             *string
	CreatedBy         string
}

// AdjustParams holds the parameters for an adjust_inventory stored procedure call.
type AdjustParams struct {
	ProductID         int
	LocationID        int
	AdjustmentQty     int
	Reason            string
	ReferenceDocument *string
	CreatedBy         string
}

// InventoryRepository defines the data-access interface for inventory operations.
type InventoryRepository interface {
	CallReceive(ctx context.Context, p ReceiveParams) (*models.OperationResult, error)
	CallShip(ctx context.Context, p ShipParams) (*models.OperationResult, error)
	CallTransfer(ctx context.Context, p TransferParams) (*models.TransferResult, error)
	CallAdjust(ctx context.Context, p AdjustParams) (*models.OperationResult, error)
	ListMovements(ctx context.Context, f models.MovementFilter) ([]models.Movement, int, error)
	GetMovementByID(ctx context.Context, id int) (*models.Movement, error)
}

type inventoryRepo struct {
	db *pgxpool.Pool
}

// NewInventoryRepository returns an InventoryRepository backed by the given pool.
func NewInventoryRepository(db *pgxpool.Pool) InventoryRepository {
	return &inventoryRepo{db: db}
}

// CallReceive calls the receive_inventory stored procedure and returns the result.
func (r *inventoryRepo) CallReceive(ctx context.Context, p ReceiveParams) (*models.OperationResult, error) {
	query := `SELECT success, message, movement_id, new_stock_level FROM receive_inventory($1,$2,$3,$4,$5,$6,$7)`
	var res models.OperationResult
	err := r.db.QueryRow(ctx, query,
		p.ProductID, p.LocationID, p.Quantity, p.UnitCost, p.ReferenceDocument, p.Notes, p.CreatedBy,
	).Scan(&res.Success, &res.Message, &res.MovementID, &res.NewStockLevel)
	if err != nil {
		return nil, fmt.Errorf("receive_inventory: %w", err)
	}
	return &res, nil
}

// CallShip calls the ship_inventory stored procedure and returns the result.
func (r *inventoryRepo) CallShip(ctx context.Context, p ShipParams) (*models.OperationResult, error) {
	query := `SELECT success, message, movement_id, new_stock_level FROM ship_inventory($1,$2,$3,$4,$5,$6,$7)`
	var res models.OperationResult
	err := r.db.QueryRow(ctx, query,
		p.ProductID, p.LocationID, p.Quantity, p.UnitCost, p.ReferenceDocument, p.Notes, p.CreatedBy,
	).Scan(&res.Success, &res.Message, &res.MovementID, &res.NewStockLevel)
	if err != nil {
		return nil, fmt.Errorf("ship_inventory: %w", err)
	}
	return &res, nil
}

// CallTransfer calls the transfer_inventory stored procedure and returns the result.
func (r *inventoryRepo) CallTransfer(ctx context.Context, p TransferParams) (*models.TransferResult, error) {
	query := `SELECT success, message, movement_out_id, movement_in_id, from_stock_level, to_stock_level FROM transfer_inventory($1,$2,$3,$4,$5,$6,$7,$8)`
	var res models.TransferResult
	err := r.db.QueryRow(ctx, query,
		p.ProductID, p.FromLocationID, p.ToLocationID, p.Quantity, p.UnitCost, p.ReferenceDocument, p.Notes, p.CreatedBy,
	).Scan(&res.Success, &res.Message, &res.MovementOutID, &res.MovementInID, &res.FromStockLevel, &res.ToStockLevel)
	if err != nil {
		return nil, fmt.Errorf("transfer_inventory: %w", err)
	}
	return &res, nil
}

// CallAdjust calls the adjust_inventory stored procedure and returns the result.
func (r *inventoryRepo) CallAdjust(ctx context.Context, p AdjustParams) (*models.OperationResult, error) {
	query := `SELECT success, message, movement_id, new_stock_level FROM adjust_inventory($1,$2,$3,$4,$5,$6)`
	var res models.OperationResult
	err := r.db.QueryRow(ctx, query,
		p.ProductID, p.LocationID, p.AdjustmentQty, p.Reason, p.ReferenceDocument, p.CreatedBy,
	).Scan(&res.Success, &res.Message, &res.MovementID, &res.NewStockLevel)
	if err != nil {
		return nil, fmt.Errorf("adjust_inventory: %w", err)
	}
	return &res, nil
}

// ListMovements returns a paginated list of movements matching the filter, plus the total count.
func (r *inventoryRepo) ListMovements(ctx context.Context, f models.MovementFilter) ([]models.Movement, int, error) {
	args := []any{}
	conditions := []string{}
	argIdx := 1

	if f.ProductID != nil {
		conditions = append(conditions, fmt.Sprintf("product_id = $%d", argIdx))
		args = append(args, *f.ProductID)
		argIdx++
	}
	if f.LocationID != nil {
		conditions = append(conditions, fmt.Sprintf("location_id = $%d", argIdx))
		args = append(args, *f.LocationID)
		argIdx++
	}
	if f.MovementTypeID != nil {
		conditions = append(conditions, fmt.Sprintf("movement_type_id = $%d", argIdx))
		args = append(args, *f.MovementTypeID)
		argIdx++
	}
	if f.FromDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", argIdx))
		args = append(args, *f.FromDate)
		argIdx++
	}
	if f.ToDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", argIdx))
		args = append(args, *f.ToDate)
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM inventory_movements"+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("movement list count: %w", err)
	}

	offset := (f.Page - 1) * f.PageSize
	query := fmt.Sprintf(`SELECT movement_id, product_id, location_id, movement_type_id,
	                             quantity, unit_cost, reference_document, notes, created_by, created_at
	                      FROM inventory_movements%s
	                      ORDER BY movement_id ASC
	                      LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)
	args = append(args, f.PageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("movement list query: %w", err)
	}
	defer rows.Close()

	movements := []models.Movement{}
	for rows.Next() {
		var m models.Movement
		if err := rows.Scan(
			&m.MovementID, &m.ProductID, &m.LocationID, &m.MovementTypeID,
			&m.Quantity, &m.UnitCost, &m.ReferenceDocument, &m.Notes, &m.CreatedBy, &m.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("movement list scan: %w", err)
		}
		movements = append(movements, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("movement list rows: %w", err)
	}

	return movements, total, nil
}

// GetMovementByID returns the movement with the given ID, or ErrNotFound if none exists.
func (r *inventoryRepo) GetMovementByID(ctx context.Context, id int) (*models.Movement, error) {
	query := `SELECT movement_id, product_id, location_id, movement_type_id,
	                 quantity, unit_cost, reference_document, notes, created_by, created_at
	          FROM inventory_movements WHERE movement_id = $1`

	var m models.Movement
	err := r.db.QueryRow(ctx, query, id).Scan(
		&m.MovementID, &m.ProductID, &m.LocationID, &m.MovementTypeID,
		&m.Quantity, &m.UnitCost, &m.ReferenceDocument, &m.Notes, &m.CreatedBy, &m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("movement get by id: %w", err)
	}
	return &m, nil
}
