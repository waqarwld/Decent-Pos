# Inventory Reporting Views and Functions Documentation

## Overview

This document describes the reporting views and functions implemented for the inventory management system. These components support business intelligence and decision-making by providing comprehensive reporting capabilities for stock levels, valuation, aging, alerts, and turnover analysis.

## Requirements Satisfied

- **Requirement 5.1**: Support queries for current stock levels across all locations
- **Requirement 5.2**: Enable inventory valuation calculations using different costing methods
- **Requirement 5.3**: Provide inventory aging reports showing how long items have been in stock
- **Requirement 5.4**: Support low stock alerts based on reorder points
- **Requirement 5.5**: Enable inventory turnover analysis and reporting

## Installation

To install the reporting views and functions:

```bash
psql -d inventory_management -f inventory_reporting.sql
```

Or from within psql:

```sql
\i inventory_reporting.sql
```

## Testing

Run the comprehensive test suite:

```bash
psql -d inventory_management -f test_inventory_reporting.sql
```

---

## Current Stock Level Views (Requirement 5.1)

### v_current_stock_levels

**Purpose**: Provides detailed current stock levels across all locations with product and location details.

**Columns**:
- `product_id`, `sku`, `product_name`, `product_description`
- `category_name`
- `location_id`, `location_code`, `location_name`, `location_type`
- `quantity_on_hand`, `quantity_reserved`, `quantity_available`
- `last_counted_at`, `last_movement_at`
- `unit_of_measure`, `cost_price`, `selling_price`
- `inventory_value_cost`, `inventory_value_selling`

**Usage Example**:
```sql
-- Get all current stock levels
SELECT * FROM v_current_stock_levels;

-- Get stock levels for a specific product
SELECT * FROM v_current_stock_levels 
WHERE sku = 'LAPTOP001';

-- Get stock levels at a specific location
SELECT * FROM v_current_stock_levels 
WHERE location_code = 'WH001';

-- Find products with low available quantity
SELECT * FROM v_current_stock_levels 
WHERE quantity_available < 10
ORDER BY quantity_available ASC;
```

### v_product_stock_summary

**Purpose**: Aggregated stock levels by product across all locations.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `unit_of_measure`
- `location_count` - Number of locations holding this product
- `total_quantity_on_hand`, `total_quantity_reserved`, `total_quantity_available`
- `cost_price`, `selling_price`
- `total_inventory_value_cost`, `total_inventory_value_selling`
- `last_movement_at`

**Usage Example**:
```sql
-- Get total stock across all locations for each product
SELECT * FROM v_product_stock_summary
ORDER BY total_inventory_value_cost DESC;

-- Find products with highest inventory value
SELECT product_name, total_quantity_on_hand, total_inventory_value_cost
FROM v_product_stock_summary
WHERE total_quantity_on_hand > 0
ORDER BY total_inventory_value_cost DESC
LIMIT 10;

-- Get products in multiple locations
SELECT product_name, location_count, total_quantity_available
FROM v_product_stock_summary
WHERE location_count > 1;
```

### v_location_stock_summary

**Purpose**: Stock summary by location with aggregated inventory values.

**Columns**:
- `location_id`, `location_code`, `location_name`, `location_type`
- `product_count` - Number of different products at this location
- `total_units_on_hand`, `total_units_reserved`, `total_units_available`
- `total_inventory_value_cost`, `total_inventory_value_selling`

**Usage Example**:
```sql
-- Get inventory summary for all locations
SELECT * FROM v_location_stock_summary
ORDER BY total_inventory_value_cost DESC;

-- Compare warehouse inventory values
SELECT location_name, product_count, total_inventory_value_cost
FROM v_location_stock_summary
WHERE location_type = 'warehouse';
```

---

## Inventory Valuation Functions (Requirement 5.2)

### calculate_inventory_valuation_fifo()

**Purpose**: Calculate inventory valuation using FIFO (First In, First Out) costing method.

**Parameters**:
- `p_product_id` (INTEGER, optional) - Filter by specific product
- `p_location_id` (INTEGER, optional) - Filter by specific location

**Returns**:
- `product_id`, `location_id`
- `quantity_on_hand`
- `fifo_value` - Total inventory value using FIFO
- `average_unit_cost` - Average cost per unit using FIFO

