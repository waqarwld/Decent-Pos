package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// LocationRepository defines the data-access interface for locations.
type LocationRepository interface {
	List(ctx context.Context, locationType string, isActive *bool, page, pageSize int) ([]models.Location, int, error)
	GetByID(ctx context.Context, id int) (*models.Location, error)
	Create(ctx context.Context, req models.CreateLocationRequest) (*models.Location, error)
	Update(ctx context.Context, id int, req models.UpdateLocationRequest) (*models.Location, error)
}

type locationRepo struct {
	db *pgxpool.Pool
}

// NewLocationRepository returns a LocationRepository backed by the given pool.
func NewLocationRepository(db *pgxpool.Pool) LocationRepository {
	return &locationRepo{db: db}
}

// List returns a paginated slice of locations with optional filters, plus the total count.
func (r *locationRepo) List(ctx context.Context, locationType string, isActive *bool, page, pageSize int) ([]models.Location, int, error) {
	args := []any{}
	conditions := []string{}
	argIdx := 1

	if locationType != "" {
		conditions = append(conditions, fmt.Sprintf("location_type = $%d", argIdx))
		args = append(args, locationType)
		argIdx++
	}
	if isActive != nil {
		conditions = append(conditions, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *isActive)
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = " WHERE "
		for i, c := range conditions {
			if i > 0 {
				where += " AND "
			}
			where += c
		}
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM locations"+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("location list count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`SELECT location_id, code, name, location_type, parent_location_id, capacity, is_active, created_at
	          FROM locations%s
	          ORDER BY location_id ASC
	          LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("location list query: %w", err)
	}
	defer rows.Close()

	locations := []models.Location{}
	for rows.Next() {
		var l models.Location
		if err := rows.Scan(&l.LocationID, &l.Code, &l.Name, &l.LocationType, &l.ParentLocationID, &l.Capacity, &l.IsActive, &l.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("location list scan: %w", err)
		}
		locations = append(locations, l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("location list rows: %w", err)
	}

	return locations, total, nil
}

// GetByID returns the location with the given ID, or ErrNotFound if none exists.
func (r *locationRepo) GetByID(ctx context.Context, id int) (*models.Location, error) {
	query := `SELECT location_id, code, name, location_type, parent_location_id, capacity, is_active, created_at
	          FROM locations WHERE location_id = $1`

	var l models.Location
	err := r.db.QueryRow(ctx, query, id).Scan(
		&l.LocationID, &l.Code, &l.Name, &l.LocationType, &l.ParentLocationID, &l.Capacity, &l.IsActive, &l.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("location get by id: %w", err)
	}
	return &l, nil
}

// Create inserts a new location and returns the created row.
func (r *locationRepo) Create(ctx context.Context, req models.CreateLocationRequest) (*models.Location, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	query := `INSERT INTO locations (code, name, location_type, parent_location_id, capacity, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6)
	          RETURNING location_id, code, name, location_type, parent_location_id, capacity, is_active, created_at`

	var l models.Location
	err := r.db.QueryRow(ctx, query, req.Code, req.Name, req.LocationType, req.ParentLocationID, req.Capacity, isActive).Scan(
		&l.LocationID, &l.Code, &l.Name, &l.LocationType, &l.ParentLocationID, &l.Capacity, &l.IsActive, &l.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("location create: %w", err)
	}
	return &l, nil
}

// Update applies non-nil fields from req to the location with the given ID and returns the updated row.
func (r *locationRepo) Update(ctx context.Context, id int, req models.UpdateLocationRequest) (*models.Location, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.LocationType != nil {
		setClauses = append(setClauses, fmt.Sprintf("location_type = $%d", argIdx))
		args = append(args, *req.LocationType)
		argIdx++
	}
	if req.ParentLocationID != nil {
		setClauses = append(setClauses, fmt.Sprintf("parent_location_id = $%d", argIdx))
		args = append(args, *req.ParentLocationID)
		argIdx++
	}
	if req.Capacity != nil {
		setClauses = append(setClauses, fmt.Sprintf("capacity = $%d", argIdx))
		args = append(args, *req.Capacity)
		argIdx++
	}
	if req.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	setStr := ""
	for i, c := range setClauses {
		if i > 0 {
			setStr += ", "
		}
		setStr += c
	}

	query := fmt.Sprintf(`UPDATE locations SET %s
	                      WHERE location_id = $%d
	                      RETURNING location_id, code, name, location_type, parent_location_id, capacity, is_active, created_at`,
		setStr, argIdx)
	args = append(args, id)

	var l models.Location
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&l.LocationID, &l.Code, &l.Name, &l.LocationType, &l.ParentLocationID, &l.Capacity, &l.IsActive, &l.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("location update: %w", err)
	}
	return &l, nil
}
