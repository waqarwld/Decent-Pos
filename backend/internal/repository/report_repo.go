package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"inventory-api/internal/models"
)

// ReportRepository defines the data-access interface for reporting queries.
type ReportRepository interface {
	CurrentStock(ctx context.Context, f models.StockFilter) ([]models.StockLevel, int, error)
	LowStockAlerts(ctx context.Context) ([]models.LowStockAlert, error)
	ProductSummary(ctx context.Context, page, pageSize int) ([]models.ProductStockSummary, int, error)
	InventoryAging(ctx context.Context) ([]models.AgingRecord, error)
	SupplierPerformance(ctx context.Context) ([]models.SupplierPerformance, error)
	RecentMovements(ctx context.Context, page, pageSize int) ([]models.Movement, int, error)
	Valuation(ctx context.Context, method string, productID, locationID *int) ([]models.ValuationRecord, error)
	Turnover(ctx context.Context, startDate, endDate string, productID, locationID *int) ([]models.ValuationRecord, error)
}

type reportRepo struct {
	db *pgxpool.Pool
}

// NewReportRepository returns a ReportRepository backed by the given pool.
func NewReportRepository(db *pgxpool.Pool) ReportRepository {
	return &reportRepo{db: db}
}

// CurrentStock queries v_current_stock_levels with optional filters and pagination.
func (r *reportRepo) CurrentStock(ctx context.Context, f models.StockFilter) ([]models.StockLevel, int, error) {
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

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM v_current_stock_levels"+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("current stock count: %w", err)
	}

	offset := (f.Page - 1) * f.PageSize
	query := fmt.Sprintf(`SELECT product_id, sku, product_name, category_name, location_id,
	                             location_code, location_name, quantity_on_hand, quantity_reserved,
	                             quantity_available, last_movement_at, inventory_value_cost
	                      FROM v_current_stock_levels%s
	                      ORDER BY product_id ASC
	                      LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)
	args = append(args, f.PageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("current stock query: %w", err)
	}
	defer rows.Close()

	levels := []models.StockLevel{}
	for rows.Next() {
		var s models.StockLevel
		if err := rows.Scan(
			&s.ProductID, &s.SKU, &s.ProductName, &s.CategoryName, &s.LocationID,
			&s.LocationCode, &s.LocationName, &s.QuantityOnHand, &s.QuantityReserved,
			&s.QuantityAvailable, &s.LastMovementAt, &s.InventoryValueCost,
		); err != nil {
			return nil, 0, fmt.Errorf("current stock scan: %w", err)
		}
		levels = append(levels, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("current stock rows: %w", err)
	}

	return levels, total, nil
}

// LowStockAlerts queries v_low_stock_alerts and returns all alerts.
func (r *reportRepo) LowStockAlerts(ctx context.Context) ([]models.LowStockAlert, error) {
	query := `SELECT product_id, sku, product_name, location_code, quantity_available,
	                 reorder_point, units_below_reorder, stock_status,
	                 preferred_supplier_name, lead_time_days
	          FROM v_low_stock_alerts
	          ORDER BY product_id ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("low stock alerts query: %w", err)
	}
	defer rows.Close()

	alerts := []models.LowStockAlert{}
	for rows.Next() {
		var a models.LowStockAlert
		if err := rows.Scan(
			&a.ProductID, &a.SKU, &a.ProductName, &a.LocationCode, &a.QuantityAvailable,
			&a.ReorderPoint, &a.UnitsBelowReorder, &a.StockStatus,
			&a.PreferredSupplier, &a.LeadTimeDays,
		); err != nil {
			return nil, fmt.Errorf("low stock alerts scan: %w", err)
		}
		alerts = append(alerts, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("low stock alerts rows: %w", err)
	}

	return alerts, nil
}

// ProductSummary queries v_product_stock_summary with pagination.
func (r *reportRepo) ProductSummary(ctx context.Context, page, pageSize int) ([]models.ProductStockSummary, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM v_product_stock_summary").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("product summary count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT product_id, sku, product_name, category_name, location_count,
	                 total_quantity_on_hand, total_quantity_available, total_inventory_value_cost
	          FROM v_product_stock_summary
	          ORDER BY product_id ASC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("product summary query: %w", err)
	}
	defer rows.Close()

	summaries := []models.ProductStockSummary{}
	for rows.Next() {
		var s models.ProductStockSummary
		if err := rows.Scan(
			&s.ProductID, &s.SKU, &s.ProductName, &s.CategoryName, &s.LocationCount,
			&s.TotalQuantityOnHand, &s.TotalQuantityAvailable, &s.TotalInventoryValueCost,
		); err != nil {
			return nil, 0, fmt.Errorf("product summary scan: %w", err)
		}
		summaries = append(summaries, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("product summary rows: %w", err)
	}

	return summaries, total, nil
}