**Usage Example**:
```sql
-- Get FIFO valuation for all products
SELECT * FROM calculate_inventory_valuation_fifo()
ORDER BY fifo_value DESC;

-- Get FIFO valuation for specific product
SELECT * FROM calculate_inventory_valuation_fifo(1, NULL);

-- Get FIFO valuation for specific location
SELECT * FROM calculate_inventory_valuation_fifo(NULL, 1);

-- Compare FIFO value to standard cost
SELECT 
    f.product_id,
    f.quantity_on_hand,
    f.fifo_value,
    f.average_unit_cost AS fifo_unit_cost,
    p.cost_price AS standard_unit_cost,
    (f.fifo_value - (f.quantity_on_hand * p.cost_price)) AS variance
FROM calculate_inventory_valuation_fifo() f
JOIN products p ON f.product_id = p.product_id;
```

### calculate_inventory_valuation_avg()

**Purpose**: Calculate inventory valuation using weighted average cost method.

**Parameters**:
- `p_product_id` (INTEGER, optional) - Filter by specific product
- `p_location_id` (INTEGER, optional) - Filter by specific location

**Returns**:
- `product_id`, `location_id`
- `quantity_on_hand`
- `avg_value` - Total inventory value using weighted average
- `average_unit_cost` - Weighted average cost per unit

**Usage Example**:
```sql
-- Get weighted average valuation for all products
SELECT * FROM calculate_inventory_valuation_avg()
ORDER BY avg_value DESC;

-- Get total inventory value using weighted average
SELECT SUM(avg_value) AS total_inventory_value
FROM calculate_inventory_valuation_avg();
```

### calculate_inventory_valuation_standard()

**Purpose**: Calculate inventory valuation using standard cost from products table.

**Parameters**:
- `p_product_id` (INTEGER, optional) - Filter by specific product
- `p_location_id` (INTEGER, optional) - Filter by specific location

**Returns**:
- `product_id`, `location_id`
- `quantity_on_hand`
- `standard_value` - Total inventory value using standard cost
- `standard_unit_cost` - Standard cost per unit from products table

**Usage Example**:
```sql
-- Get standard cost valuation for all products
SELECT * FROM calculate_inventory_valuation_standard()
ORDER BY standard_value DESC;

-- Compare all three valuation methods
SELECT 
    'FIFO' AS method,
    SUM(fifo_value) AS total_value
FROM calculate_inventory_valuation_fifo()
UNION ALL
SELECT 
    'Weighted Average' AS method,
    SUM(avg_value) AS total_value
FROM calculate_inventory_valuation_avg()
UNION ALL
SELECT 
    'Standard Cost' AS method,
    SUM(standard_value) AS total_value
FROM calculate_inventory_valuation_standard();
```

---

## Inventory Aging Views (Requirement 5.3)

### v_inventory_aging

**Purpose**: Inventory aging analysis showing how long items have been in stock with aging buckets.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`, `location_name`
- `quantity_on_hand`, `quantity_available`
- `last_receipt_date` - Date of last receipt
- `days_in_stock` - Number of days since last receipt
- `aging_bucket` - Age category (0-30 days, 31-60 days, etc.)
- `cost_price`, `inventory_value`
- `last_movement_at`

**Aging Buckets**:
- 0-30 days
- 31-60 days
- 61-90 days
- 91-180 days
- 181-365 days
- Over 1 year

**Usage Example**:
```sql
-- Get all aging inventory
SELECT * FROM v_inventory_aging
ORDER BY days_in_stock DESC;

-- Find old inventory (over 180 days)
SELECT product_name, location_code, days_in_stock, inventory_value
FROM v_inventory_aging
WHERE days_in_stock > 180
ORDER BY inventory_value DESC;

-- Get aging inventory by category
SELECT 
    category_name,
    aging_bucket,
    COUNT(*) AS item_count,
    SUM(inventory_value) AS total_value
FROM v_inventory_aging
GROUP BY category_name, aging_bucket
ORDER BY category_name, aging_bucket;
```

### v_inventory_aging_summary

**Purpose**: Summary of inventory aging by aging bucket.

**Columns**:
- `aging_bucket`
- `item_count` - Number of items in this bucket
- `total_quantity` - Total quantity in this bucket
- `total_value` - Total inventory value in this bucket
- `avg_days_in_stock` - Average days in stock for this bucket

**Usage Example**:
```sql
-- Get aging summary
SELECT * FROM v_inventory_aging_summary;

