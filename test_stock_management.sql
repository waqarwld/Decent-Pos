-- Test Script for Stock Management Functionality
-- This script tests the stock management tables and triggers

-- Test 1: Insert a sample inventory movement and verify stock level update
BEGIN;

-- Insert a receipt movement (should increase stock)
INSERT INTO inventory_movements (
    product_id, 
    location_id, 
    movement_type_id, 
    quantity, 
    unit_cost, 
    reference_document, 
    created_by
) VALUES (
    1,  -- Laptop product
    1,  -- Main warehouse
    1,  -- RECEIPT movement type
    10, -- Quantity
    800.00, -- Unit cost
    'PO-2024-001',
    'test_user'
);

-- Check if stock level was created/updated
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_on_hand,
    sl.quantity_reserved,
    sl.quantity_available,
    sl.last_movement_at
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 1 AND sl.location_id = 1;

-- Test 2: Insert a sale movement (should decrease stock)
INSERT INTO inventory_movements (
    product_id, 
    location_id, 
    movement_type_id, 
    quantity, 
    unit_cost, 
    reference_document, 
    created_by
) VALUES (
    1,  -- Laptop product
    1,  -- Main warehouse
    2,  -- SALE movement type
    3,  -- Quantity
    800.00, -- Unit cost
    'SO-2024-001',
    'test_user'
);

-- Check updated stock level
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_on_hand,
    sl.quantity_reserved,
    sl.quantity_available,
    sl.last_movement_at
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 1 AND sl.location_id = 1;

-- Test 3: Verify movement history
SELECT 
    im.movement_id,
    p.sku,
    l.code as location,
    mt.name as movement_type,
    im.quantity,
    mt.affects_quantity,
    im.quantity * mt.affects_quantity as net_effect,
    im.created_at
FROM inventory_movements im
JOIN products p ON im.product_id = p.product_id
JOIN locations l ON im.location_id = l.location_id
JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
WHERE im.product_id = 1 AND im.location_id = 1
ORDER BY im.created_at;

-- Test 4: Test reorder point functionality
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_available,
    rs.reorder_point,
    rs.reorder_quantity,
    CASE 
        WHEN sl.quantity_available <= rs.reorder_point THEN 'REORDER NEEDED'
        ELSE 'Stock OK'
    END as reorder_status
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
JOIN reorder_settings rs ON sl.product_id = rs.product_id AND sl.location_id = rs.location_id
WHERE rs.is_active = true;

ROLLBACK;  -- Rollback test data

-- Test 5: Test product-supplier relationships
BEGIN;

-- Test preferred supplier queries
SELECT 
    p.sku,
    s.name as supplier_name,
    ps.supplier_sku,
    ps.lead_time_days,
    ps.minimum_order_qty,
    ps.cost_price,
    ps.is_preferred,
    ps.quality_rating,
    ps.on_time_delivery_rate
FROM product_suppliers ps
JOIN products p ON ps.product_id = p.product_id
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_active = true
ORDER BY p.sku, ps.is_preferred DESC, ps.quality_rating DESC;

-- Test supplier performance ranking
SELECT 
    s.name as supplier_name,
    COUNT(ps.product_id) as products_supplied,
    AVG(ps.quality_rating) as avg_quality_rating,
    AVG(ps.on_time_delivery_rate) as avg_delivery_rate,
    AVG(ps.lead_time_days) as avg_lead_time
FROM product_suppliers ps
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_active = true
GROUP BY s.supplier_id, s.name
ORDER BY avg_quality_rating DESC, avg_delivery_rate DESC;

-- Test finding preferred suppliers for each product
SELECT 
    p.sku,
    s.name as preferred_supplier,
    ps.cost_price,
    ps.lead_time_days,
    ps.quality_rating
FROM product_suppliers ps
JOIN products p ON ps.product_id = p.product_id
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_preferred = true AND ps.is_active = true
ORDER BY p.sku;

ROLLBACK;  -- Rollback test data

-- Display final message
SELECT 'Stock management and supplier relationship functionality test completed successfully' as test_result;