package repository

import (
	"context"
	"errors"
	"fmt"
	"math"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// ErrInsufficientStock is returned when a sale line exceeds available stock.
var ErrInsufficientStock = errors.New("insufficient stock")

// SaleRepository defines the data-access interface for sales and returns.
type SaleRepository interface {
	List(ctx context.Context, page, pageSize int) ([]models.Sale, int, error)
	GetByID(ctx context.Context, id int) (*models.Sale, error)
	Create(ctx context.Context, req models.CreateSaleRequest, createdBy string) (*models.Sale, error)
	ListByCustomer(ctx context.Context, customerID int) (*models.CustomerPurchases, error)
	CreateReturn(ctx context.Context, saleID int, req models.CreateReturnRequest, createdBy string) (*models.Return, error)
}

type saleRepo struct {
	db *pgxpool.Pool
}

// NewSaleRepository returns a SaleRepository backed by the given pool.
func NewSaleRepository(db *pgxpool.Pool) SaleRepository {
	return &saleRepo{db: db}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// List returns a paginated slice of sales (with item counts) plus the total count.
func (r *saleRepo) List(ctx context.Context, page, pageSize int) ([]models.Sale, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM sales").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("sale list count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT s.sale_id, s.sale_number, s.customer_id, c.name, s.location_id,
	                 s.subtotal, s.discount, s.total, s.payment_method, s.status, s.created_by, s.created_at
	          FROM sales s
	          LEFT JOIN customers c ON c.customer_id = s.customer_id
	          ORDER BY s.sale_id DESC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("sale list query: %w", err)
	}
	defer rows.Close()

	sales := []models.Sale{}
	for rows.Next() {
		var s models.Sale
		if err := rows.Scan(&s.SaleID, &s.SaleNumber, &s.CustomerID, &s.CustomerName, &s.LocationID,
			&s.Subtotal, &s.Discount, &s.Total, &s.PaymentMethod, &s.Status, &s.CreatedBy, &s.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("sale list scan: %w", err)
		}
		sales = append(sales, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("sale list rows: %w", err)
	}

	return sales, total, nil
}

// GetByID returns a single sale with its line items, or ErrNotFound.
func (r *saleRepo) GetByID(ctx context.Context, id int) (*models.Sale, error) {
	query := `SELECT s.sale_id, s.sale_number, s.customer_id, c.name, s.location_id,
	                 s.subtotal, s.discount, s.total, s.payment_method, s.status, s.created_by, s.created_at
	          FROM sales s
	          LEFT JOIN customers c ON c.customer_id = s.customer_id
	          WHERE s.sale_id = $1`

	var s models.Sale
	err := r.db.QueryRow(ctx, query, id).Scan(&s.SaleID, &s.SaleNumber, &s.CustomerID, &s.CustomerName, &s.LocationID,
		&s.Subtotal, &s.Discount, &s.Total, &s.PaymentMethod, &s.Status, &s.CreatedBy, &s.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("sale get by id: %w", err)
	}

	items, err := r.loadItems(ctx, id)
	if err != nil {
		return nil, err
	}
	s.Items = items
	return &s, nil
}

// ListByCustomer returns a customer's purchase history (sales with line items).
func (r *saleRepo) ListByCustomer(ctx context.Context, customerID int) (*models.CustomerPurchases, error) {
	var name string
	if err := r.db.QueryRow(ctx, "SELECT name FROM customers WHERE customer_id=$1", customerID).Scan(&name); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("customer purchase history lookup: %w", err)
	}

	rows, err := r.db.Query(ctx, `SELECT sale_id, sale_number, customer_id, location_id,
	                                     subtotal, discount, total, payment_method, status, created_by, created_at
	                              FROM sales
	                              WHERE customer_id = $1
	                              ORDER BY sale_id DESC`, customerID)
	if err != nil {
		return nil, fmt.Errorf("customer purchase history: %w", err)
	}
	defer rows.Close()

	sales := []models.Sale{}
	for rows.Next() {
		var s models.Sale
		if err := rows.Scan(&s.SaleID, &s.SaleNumber, &s.CustomerID, &s.LocationID,
			&s.Subtotal, &s.Discount, &s.Total, &s.PaymentMethod, &s.Status, &s.CreatedBy, &s.CreatedAt); err != nil {
			return nil, fmt.Errorf("customer purchase history scan: %w", err)
		}
		sales = append(sales, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("customer purchase history rows: %w", err)
	}

	for i := range sales {
		items, err := r.loadItems(ctx, sales[i].SaleID)
		if err != nil {
			return nil, err
		}
		sales[i].Items = items
	}

	return &models.CustomerPurchases{CustomerID: customerID, CustomerName: name, Sales: sales}, nil
}

// Create creates a sale (header + line items + stock movements) atomically.
// Unit price is the product's wholesale price for wholesale customers, else the
// selling price. Stock is validated before the sale is written.
func (r *saleRepo) Create(ctx context.Context, req models.CreateSaleRequest, createdBy string) (*models.Sale, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("sale create begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Determine the customer's type for price selection (walk-in defaults to retail).
	customerType := "retail"
	var customerName *string
	if req.CustomerID != nil {
		var ct string
		err := tx.QueryRow(ctx, "SELECT customer_type, name FROM customers WHERE customer_id=$1", *req.CustomerID).Scan(&ct, &customerName)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrNotFound
			}
			return nil, fmt.Errorf("sale customer lookup: %w", err)
		}
		customerType = ct
	}

	// Draw the next sequence value once and reuse it for both the primary key
	// and the sale number so the number always matches the id.
	var nextID int64
	if err := tx.QueryRow(ctx, "SELECT nextval(pg_get_serial_sequence('sales', 'sale_id'))").Scan(&nextID); err != nil {
		return nil, fmt.Errorf("sale number sequence: %w", err)
	}
	saleNumber := fmt.Sprintf("SALE-%05d", nextID)

	// Resolve the SALE movement type once (its trigger decrements stock).
	var saleMoveTypeID int
	if err := tx.QueryRow(ctx, "SELECT movement_type_id FROM movement_types WHERE code='SALE'").Scan(&saleMoveTypeID); err != nil {
		return nil, fmt.Errorf("sale movement type lookup: %w", err)
	}

	// Price each line and validate stock availability.
	subtotal := 0.0
	items := make([]models.SaleItem, 0, len(req.Items))
	for _, it := range req.Items {
		var selling, wholesale *float64
		var prodName, sku string
		err := tx.QueryRow(ctx, "SELECT selling_price, wholesale_price, name, sku FROM products WHERE product_id=$1", it.ProductID).
			Scan(&selling, &wholesale, &prodName, &sku)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, fmt.Errorf("product %d not found", it.ProductID)
			}
			return nil, fmt.Errorf("sale product lookup: %w", err)
		}

		unitPrice := 0.0
		if selling != nil {
			unitPrice = *selling
		}
		if customerType == "wholesale" && wholesale != nil {
			unitPrice = *wholesale
		}
		lineTotal := round2(unitPrice * float64(it.Quantity))

		var available int
		if err := tx.QueryRow(ctx, "SELECT COALESCE(quantity_available,0) FROM stock_levels WHERE product_id=$1 AND location_id=$2",
			it.ProductID, req.LocationID).Scan(&available); err != nil {
			return nil, fmt.Errorf("sale stock lookup: %w", err)
		}
		if available < it.Quantity {
			return nil, fmt.Errorf("%w: %s", ErrInsufficientStock, prodName)
		}

		subtotal += lineTotal
		items = append(items, models.SaleItem{
			ProductID:   it.ProductID,
			SKU:         &sku,
			ProductName: &prodName,
			Quantity:    it.Quantity,
			UnitPrice:   unitPrice,
			LineTotal:   lineTotal,
		})
	}

	// Insert the sale header.
	var sale models.Sale
	err = tx.QueryRow(ctx,
		`INSERT INTO sales (sale_id, sale_number, customer_id, location_id, subtotal, discount, total, payment_method, status, created_by)
		 VALUES ($1,$2,$3,$4,$5,0,$6,$7,'completed',$8)
		 RETURNING sale_id, sale_number, customer_id, location_id, subtotal, discount, total, payment_method, status, created_by, created_at`,
		nextID, saleNumber, req.CustomerID, req.LocationID, round2(subtotal), round2(subtotal), req.PaymentMethod, createdBy).Scan(
		&sale.SaleID, &sale.SaleNumber, &sale.CustomerID, &sale.LocationID, &sale.Subtotal, &sale.Discount,
		&sale.Total, &sale.PaymentMethod, &sale.Status, &sale.CreatedBy, &sale.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("sale insert: %w", err)
	}
	sale.CustomerName = customerName

	// Insert line items and a SALE inventory movement each (decrements stock via trigger).
	for i := range items {
		it := items[i]
		var itemID int
		if err := tx.QueryRow(ctx,
			`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total)
			 VALUES ($1,$2,$3,$4,$5) RETURNING sale_item_id`,
			sale.SaleID, it.ProductID, it.Quantity, it.UnitPrice, it.LineTotal).Scan(&itemID); err != nil {
			return nil, fmt.Errorf("sale item insert: %w", err)
		}
		items[i].SaleItemID = itemID
		items[i].SaleID = sale.SaleID

		if _, err := tx.Exec(ctx,
			`INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			it.ProductID, req.LocationID, saleMoveTypeID, it.Quantity, it.UnitPrice, saleNumber, "Sale "+saleNumber, createdBy); err != nil {
			return nil, fmt.Errorf("sale movement insert: %w", err)
		}
	}
	sale.Items = items

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("sale create commit: %w", err)
	}
	return &sale, nil
}

// CreateReturn records a return for a sale line: restocks inventory (positive
// movement) and marks the line/sale as returned.
func (r *saleRepo) CreateReturn(ctx context.Context, saleID int, req models.CreateReturnRequest, createdBy string) (*models.Return, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("return begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var saleNumber string
	var locationID int
	var custIDNullable *int
	if err := tx.QueryRow(ctx, "SELECT sale_number, location_id, customer_id FROM sales WHERE sale_id=$1", saleID).Scan(
		&saleNumber, &locationID, &custIDNullable); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("return sale lookup: %w", err)
	}

	var itemSaleID, productID, quantity, returnedQty int
	var unitPrice float64
	err = tx.QueryRow(ctx,
		"SELECT sale_id, product_id, quantity, unit_price, returned_qty FROM sale_items WHERE sale_item_id=$1", req.SaleItemID).
		Scan(&itemSaleID, &productID, &quantity, &unitPrice, &returnedQty)
	if err != nil {
		return nil, fmt.Errorf("return sale item lookup: %w", err)
	}
	if itemSaleID != saleID {
		return nil, errors.New("sale item does not belong to this sale")
	}
	remaining := quantity - returnedQty
	if req.Quantity > remaining {
		return nil, fmt.Errorf("cannot return more than %d remaining unit(s)", remaining)
	}

	refundAmount := round2(unitPrice * float64(req.Quantity))

	var ret models.Return
	err = tx.QueryRow(ctx,
		`INSERT INTO returns (sale_id, sale_item_id, product_id, customer_id, quantity, refund_amount, reason, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 RETURNING return_id, sale_id, sale_item_id, product_id, customer_id, quantity, refund_amount, reason, created_by, created_at`,
		saleID, req.SaleItemID, productID, custIDNullable, req.Quantity, refundAmount, req.Reason, createdBy).Scan(
		&ret.ReturnID, &ret.SaleID, &ret.SaleItemID, &ret.ProductID, &ret.CustomerID,
		&ret.Quantity, &ret.RefundAmount, &ret.Reason, &ret.CreatedBy, &ret.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("return insert: %w", err)
	}

	if _, err := tx.Exec(ctx, "UPDATE sale_items SET returned_qty = returned_qty + $1 WHERE sale_item_id=$2",
		req.Quantity, req.SaleItemID); err != nil {
		return nil, fmt.Errorf("return update sale item: %w", err)
	}

	// Restock via a positive RETURN movement (the stock trigger adds it back).
	var returnMoveTypeID int
	if err := tx.QueryRow(ctx, "SELECT movement_type_id FROM movement_types WHERE code='RETURN'").Scan(&returnMoveTypeID); err != nil {
		return nil, fmt.Errorf("return movement type lookup: %w", err)
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		productID, locationID, returnMoveTypeID, req.Quantity, unitPrice, saleNumber, "Return on "+saleNumber, createdBy); err != nil {
		return nil, fmt.Errorf("return movement insert: %w", err)
	}

	// Update the sale status based on whether every line is fully returned.
	var totalQty, totalReturned int
	if err := tx.QueryRow(ctx, "SELECT COALESCE(SUM(quantity),0), COALESCE(SUM(returned_qty),0) FROM sale_items WHERE sale_id=$1", saleID).
		Scan(&totalQty, &totalReturned); err != nil {
		return nil, fmt.Errorf("return sale status: %w", err)
	}
	status := "partially_refunded"
	if totalReturned >= totalQty {
		status = "refunded"
	}
	if _, err := tx.Exec(ctx, "UPDATE sales SET status=$1 WHERE sale_id=$2", status, saleID); err != nil {
		return nil, fmt.Errorf("return update sale status: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("return commit: %w", err)
	}
	return &ret, nil
}

// loadItems returns the line items for a sale, joined with product SKU/name.
func (r *saleRepo) loadItems(ctx context.Context, saleID int) ([]models.SaleItem, error) {
	rows, err := r.db.Query(ctx,
		`SELECT si.sale_item_id, si.sale_id, si.product_id, p.sku, p.name,
		        si.quantity, si.unit_price, si.line_total, si.returned_qty
		 FROM sale_items si
		 JOIN products p ON p.product_id = si.product_id
		 WHERE si.sale_id = $1
		 ORDER BY si.sale_item_id ASC`, saleID)
	if err != nil {
		return nil, fmt.Errorf("sale items query: %w", err)
	}
	defer rows.Close()

	items := []models.SaleItem{}
	for rows.Next() {
		var it models.SaleItem
		if err := rows.Scan(&it.SaleItemID, &it.SaleID, &it.ProductID, &it.SKU, &it.ProductName,
			&it.Quantity, &it.UnitPrice, &it.LineTotal, &it.ReturnedQty); err != nil {
			return nil, fmt.Errorf("sale items scan: %w", err)
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sale items rows: %w", err)
	}
	return items, nil
}