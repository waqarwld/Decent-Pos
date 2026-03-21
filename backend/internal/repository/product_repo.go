package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// ProductRepository defines the data-access interface for products.
type ProductRepository interface {
	List(ctx context.Context, f models.ProductFilter) ([]models.Product, int, error)
	GetByID(ctx context.Context, id int) (*models.Product, error)
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error)
	Update(ctx context.Context, id int, req models.UpdateProductRequest) (*models.Product, error)
	Delete(ctx context.Context, id int) error
}

type productRepo struct {
	db *pgxpool.Pool
}

// NewProductRepository returns a ProductRepository backed by the given pool.
func NewProductRepository(db *pgxpool.Pool) ProductRepository {
	return &productRepo{db: db}
}

// List returns a paginated slice of products matching the filter, plus the total count.
func (r *productRepo) List(ctx context.Context, f models.ProductFilter) ([]models.Product, int, error) {
	base := `SELECT product_id, sku, name, description, category_id, unit_of_measure,
	                weight_kg, cost_price, selling_price, status, created_at, updated_at
	         FROM products`

	args := []any{}
	conditions := []string{}
	argIdx := 1

	if f.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, f.Status)
		argIdx++
	}
	if f.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf("category_id = $%d", argIdx))
		args = append(args, *f.CategoryID)
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

	// Count total matching rows
	countQuery := "SELECT COUNT(*) FROM products" + where
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("product list count: %w", err)
	}

	// Paginated data query
	offset := (f.Page - 1) * f.PageSize
	dataQuery := base + where +
		fmt.Sprintf(" ORDER BY product_id ASC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, f.PageSize, offset)

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("product list query: %w", err)
	}
	defer rows.Close()

	products := []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ProductID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
			&p.UnitOfMeasure, &p.WeightKg, &p.CostPrice, &p.SellingPrice,
			&p.Status, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("product list scan: %w", err)
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("product list rows: %w", err)
	}

	return products, total, nil
}

// GetByID returns the product with the given ID, or ErrNotFound if none exists.
func (r *productRepo) GetByID(ctx context.Context, id int) (*models.Product, error) {
	query := `SELECT product_id, sku, name, description, category_id, unit_of_measure,
	                 weight_kg, cost_price, selling_price, status, created_at, updated_at
	          FROM products WHERE product_id = $1`

	var p models.Product
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ProductID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
		&p.UnitOfMeasure, &p.WeightKg, &p.CostPrice, &p.SellingPrice,
		&p.Status, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("product get by id: %w", err)
	}
	return &p, nil
}

// GetBySKU returns the product with the given SKU, or ErrNotFound if none exists.
func (r *productRepo) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	query := `SELECT product_id, sku, name, description, category_id, unit_of_measure,
	                 weight_kg, cost_price, selling_price, status, created_at, updated_at
	          FROM products WHERE sku = $1`

	var p models.Product
	err := r.db.QueryRow(ctx, query, sku).Scan(
		&p.ProductID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
		&p.UnitOfMeasure, &p.WeightKg, &p.CostPrice, &p.SellingPrice,
		&p.Status, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("product get by sku: %w", err)
	}
	return &p, nil
}

// Create inserts a new product and returns the created row.
// Returns ErrDuplicateSKU if the SKU already exists.
func (r *productRepo) Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	status := req.Status
	if status == "" {
		status = "active"
	}

	query := `INSERT INTO products (sku, name, description, category_id, unit_of_measure,
	                                weight_kg, cost_price, selling_price, status)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	          RETURNING product_id, sku, name, description, category_id, unit_of_measure,
	                    weight_kg, cost_price, selling_price, status, created_at, updated_at`

	var p models.Product
	err := r.db.QueryRow(ctx, query,
		req.SKU, req.Name, req.Description, req.CategoryID, req.UnitOfMeasure,
		req.WeightKg, req.CostPrice, req.SellingPrice, status,
	).Scan(
		&p.ProductID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
		&p.UnitOfMeasure, &p.WeightKg, &p.CostPrice, &p.SellingPrice,
		&p.Status, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicateSKU
		}
		return nil, fmt.Errorf("product create: %w", err)
	}
	return &p, nil
}

// Update applies non-nil fields from req to the product with the given ID and returns the updated row.
func (r *productRepo) Update(ctx context.Context, id int, req models.UpdateProductRequest) (*models.Product, error) {
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
	if req.CategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("category_id = $%d", argIdx))
		args = append(args, *req.CategoryID)
		argIdx++
	}
	if req.UnitOfMeasure != nil {
		setClauses = append(setClauses, fmt.Sprintf("unit_of_measure = $%d", argIdx))
		args = append(args, *req.UnitOfMeasure)
		argIdx++
	}
	if req.WeightKg != nil {
		setClauses = append(setClauses, fmt.Sprintf("weight_kg = $%d", argIdx))
		args = append(args, *req.WeightKg)
		argIdx++
	}
	if req.CostPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("cost_price = $%d", argIdx))
		args = append(args, *req.CostPrice)
		argIdx++
	}
	if req.SellingPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("selling_price = $%d", argIdx))
		args = append(args, *req.SellingPrice)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(setClauses) == 0 {
		// Nothing to update — just return the current row
		return r.GetByID(ctx, id)
	}

	setStr := ""
	for i, c := range setClauses {
		if i > 0 {
			setStr += ", "
		}
		setStr += c
	}

	query := fmt.Sprintf(`UPDATE products SET %s, updated_at = NOW()
	                      WHERE product_id = $%d
	                      RETURNING product_id, sku, name, description, category_id, unit_of_measure,
	                                weight_kg, cost_price, selling_price, status, created_at, updated_at`,
		setStr, argIdx)
	args = append(args, id)

	var p models.Product
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&p.ProductID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
		&p.UnitOfMeasure, &p.WeightKg, &p.CostPrice, &p.SellingPrice,
		&p.Status, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("product update: %w", err)
	}
	return &p, nil
}

// Delete soft-deletes a product by setting its status to 'discontinued'.
func (r *productRepo) Delete(ctx context.Context, id int) error {
	query := `UPDATE products SET status = 'discontinued', updated_at = NOW() WHERE product_id = $1`
	tag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("product delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