-- Calculate percentage of inventory in each bucket
SELECT 
    aging_bucket,
    item_count,
    total_value,
    ROUND(100.0 * total_value / SUM(total_value) OVER (), 2) AS percent_of_total
FROM v_inventory_aging_summary;
```

---

## Low Stock Alert Views (Requirement 5.4)

### v_low_stock_alerts

**Purpose**: Low stock alerts based on reorder points with alert levels and supplier information.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`, `location_name`
- `quantity_on_hand`, `quantity_reserved`, `quantity_available`
- `reorder_point`, `reorder_quantity`, `maximum_stock`
- `units_below_reorder` - How many units below reorder point
- `alert_level` - OUT_OF_STOCK, CRITICAL, LOW, NORMAL
- `supplier_id`, `preferred_supplier_name`
- `lead_time_days`, `minimum_order_qty`
- `last_movement_at`

**Alert Levels**:
- **OUT_OF_STOCK**: quantity_available <= 0
- **CRITICAL**: quantity_available <= (reorder_point * 0.5)
- **LOW**: quantity_available <= reorder_point
- **NORMAL**: quantity_available > reorder_point

**Usage Example**:
```sql
-- Get all low stock alerts
SELECT * FROM v_low_stock_alerts
ORDER BY alert_level, quantity_available;

-- Get critical and out of stock items
SELECT product_name, location_code, quantity_available, alert_level, preferred_supplier_name
FROM v_low_stock_alerts
WHERE alert_level IN ('OUT_OF_STOCK', 'CRITICAL');

-- Generate purchase orders for low stock items
SELECT 
    product_name,
    preferred_supplier_name,
    reorder_quantity,
    lead_time_days,
    'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || product_id AS suggested_po_number
FROM v_low_stock_alerts
WHERE alert_level IN ('OUT_OF_STOCK', 'CRITICAL', 'LOW')
ORDER BY alert_level;
```

### v_approaching_reorder

**Purpose**: Products approaching reorder point (within 20% buffer).

**Columns**:
- `product_id`, `sku`, `product_name`
- `location_id`, `location_code`, `location_name`
- `quantity_available`, `reorder_point`, `reorder_quantity`
- `percent_above_reorder` - Percentage above reorder point
- `lead_time_days`, `preferred_supplier_name`

**Usage Example**:
```sql
-- Get products approaching reorder point
SELECT * FROM v_approaching_reorder
ORDER BY percent_above_reorder;

-- Plan upcoming orders
SELECT 
    product_name,
    location_code,
    quantity_available,
    reorder_point,
    ROUND(percent_above_reorder, 1) AS percent_buffer,
    lead_time_days,
    preferred_supplier_name
FROM v_approaching_reorder
WHERE lead_time_days > 7  -- Focus on items with longer lead times
ORDER BY percent_above_reorder;
```

---

## Inventory Turnover Analysis (Requirement 5.5)

### calculate_inventory_turnover()

**Purpose**: Calculate inventory turnover ratio and days of supply for a specific period.

**Parameters**:
- `p_start_date` (DATE, required) - Start date of analysis period
- `p_end_date` (DATE, required) - End date of analysis period
- `p_product_id` (INTEGER, optional) - Filter by specific product
- `p_location_id` (INTEGER, optional) - Filter by specific location

**Returns**:
- `product_id`, `product_sku`, `product_name`
- `location_id`, `location_code`
- `total_sales_quantity` - Total units sold in period
- `average_inventory` - Average inventory level during period
- `turnover_ratio` - Sales / Average Inventory
- `days_in_period` - Number of days in analysis period
- `days_of_supply` - How many days current inventory will last

**Usage Example**:
```sql
-- Get turnover for last 90 days
SELECT * FROM calculate_inventory_turnover(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE,
    NULL,
    NULL
)
ORDER BY turnover_ratio DESC;

-- Get turnover for specific product
SELECT * FROM calculate_inventory_turnover(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE,
    1,  -- product_id
    NULL
);

-- Compare quarterly turnover
SELECT 
    'Q1' AS quarter,
    AVG(turnover_ratio) AS avg_turnover
FROM calculate_inventory_turnover('2024-01-01', '2024-03-31', NULL, NULL)
UNION ALL
SELECT 
    'Q2' AS quarter,
    AVG(turnover_ratio) AS avg_turnover
FROM calculate_inventory_turnover('2024-04-01', '2024-06-30', NULL, NULL);
```

