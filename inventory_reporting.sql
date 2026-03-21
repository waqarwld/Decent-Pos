-- Inventory Reporting Views and Functions
-- PostgreSQL implementation for business intelligence and reporting

-- =============================================================================
-- CURRENT STOCK LEVEL VIEWS
-- =============================================================================

-- View: Current stock levels across all locations
CREATE OR REPLACE VIEW v_current_stock_levels AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    l.location_id,
    l.code AS location_code,
    l.name AS location_name,
    l.location_type,
    sl.quantity_on_hand,
    sl.quantity_reserved,
    sl.quantity_available,
    sl.last_counted_at,
    sl.last_movement_at,
    p.cost_price,
    p.selling_price,
    (sl.quantity_on_hand * p.cost_price) AS inventory_value_cost,
    (sl.quantity_on_hand * p.selling_price) AS inventory_value_selling
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
INNER JOIN locations l ON sl.location_id = l.location_id
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.status = 'active' AND l.is_active = true;

COMMENT ON VIEW v_current_stock_levels IS 'Current stock levels with product and location details, including inventory valuation';

-- View: Aggregated stock levels by product (all locations combined)
CREATE OR REPLACE VIEW v_product_stock_summary AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    p.unit_of_measure,
    p.cost_price,
    p.selling_price,
    p.status,
    COALESCE(SUM(sl.quantity_on_hand), 0) AS total_quantity_on_hand,
    COALESCE(SUM(sl.quantity_reserved), 0) AS total_quantity_reserved,
    COALESCE(SUM(sl.quantity_available), 0) AS total_quantity_available,
    COUNT(DISTINCT sl.location_id) AS locations_count,
    COALESCE(SUM(sl.quantity_on_hand * p.cost_price), 0) AS total_inventory_value_cost,
    COALESCE(SUM(sl.quantity_on_hand * p.selling_price), 0) AS total_inventory_value_selling
FROM products p
LEFT JOIN stock_levels sl ON p.product_id = sl.product_id
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.status = 'active'
GROUP BY p.product_id, p.sku, p.name, c.name, p.unit_of_measure, p.cost_price, p.selling_price, p.status;

COMMENT ON VIEW v_product_stock_summary IS 'Aggregated stock levels by product across all locations';

-- =============================================================================
-- LOW STOCK ALERT VIEWS
-- =============================================================================

-- View: Products below reorder point
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    l.location_id,
    l.code AS location_code,
    l.name AS location_name,
    sl.quantity_available,
    rs.reorder_point,
    rs.reorder_quantity,
    rs.maximum_stock,
    (rs.reorder_point - sl.quantity_available) AS units_below_reorder,
    ps.supplier_id,
    s.name AS preferred_supplier_name,
    ps.lead_time_days,
    ps.minimum_order_qty,
    ps.cost_price AS supplier_cost_price,
    CASE 
        WHEN sl.quantity_available <= 0 THEN 'OUT_OF_STOCK'
        WHEN sl.quantity_available <= (rs.reorder_point * 0.5) THEN 'CRITICAL'
        WHEN sl.quantity_available <= rs.reorder_point THEN 'LOW'
        ELSE 'NORMAL'
    END AS stock_status
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
INNER JOIN locations l ON sl.location_id = l.location_id
INNER JOIN reorder_settings rs ON sl.product_id = rs.product_id AND sl.location_id = rs.location_id
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN product_suppliers ps ON p.product_id = ps.product_id AND ps.is_preferred = true AND ps.is_active = true
LEFT JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE sl.quantity_available <= rs.reorder_point
  AND rs.is_active = true
  AND p.status = 'active'
  AND l.is_active = true
ORDER BY 
    CASE 
        WHEN sl.quantity_available <= 0 THEN 1
        WHEN sl.quantity_available <= (rs.reorder_point * 0.5) THEN 2
        WHEN sl.quantity_available <= rs.reorder_point THEN 3
        ELSE 4
    END,
    (rs.reorder_point - sl.quantity_available) DESC;

COMMENT ON VIEW v_low_stock_alerts IS 'Products below reorder point with supplier information and stock status';

-- =============================================================================
-- INVENTORY VALUATION FUNCTIONS
-- =============================================================================

