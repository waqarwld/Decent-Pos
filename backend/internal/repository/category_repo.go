package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// CategoryRepository defines the data-access interface for categories.
type CategoryRepository interface {
	List(ctx context.Context, page, pageSize int) ([]models.Category, int, error)
	GetByID(ctx context.Context, id int) (*models.Category, error)
	Create(ctx context.Context, req models.CreateCategoryRequest) (*models.Category, error)
	Update(ctx context.Context, id int, req models.UpdateCategoryRequest) (*models.Category, error)
}

type categoryRepo struct {
	db *pgxpool.Pool
}

// NewCategoryRepository returns a CategoryRepository backed by the given pool.
func NewCategoryRepository(db *pgxpool.Pool) CategoryRepository {
	return &categoryRepo{db: db}
}

// List returns a paginated slice of categories plus the total count.
func (r *categoryRepo) List(ctx context.Context, page, pageSize int) ([]models.Category, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM categories").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("category list count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT category_id, name, description, parent_category_id, is_active, created_at
	          FROM categories
	          ORDER BY category_id ASC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("category list query: %w", err)
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.CategoryID, &c.Name, &c.Description, &c.ParentCategoryID, &c.IsActive, &c.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("category list scan: %w", err)
		}
		categories = append(categories, c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("category list rows: %w", err)
	}

	return categories, total, nil
}

// GetByID returns the category with the given ID, or ErrNotFound if none exists.
func (r *categoryRepo) GetByID(ctx context.Context, id int) (*models.Category, error) {
	query := `SELECT category_id, name, description, parent_category_id, is_active, created_at
	          FROM categories WHERE category_id = $1`

	var c models.Category
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.CategoryID, &c.Name, &c.Description, &c.ParentCategoryID, &c.IsActive, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("category get by id: %w", err)
	}
	return &c, nil
}

// Create inserts a new category and returns the created row.
func (r *categoryRepo) Create(ctx context.Context, req models.CreateCategoryRequest) (*models.Category, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	query := `INSERT INTO categories (name, description, parent_category_id, is_active)
	          VALUES ($1, $2, $3, $4)
	          RETURNING category_id, name, description, parent_category_id, is_active, created_at`

	var c models.Category
	err := r.db.QueryRow(ctx, query, req.Name, req.Description, req.ParentCategoryID, isActive).Scan(
		&c.CategoryID, &c.Name, &c.Description, &c.ParentCategoryID, &c.IsActive, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("category create: %w", err)
	}
	return &c, nil
}

// Update applies non-nil fields from req to the category with the given ID and returns the updated row.
func (r *categoryRepo) Update(ctx context.Context, id int, req models.UpdateCategoryRequest) (*models.Category, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.ParentCategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("parent_category_id = $%d", argIdx))
		args = append(args, *req.ParentCategoryID)
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

	query := fmt.Sprintf(`UPDATE categories SET %s
	                      WHERE category_id = $%d
	                      RETURNING category_id, name, description, parent_category_id, is_active, created_at`,
		setStr, argIdx)
	args = append(args, id)

	var c models.Category
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&c.CategoryID, &c.Name, &c.Description, &c.ParentCategoryID, &c.IsActive, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("category update: %w", err)
	}
	return &c, nil
}