### v_inventory_turnover_90days

**Purpose**: Inventory turnover analysis for the last 90 days.

**Columns**: Same as `calculate_inventory_turnover()` function

**Usage Example**:
```sql
-- Get recent turnover data
SELECT * FROM v_inventory_turnover_90days
WHERE total_sales_quantity > 0
ORDER BY turnover_ratio DESC;

-- Get average turnover by category
SELECT 
    c.name AS category_name,
    COUNT(*) AS product_count,
    ROUND(AVG(t.turnover_ratio), 2) AS avg_turnover,
    ROUND(AVG(t.days_of_supply), 1) AS avg_days_supply
FROM v_inventory_turnover_90days t
JOIN products p ON t.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE t.total_sales_quantity > 0
GROUP BY c.name
ORDER BY avg_turnover DESC;
```

### v_slow_moving_inventory

**Purpose**: Slow-moving inventory with low turnover ratio (< 1.0 in last 90 days).

**Columns**: Subset of turnover columns for slow-moving items

**Usage Example**:
```sql
-- Get all slow-moving inventory
SELECT * FROM v_slow_moving_inventory
ORDER BY average_inventory DESC;

-- Calculate value tied up in slow-moving inventory
SELECT 
    COUNT(*) AS slow_moving_items,
    SUM(s.average_inventory) AS total_slow_units,
    SUM(s.average_inventory * p.cost_price) AS total_value_tied_up
FROM v_slow_moving_inventory s
JOIN products p ON s.product_id = p.product_id;

-- Identify candidates for clearance or promotion
SELECT 
    product_name,
    location_code,
    ROUND(average_inventory, 0) AS avg_stock,
    ROUND(turnover_ratio, 2) AS turnover,
    ROUND(days_of_supply, 0) AS days_supply
FROM v_slow_moving_inventory
WHERE average_inventory > 50  -- Significant inventory
ORDER BY days_of_supply DESC;
```

### v_fast_moving_inventory

**Purpose**: Fast-moving inventory with high turnover ratio (>= 4.0 in last 90 days).

**Columns**: Subset of turnover columns for fast-moving items

**Usage Example**:
```sql
-- Get all fast-moving inventory
SELECT * FROM v_fast_moving_inventory
ORDER BY turnover_ratio DESC;

-- Identify items that may need increased stock levels
SELECT 
    product_name,
    location_code,
    total_sales_quantity,
    ROUND(average_inventory, 0) AS avg_stock,
    ROUND(turnover_ratio, 1) AS turnover,
    ROUND(days_of_supply, 1) AS days_supply
FROM v_fast_moving_inventory
WHERE days_of_supply < 30  -- Less than 30 days supply
ORDER BY days_of_supply;
```

---

## Comprehensive Dashboard View

### v_inventory_health_dashboard

**Purpose**: Comprehensive inventory health dashboard combining stock status, aging, and valuation.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`
- `quantity_on_hand`, `quantity_available`
- `reorder_point`
- `stock_status` - OUT_OF_STOCK, LOW_STOCK, NORMAL, OVERSTOCK
- `days_in_stock`, `aging_bucket`
- `inventory_value`
- `last_movement_at`

**Stock Status Levels**:
- **OUT_OF_STOCK**: quantity_available <= 0
- **LOW_STOCK**: quantity_available <= reorder_point
- **OVERSTOCK**: quantity_available > maximum_stock (or reorder_point * 3)
- **NORMAL**: All other cases

**Usage Example**:
```sql
-- Get complete inventory health overview
SELECT * FROM v_inventory_health_dashboard
ORDER BY stock_status, inventory_value DESC;

-- Get summary by stock status
SELECT 
    stock_status,
    COUNT(*) AS item_count,
    SUM(inventory_value) AS total_value
FROM v_inventory_health_dashboard
GROUP BY stock_status;

-- Identify problem inventory (out of stock or overstock)
SELECT 
    product_name,
    location_code,
    quantity_available,
    stock_status,
    aging_bucket,
    inventory_value
