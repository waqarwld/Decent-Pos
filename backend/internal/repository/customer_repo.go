package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// CustomerRepository defines the data-access interface for customers.
type CustomerRepository interface {
	List(ctx context.Context, page, pageSize int) ([]models.Customer, int, error)
	GetByID(ctx context.Context, id int) (*models.Customer, error)
	Create(ctx context.Context, req models.CreateCustomerRequest) (*models.Customer, error)
	Update(ctx context.Context, id int, req models.UpdateCustomerRequest) (*models.Customer, error)
}

type customerRepo struct {
	db *pgxpool.Pool
}

// NewCustomerRepository returns a CustomerRepository backed by the given pool.
func NewCustomerRepository(db *pgxpool.Pool) CustomerRepository {
	return &customerRepo{db: db}
}

// List returns a paginated slice of customers plus the total count.
func (r *customerRepo) List(ctx context.Context, page, pageSize int) ([]models.Customer, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM customers").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("customer list count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT customer_id, code, name, email, phone, address, customer_type, is_active, created_at, updated_at
	          FROM customers
	          ORDER BY customer_id ASC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("customer list query: %w", err)
	}
	defer rows.Close()

	customers := []models.Customer{}
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.CustomerID, &c.Code, &c.Name, &c.Email, &c.Phone, &c.Address, &c.CustomerType, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("customer list scan: %w", err)
		}
		customers = append(customers, c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("customer list rows: %w", err)
	}

	return customers, total, nil
}

// GetByID returns the customer with the given ID, or ErrNotFound if none exists.
func (r *customerRepo) GetByID(ctx context.Context, id int) (*models.Customer, error) {
	query := `SELECT customer_id, code, name, email, phone, address, customer_type, is_active, created_at, updated_at
	          FROM customers WHERE customer_id = $1`

	var c models.Customer
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.CustomerID, &c.Code, &c.Name, &c.Email, &c.Phone, &c.Address, &c.CustomerType, &c.IsActive, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("customer get by id: %w", err)
	}
	return &c, nil
}

// Create inserts a new customer and returns the created row. When no code is
// supplied, one is generated from the customer sequence (e.g. CUST-00001).
func (r *customerRepo) Create(ctx context.Context, req models.CreateCustomerRequest) (*models.Customer, error) {
	customerType := "retail"
	if req.CustomerType != "" {
		customerType = req.CustomerType
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Draw the next sequence value once and reuse it for both the primary key
	// and the generated code so the code number always matches the id.
	var nextID int64
	if err := r.db.QueryRow(ctx, "SELECT nextval(pg_get_serial_sequence('customers', 'customer_id'))").Scan(&nextID); err != nil {
		return nil, fmt.Errorf("customer id sequence: %w", err)
	}

	code := req.Code
	if code == "" {
		code = fmt.Sprintf("CUST-%05d", nextID)
	}

	query := `INSERT INTO customers (customer_id, code, name, email, phone, address, customer_type, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	          RETURNING customer_id, code, name, email, phone, address, customer_type, is_active, created_at, updated_at`

	var c models.Customer
	err := r.db.QueryRow(ctx, query, nextID, code, req.Name, req.Email, req.Phone, req.Address, customerType, isActive).Scan(
		&c.CustomerID, &c.Code, &c.Name, &c.Email, &c.Phone, &c.Address, &c.CustomerType, &c.IsActive, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("customer create: %w", err)
	}
	return &c, nil
}

// Update applies non-nil fields from req to the customer with the given ID and returns the updated row.
func (r *customerRepo) Update(ctx context.Context, id int, req models.UpdateCustomerRequest) (*models.Customer, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
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
	if req.Address != nil {
		setClauses = append(setClauses, fmt.Sprintf("address = $%d", argIdx))
		args = append(args, *req.Address)
		argIdx++
	}
	if req.CustomerType != nil {
		setClauses = append(setClauses, fmt.Sprintf("customer_type = $%d", argIdx))
		args = append(args, *req.CustomerType)
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

	query := fmt.Sprintf(`UPDATE customers SET %s
	                      WHERE customer_id = $%d
	                      RETURNING customer_id, code, name, email, phone, address, customer_type, is_active, created_at, updated_at`,
		setStr, argIdx)
	args = append(args, id)

	var c models.Customer
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&c.CustomerID, &c.Code, &c.Name, &c.Email, &c.Phone, &c.Address, &c.CustomerType, &c.IsActive, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("customer update: %w", err)
	}
	return &c, nil
}