-- Function: Calculate inventory valuation using weighted average cost
CREATE OR REPLACE FUNCTION calculate_inventory_value_avg(
    p_product_id INTEGER DEFAULT NULL,
    p_location_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    product_id INTEGER,
    location_id INTEGER,
    quantity_on_hand INTEGER,
    average_cost DECIMAL(12,2),
    total_value DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.product_id,
        sl.location_id,
        sl.quantity_on_hand,
        COALESCE(p.cost_price, 0)::DECIMAL(12,2) AS average_cost,
        (sl.quantity_on_hand * COALESCE(p.cost_price, 0))::DECIMAL(15,2) AS total_value
    FROM stock_levels sl
    INNER JOIN products p ON sl.product_id = p.product_id
    WHERE (p_product_id IS NULL OR sl.product_id = p_product_id)
      AND (p_location_id IS NULL OR sl.location_id = p_location_id)
      AND sl.quantity_on_hand > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_inventory_value_avg IS 'Calculate inventory valuation using weighted average cost method';

-- =============================================================================
-- INVENTORY AGING ANALYSIS
-- =============================================================================

-- View: Inventory aging by product and location
CREATE OR REPLACE VIEW v_inventory_aging AS
WITH last_receipt AS (
    SELECT 
        im.product_id,
        im.location_id,
        MAX(im.created_at) AS last_receipt_date
    FROM inventory_movements im
    INNER JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
    WHERE mt.code = 'RECEIPT'
    GROUP BY im.product_id, im.location_id
)
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    l.location_id,
    l.code AS location_code,
    l.name AS location_name,
    sl.quantity_on_hand,
    sl.quantity_available,
    lr.last_receipt_date,
    CURRENT_DATE - lr.last_receipt_date::DATE AS days_in_stock,
    CASE 
        WHEN CURRENT_DATE - lr.last_receipt_date::DATE <= 30 THEN '0-30 days'
        WHEN CURRENT_DATE - lr.last_receipt_date::DATE <= 60 THEN '31-60 days'
        WHEN CURRENT_DATE - lr.last_receipt_date::DATE <= 90 THEN '61-90 days'
        WHEN CURRENT_DATE - lr.last_receipt_date::DATE <= 180 THEN '91-180 days'
        WHEN CURRENT_DATE - lr.last_receipt_date::DATE <= 365 THEN '181-365 days'
        ELSE 'Over 1 year'
    END AS aging_category,
    (sl.quantity_on_hand * p.cost_price) AS inventory_value_cost,
    p.cost_price,
    p.selling_price
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
INNER JOIN locations l ON sl.location_id = l.location_id
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN last_receipt lr ON sl.product_id = lr.product_id AND sl.location_id = lr.location_id
WHERE sl.quantity_on_hand > 0
  AND p.status = 'active'
  AND l.is_active = true
ORDER BY days_in_stock DESC NULLS LAST;

COMMENT ON VIEW v_inventory_aging IS 'Inventory aging analysis showing how long items have been in stock';

-- =============================================================================
-- INVENTORY TURNOVER ANALYSIS
-- =============================================================================

-- Function: Calculate inventory turnover ratio
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
    p_product_id INTEGER DEFAULT NULL,
    p_location_id INTEGER DEFAULT NULL,
    p_period_days INTEGER DEFAULT 365
)
RETURNS TABLE (
    product_id INTEGER,
    product_sku VARCHAR(50),
    product_name VARCHAR(200),
    location_id INTEGER,
    location_code VARCHAR(50),
    total_quantity_sold INTEGER,
    average_inventory DECIMAL(12,2),
    turnover_ratio DECIMAL(10,2),
    days_to_sell DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            im.product_id,
            im.location_id,
            SUM(im.quantity) AS total_sold
        FROM inventory_movements im
        INNER JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
        WHERE mt.code IN ('SALE', 'SHIP')
          AND im.created_at >= CURRENT_DATE - p_period_days
          AND (p_product_id IS NULL OR im.product_id = p_product_id)
          AND (p_location_id IS NULL OR im.location_id = p_location_id)
        GROUP BY im.product_id, im.location_id
    ),
    avg_inventory AS (
        SELECT 
            sl.product_id,
            sl.location_id,
            AVG(sl.quantity_on_hand) AS avg_qty
        FROM stock_levels sl
        WHERE (p_product_id IS NULL OR sl.product_id = p_product_id)
          AND (p_location_id IS NULL OR sl.location_id = p_location_id)
        GROUP BY sl.product_id, sl.location_id
    )
    SELECT 
        p.product_id,
        p.sku,
        p.name,
        COALESCE(sd.location_id, ai.location_id),
        l.code,
        COALESCE(sd.total_sold, 0)::INTEGER,
        COALESCE(ai.avg_qty, 0)::DECIMAL(12,2),
        CASE 
            WHEN COALESCE(ai.avg_qty, 0) > 0 
            THEN (COALESCE(sd.total_sold, 0) / ai.avg_qty)::DECIMAL(10,2)
            ELSE 0::DECIMAL(10,2)
        END AS turnover_ratio,
        CASE 
            WHEN COALESCE(sd.total_sold, 0) > 0 
            THEN (p_period_days * COALESCE(ai.avg_qty, 0) / sd.total_sold)::DECIMAL(10,2)
            ELSE NULL::DECIMAL(10,2)
        END AS days_to_sell
    FROM products p
    LEFT JOIN sales_data sd ON p.product_id = sd.product_id
    LEFT JOIN avg_inventory ai ON p.product_id = ai.product_id 
        AND (sd.location_id IS NULL OR ai.location_id = sd.location_id)
    LEFT JOIN locations l ON COALESCE(sd.location_id, ai.location_id) = l.location_id
    WHERE (p_product_id IS NULL OR p.product_id = p_product_id)
      AND p.status = 'active'
      AND (sd.total_sold IS NOT NULL OR ai.avg_qty IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_inventory_turnover IS 'Calculate inventory turnover ratio and days to sell for products';

-- View: Inventory turnover summary (last 365 days)
CREATE OR REPLACE VIEW v_inventory_turnover_summary AS
SELECT * FROM calculate_inventory_turnover(NULL, NULL, 365);

COMMENT ON VIEW v_inventory_turnover_summary IS 'Inventory turnover analysis for all products over the last 365 days';

-- =============================================================================
-- MOVEMENT ANALYSIS VIEWS
-- =============================================================================

-- View: Recent inventory movements with details
CREATE OR REPLACE VIEW v_recent_movements AS
SELECT 
    im.movement_id,
    im.created_at,
    im.created_by,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    l.code AS location_code,
    l.name AS location_name,
    mt.name AS movement_type,
    mt.affects_quantity,
    im.quantity,
    im.unit_cost,
    (im.quantity * COALESCE(im.unit_cost, 0)) AS total_cost,
    im.reference_document,
    im.notes
FROM inventory_movements im
INNER JOIN products p ON im.product_id = p.product_id
INNER JOIN locations l ON im.location_id = l.location_id
INNER JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
LEFT JOIN categories c ON p.category_id = c.category_id
ORDER BY im.created_at DESC
LIMIT 1000;

COMMENT ON VIEW v_recent_movements IS 'Recent 1000 inventory movements with full details';

-- =============================================================================
-- SUPPLIER PERFORMANCE VIEWS
-- =============================================================================

-- View: Supplier performance metrics
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT 
    s.supplier_id,
    s.code AS supplier_code,
    s.name AS supplier_name,
    s.contact_person,
    s.email,
    s.payment_terms,
    COUNT(DISTINCT ps.product_id) AS products_supplied,
    COUNT(DISTINCT CASE WHEN ps.is_preferred THEN ps.product_id END) AS preferred_products_count,
    AVG(ps.lead_time_days) AS avg_lead_time_days,
    AVG(ps.average_delivery_days) AS avg_actual_delivery_days,
    AVG(ps.on_time_delivery_rate) AS avg_on_time_delivery_rate,
    AVG(ps.quality_rating) AS avg_quality_rating,
    SUM(ps.total_orders) AS total_orders,
    SUM(ps.total_delivered) AS total_delivered,
    CASE 
        WHEN SUM(ps.total_orders) > 0 
        THEN (SUM(ps.total_delivered)::DECIMAL / SUM(ps.total_orders))
        ELSE NULL
    END AS overall_delivery_rate,
    s.is_active
FROM suppliers s
LEFT JOIN product_suppliers ps ON s.supplier_id = ps.supplier_id AND ps.is_active = true
GROUP BY s.supplier_id, s.code, s.name, s.contact_person, s.email, s.payment_terms, s.is_active
ORDER BY avg_quality_rating DESC NULLS LAST, avg_on_time_delivery_rate DESC NULLS LAST;

COMMENT ON VIEW v_supplier_performance IS 'Supplier performance metrics including delivery rates and quality ratings';

-- =============================================================================
-- INDEXES FOR REPORTING PERFORMANCE
-- =============================================================================

-- Additional indexes for reporting queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_levels_quantity_available ON stock_levels(quantity_available) WHERE quantity_available > 0;