FROM v_inventory_health_dashboard
WHERE stock_status IN ('OUT_OF_STOCK', 'OVERSTOCK')
ORDER BY stock_status, inventory_value DESC;
```

---

## Utility Functions

### get_product_movement_history()

**Purpose**: Get inventory movement history for a specific product with optional filters.

**Parameters**:
- `p_product_id` (INTEGER, required) - Product to get history for
- `p_location_id` (INTEGER, optional) - Filter by location
- `p_start_date` (DATE, optional) - Filter by start date
- `p_end_date` (DATE, optional) - Filter by end date
- `p_limit` (INTEGER, optional, default 100) - Maximum records to return

**Returns**:
- `movement_id`, `movement_date`, `movement_type`
- `location_code`, `location_name`
- `quantity`, `affects_quantity`
- `unit_cost`, `reference_document`, `notes`, `created_by`

**Usage Example**:
```sql
-- Get recent movement history for a product
SELECT * FROM get_product_movement_history(1, NULL, NULL, NULL, 50);

-- Get movements at specific location
SELECT * FROM get_product_movement_history(1, 1, NULL, NULL, 100);

-- Get movements for date range
SELECT * FROM get_product_movement_history(
    1,
    NULL,
    '2024-01-01',
    '2024-03-31',
    1000
);

-- Analyze movement patterns
SELECT 
    movement_type,
    COUNT(*) AS movement_count,
    SUM(quantity * affects_quantity) AS net_quantity_change
FROM get_product_movement_history(1, NULL, NULL, NULL, 1000)
GROUP BY movement_type
ORDER BY movement_count DESC;
```

---

## Performance Considerations

### Indexes

The following indexes are created to optimize reporting queries:

```sql
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_product_type_date ON inventory_movements(product_id, movement_type_id, created_at);
CREATE INDEX idx_stock_levels_quantity_available ON stock_levels(quantity_available) WHERE quantity_available > 0;
CREATE INDEX idx_reorder_settings_active_product ON reorder_settings(product_id, is_active) WHERE is_active = true;
```

### Query Optimization Tips

1. **Use specific filters**: When querying views, add WHERE clauses to filter by product, location, or date range
2. **Limit result sets**: Use LIMIT for large result sets, especially for movement history
3. **Materialize frequently-used queries**: Consider creating materialized views for complex queries that are run frequently
4. **Partition large tables**: For high-volume systems, consider partitioning inventory_movements by date

### Example Materialized View

```sql
-- Create materialized view for daily stock summary (refresh nightly)
CREATE MATERIALIZED VIEW mv_daily_stock_summary AS
SELECT * FROM v_product_stock_summary;

CREATE INDEX idx_mv_daily_stock_product ON mv_daily_stock_summary(product_id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW mv_daily_stock_summary;
```

---

## Business Intelligence Integration

These views and functions can be easily integrated with BI tools:

### Power BI / Tableau
- Connect directly to PostgreSQL database
- Use views as data sources for dashboards
- Create calculated fields using the valuation functions

### Excel / Google Sheets
- Use ODBC connection to PostgreSQL
- Import views as data tables
- Refresh data on demand

### Custom Reports
- Call functions with parameters for dynamic reporting
- Export results to CSV/JSON for further processing
- Schedule automated reports using cron jobs

---

## Maintenance

### Regular Tasks

1. **Analyze query performance**: Monitor slow queries and optimize indexes
2. **Archive old movements**: Consider archiving inventory_movements older than 2-3 years
3. **Update statistics**: Run ANALYZE on tables regularly for optimal query plans
4. **Review aging inventory**: Weekly review of v_inventory_aging for action items
5. **Monitor alerts**: Daily check of v_low_stock_alerts for reorder needs

### Troubleshooting

**Slow turnover calculations**:
- Ensure indexes on inventory_movements are present
- Consider reducing date range for analysis
- Use materialized views for frequently-accessed periods

**Incorrect valuations**:
- Verify unit_cost is populated on receipt movements
- Check for negative quantities in stock_levels
- Validate movement_types affects_quantity values

**Missing data in views**:
- Verify products have status = 'active'
- Check locations have is_active = true
- Ensure reorder_settings exist for alert views

---

## Support

For questions or issues with the reporting system:
1. Review this documentation
2. Check the test script (test_inventory_reporting.sql) for usage examples
3. Verify data integrity using validate_schema.sql
4. Review query execution plans for performance issues