// InventoryAging queries v_inventory_aging and returns all aging records.
func (r *reportRepo) InventoryAging(ctx context.Context) ([]models.AgingRecord, error) {
	query := `SELECT product_id, sku, product_name, location_code, quantity_on_hand,
	                 days_in_stock, aging_bucket, inventory_value
	          FROM v_inventory_aging
	          ORDER BY product_id ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("inventory aging query: %w", err)
	}
	defer rows.Close()

	records := []models.AgingRecord{}
	for rows.Next() {
		var a models.AgingRecord
		if err := rows.Scan(
			&a.ProductID, &a.SKU, &a.ProductName, &a.LocationCode, &a.QuantityOnHand,
			&a.DaysInStock, &a.AgingBucket, &a.InventoryValue,
		); err != nil {
			return nil, fmt.Errorf("inventory aging scan: %w", err)
		}
		records = append(records, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("inventory aging rows: %w", err)
	}

	return records, nil
}

// SupplierPerformance queries supplier performance from product_suppliers joined with suppliers.
func (r *reportRepo) SupplierPerformance(ctx context.Context) ([]models.SupplierPerformance, error) {
	query := `SELECT s.supplier_id, s.name,
	                 COUNT(ps.product_id) AS products_supplied,
	                 AVG(ps.average_delivery_days),
	                 AVG(ps.on_time_delivery_rate),
	                 AVG(ps.quality_rating)
	          FROM suppliers s
	          LEFT JOIN product_suppliers ps ON s.supplier_id = ps.supplier_id AND ps.is_active = true
	          GROUP BY s.supplier_id, s.name
	          ORDER BY s.supplier_id`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("supplier performance query: %w", err)
	}
	defer rows.Close()

	results := []models.SupplierPerformance{}
	for rows.Next() {
		var sp models.SupplierPerformance
		if err := rows.Scan(
			&sp.SupplierID, &sp.SupplierName, &sp.ProductsSupplied,
			&sp.AvgDeliveryDays, &sp.OnTimeRate, &sp.AvgQuality,
		); err != nil {
			return nil, fmt.Errorf("supplier performance scan: %w", err)
		}
		results = append(results, sp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("supplier performance rows: %w", err)
	}

	return results, nil
}

// RecentMovements queries inventory_movements ordered by created_at DESC with pagination.
func (r *reportRepo) RecentMovements(ctx context.Context, page, pageSize int) ([]models.Movement, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM inventory_movements").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("recent movements count: %w", err)
	}

	offset := (page - 1) * pageSize
	query := `SELECT movement_id, product_id, location_id, movement_type_id,
	                 quantity, unit_cost, reference_document, notes, created_by, created_at
	          FROM inventory_movements
	          ORDER BY created_at DESC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("recent movements query: %w", err)
	}
	defer rows.Close()

	movements := []models.Movement{}
	for rows.Next() {
		var m models.Movement
		if err := rows.Scan(
			&m.MovementID, &m.ProductID, &m.LocationID, &m.MovementTypeID,
			&m.Quantity, &m.UnitCost, &m.ReferenceDocument, &m.Notes, &m.CreatedBy, &m.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("recent movements scan: %w", err)
		}
		movements = append(movements, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("recent movements rows: %w", err)
	}

	return movements, total, nil
}

// Valuation calls the appropriate DB valuation function based on method.
// Supported methods: "fifo", "avg", "standard". Defaults to "avg" if empty.
func (r *reportRepo) Valuation(ctx context.Context, method string, productID, locationID *int) ([]models.ValuationRecord, error) {
	if method == "" {
		method = "avg"
	}

	var query string
	switch method {
	case "fifo":
		query = `SELECT product_id, location_id, quantity_on_hand, fifo_value AS value, average_unit_cost
		         FROM calculate_inventory_valuation_fifo($1, $2)`
	case "standard":
		query = `SELECT product_id, location_id, quantity_on_hand, standard_value AS value, standard_unit_cost AS average_unit_cost
		         FROM calculate_inventory_valuation_standard($1, $2)`
	default: // "avg"
		query = `SELECT product_id, location_id, quantity_on_hand, avg_value AS value, average_unit_cost
		         FROM calculate_inventory_valuation_avg($1, $2)`
	}

	rows, err := r.db.Query(ctx, query, productID, locationID)
	if err != nil {
		return nil, fmt.Errorf("valuation query (%s): %w", method, err)
	}
	defer rows.Close()

	records := []models.ValuationRecord{}
	for rows.Next() {
		var v models.ValuationRecord
		if err := rows.Scan(&v.ProductID, &v.LocationID, &v.QuantityOnHand, &v.Value, &v.AverageUnitCost); err != nil {
			return nil, fmt.Errorf("valuation scan: %w", err)
		}
		records = append(records, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("valuation rows: %w", err)
	}

	return records, nil
}

// Turnover calls calculate_inventory_turnover with the given date range and optional filters.
func (r *reportRepo) Turnover(ctx context.Context, startDate, endDate string, productID, locationID *int) ([]models.ValuationRecord, error) {
	query := `SELECT product_id, location_id, total_sales_quantity AS quantity_on_hand,
	                 turnover_ratio AS value, days_of_supply AS average_unit_cost
	          FROM calculate_inventory_turnover($1, $2, $3, $4)`

	rows, err := r.db.Query(ctx, query, startDate, endDate, productID, locationID)
	if err != nil {
		return nil, fmt.Errorf("turnover query: %w", err)
	}
	defer rows.Close()

	records := []models.ValuationRecord{}
	for rows.Next() {
		var v models.ValuationRecord
		if err := rows.Scan(&v.ProductID, &v.LocationID, &v.QuantityOnHand, &v.Value, &v.AverageUnitCost); err != nil {
			return nil, fmt.Errorf("turnover scan: %w", err)
		}
		records = append(records, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("turnover rows: %w", err)
	}

	return records, nil
}
