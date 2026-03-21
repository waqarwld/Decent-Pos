package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// SupplierRepository defines the data-access interface for suppliers.
type SupplierRepository interface {
	List(ctx context.Context, page, pageSize int) ([]models.Supplier, int, error)
	GetByID(ctx context.Context, id int) (*models.Supplier, error)
	Create(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error)
	Update(ctx context.Context, id int, req models.UpdateSupplierRequest) (*models.Supplier, error)
}

type supplierRepo struct {
	db *pgxpool.Pool
}

// NewSupplierRepository returns a SupplierRepository backed by the given pool.
func NewSupplierRepository(db *pgxpool.Pool) SupplierRepository {
	return &supplierRepo{db: db}
}

// List returns a paginated slice of suppliers plus the total count.
func (r *supplierRepo) List(ctx context.Context, page, pageSize int) ([]models.Supplier, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM suppliers").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("supplier list count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT supplier_id, code, name, contact_person, email, phone, payment_terms, is_active, created_at
	          FROM suppliers
	          ORDER BY supplier_id ASC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("supplier list query: %w", err)
	}
	defer rows.Close()

	suppliers := []models.Supplier{}
	for rows.Next() {
		var s models.Supplier
		if err := rows.Scan(&s.SupplierID, &s.Code, &s.Name, &s.ContactPerson, &s.Email, &s.Phone, &s.PaymentTerms, &s.IsActive, &s.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("supplier list scan: %w", err)
		}
		suppliers = append(suppliers, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("supplier list rows: %w", err)
	}

	return suppliers, total, nil
}

// GetByID returns the supplier with the given ID, or ErrNotFound if none exists.
func (r *supplierRepo) GetByID(ctx context.Context, id int) (*models.Supplier, error) {
	query := `SELECT supplier_id, code, name, contact_person, email, phone, payment_terms, is_active, created_at
	          FROM suppliers WHERE supplier_id = $1`

	var s models.Supplier
	err := r.db.QueryRow(ctx, query, id).Scan(
		&s.SupplierID, &s.Code, &s.Name, &s.ContactPerson, &s.Email, &s.Phone, &s.PaymentTerms, &s.IsActive, &s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("supplier get by id: %w", err)
	}
	return &s, nil
}

// Create inserts a new supplier and returns the created row.
func (r *supplierRepo) Create(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	query := `INSERT INTO suppliers (code, name, contact_person, email, phone, payment_terms, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          RETURNING supplier_id, code, name, contact_person, email, phone, payment_terms, is_active, created_at`

	var s models.Supplier
	err := r.db.QueryRow(ctx, query, req.Code, req.Name, req.ContactPerson, req.Email, req.Phone, req.PaymentTerms, isActive).Scan(
		&s.SupplierID, &s.Code, &s.Name, &s.ContactPerson, &s.Email, &s.Phone, &s.PaymentTerms, &s.IsActive, &s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("supplier create: %w", err)
	}
	return &s, nil
}

// Update applies non-nil fields from req to the supplier with the given ID and returns the updated row.
func (r *supplierRepo) Update(ctx context.Context, id int, req models.UpdateSupplierRequest) (*models.Supplier, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.ContactPerson != nil {
		setClauses = append(setClauses, fmt.Sprintf("contact_person = $%d", argIdx))
		args = append(args, *req.ContactPerson)
		argIdx++
	}
	if req.Email != nil {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *req.Email)
		argIdx++
	}
	if req.Phone != nil {
		setClauses = append(setClauses, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.PaymentTerms != nil {
		setClauses = append(setClauses, fmt.Sprintf("payment_terms = $%d", argIdx))
		args = append(args, *req.PaymentTerms)
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

	query := fmt.Sprintf(`UPDATE suppliers SET %s
	                      WHERE supplier_id = $%d
	                      RETURNING supplier_id, code, name, contact_person, email, phone, payment_terms, is_active, created_at`,
		setStr, argIdx)
	args = append(args, id)

	var s models.Supplier
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&s.SupplierID, &s.Code, &s.Name, &s.ContactPerson, &s.Email, &s.Phone, &s.PaymentTerms, &s.IsActive, &s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("supplier update: %w", err)
	}
	return &s, nil
}
