-- Schema Validation Script
-- Run this to verify the database schema was created correctly

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'products', 'locations', 'suppliers', 
                       'movement_types', 'stock_levels', 'inventory_movements', 'reorder_settings', 'product_suppliers')
ORDER BY table_name;

-- Check constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('categories', 'products', 'locations', 'suppliers',
                          'movement_types', 'stock_levels', 'inventory_movements', 'reorder_settings', 'product_suppliers')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'products', 'locations', 'suppliers',
                      'movement_types', 'stock_levels', 'inventory_movements', 'reorder_settings', 'product_suppliers')
ORDER BY tablename, indexname;

-- Check foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('categories', 'products', 'locations', 'suppliers',
                          'movement_types', 'stock_levels', 'inventory_movements', 'reorder_settings', 'product_suppliers')
ORDER BY tc.table_name, kcu.column_name;

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN ('categories', 'products', 'locations', 'suppliers',
                               'movement_types', 'stock_levels', 'inventory_movements', 'reorder_settings', 'product_suppliers')
ORDER BY event_object_table, trigger_name;
-- =
============================================================================
-- STOCK MANAGEMENT SPECIFIC VALIDATIONS
-- =============================================================================

-- Check generated columns in stock_levels
SELECT 
    column_name,
    data_type,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'stock_levels'
    AND column_name = 'quantity_available';

-- Verify movement types data
SELECT 
    code,
    name,
    affects_quantity,
    CASE 
        WHEN affects_quantity = 1 THEN 'Increases Stock'
        WHEN affects_quantity = -1 THEN 'Decreases Stock'
        ELSE 'Invalid'
    END as effect
FROM movement_types
ORDER BY code;

-- Test stock level trigger functionality (if data exists)
SELECT 
    'Stock levels with movements: ' || COUNT(*)
FROM stock_levels sl
WHERE EXISTS (
    SELECT 1 FROM inventory_movements im 
    WHERE im.product_id = sl.product_id 
    AND im.location_id = sl.location_id
);

-- Check reorder settings constraints
SELECT 
    rs.reorder_setting_id,
    p.sku,
    l.code as location_code,
    rs.reorder_point,
    rs.reorder_quantity,
    rs.maximum_stock,
    CASE 
        WHEN rs.maximum_stock IS NULL THEN 'No max limit'
        WHEN rs.maximum_stock >= rs.reorder_point THEN 'Valid'
        ELSE 'Invalid: max < reorder point'
    END as validation_status
FROM reorder_settings rs
JOIN products p ON rs.product_id = p.product_id
JOIN locations l ON rs.location_id = l.location_id
WHERE rs.is_active = true
ORDER BY p.sku, l.code;

-- =============================================================================
-- PRODUCT-SUPPLIER RELATIONSHIP VALIDATIONS
-- =============================================================================

-- Check product_suppliers table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'product_suppliers'
ORDER BY ordinal_position;

-- Validate product_suppliers constraints
SELECT 
    ps.product_supplier_id,
    p.sku,
    s.code as supplier_code,
    ps.is_preferred,
    ps.lead_time_days,
    ps.minimum_order_qty,
    ps.cost_price,
    ps.quality_rating,
    ps.on_time_delivery_rate,
    CASE 
        WHEN ps.lead_time_days IS NOT NULL AND ps.lead_time_days < 0 THEN 'Invalid: negative lead time'
        WHEN ps.minimum_order_qty IS NOT NULL AND ps.minimum_order_qty <= 0 THEN 'Invalid: non-positive min order'
        WHEN ps.cost_price IS NOT NULL AND ps.cost_price < 0 THEN 'Invalid: negative cost'
        WHEN ps.quality_rating IS NOT NULL AND (ps.quality_rating < 0 OR ps.quality_rating > 5) THEN 'Invalid: quality rating out of range'
        WHEN ps.on_time_delivery_rate IS NOT NULL AND (ps.on_time_delivery_rate < 0 OR ps.on_time_delivery_rate > 1) THEN 'Invalid: delivery rate out of range'
        WHEN ps.total_delivered > ps.total_orders THEN 'Invalid: delivered > orders'
        ELSE 'Valid'
    END as validation_status
FROM product_suppliers ps
JOIN products p ON ps.product_id = p.product_id
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_active = true
ORDER BY p.sku, s.code;

-- Check for preferred supplier conflicts (multiple preferred suppliers per product)
SELECT 
    p.sku,
    COUNT(*) as preferred_supplier_count,
    STRING_AGG(s.code, ', ') as preferred_suppliers
FROM product_suppliers ps
JOIN products p ON ps.product_id = p.product_id
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_preferred = true AND ps.is_active = true
GROUP BY p.product_id, p.sku
HAVING COUNT(*) > 1
ORDER BY p.sku;