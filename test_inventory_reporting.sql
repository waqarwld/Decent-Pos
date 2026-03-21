-- Test Script for Inventory Reporting Views and Functions
-- Validates all reporting views and functions created for Task 5

-- =============================================================================
-- TEST SETUP
-- =============================================================================

-- Start transaction for testing
BEGIN;

-- Display test header
SELECT '=== INVENTORY REPORTING TESTS ===' AS test_suite;

-- =============================================================================
-- TEST 1: Current Stock Level Views (Requirement 5.1)
-- =============================================================================

SELECT '--- Test 1.1: v_current_stock_levels view ---' AS test_name;
SELECT 
    COUNT(*) AS total_records,
    COUNT(DISTINCT product_id) AS unique_products,
    COUNT(DISTINCT location_id) AS unique_locations,
    SUM(quantity_on_hand) AS total_quantity,
    SUM(inventory_value_cost) AS total_cost_value
FROM v_current_stock_levels;

SELECT '--- Test 1.2: v_product_stock_summary view ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_count,
    total_quantity_on_hand,
    total_quantity_available,
    total_inventory_value_cost
FROM v_product_stock_summary
ORDER BY total_inventory_value_cost DESC
LIMIT 5;

SELECT '--- Test 1.3: v_location_stock_summary view ---' AS test_name;
SELECT 
    location_code,
    location_name,
    product_count,
    total_units_on_hand,
    total_inventory_value_cost
FROM v_location_stock_summary
ORDER BY total_inventory_value_cost DESC
LIMIT 5;

-- =============================================================================
-- TEST 2: Inventory Valuation Functions (Requirement 5.2)
-- =============================================================================

SELECT '--- Test 2.1: FIFO valuation function ---' AS test_name;
SELECT 
    product_id,
    location_id,
    quantity_on_hand,
    fifo_value,
    average_unit_cost
FROM calculate_inventory_valuation_fifo()
ORDER BY fifo_value DESC
LIMIT 5;

SELECT '--- Test 2.2: Weighted Average valuation function ---' AS test_name;
SELECT 
    product_id,
    location_id,
    quantity_on_hand,
    avg_value,
    average_unit_cost
FROM calculate_inventory_valuation_avg()
ORDER BY avg_value DESC
LIMIT 5;

SELECT '--- Test 2.3: Standard Cost valuation function ---' AS test_name;
SELECT 
    product_id,
    location_id,
    quantity_on_hand,
    standard_value,
    standard_unit_cost
FROM calculate_inventory_valuation_standard()
ORDER BY standard_value DESC
LIMIT 5;

-- Test valuation for specific product
SELECT '--- Test 2.4: Valuation for specific product ---' AS test_name;
SELECT 
    'FIFO' AS method,
    SUM(fifo_value) AS total_value
FROM calculate_inventory_valuation_fifo(1, NULL)
UNION ALL
SELECT 
    'Weighted Avg' AS method,
    SUM(avg_value) AS total_value
FROM calculate_inventory_valuation_avg(1, NULL)
UNION ALL
SELECT 
    'Standard Cost' AS method,
    SUM(standard_value) AS total_value
FROM calculate_inventory_valuation_standard(1, NULL);

-- =============================================================================
-- TEST 3: Inventory Aging Views (Requirement 5.3)
-- =============================================================================

SELECT '--- Test 3.1: v_inventory_aging view ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_code,
    quantity_on_hand,
    days_in_stock,
    aging_bucket,
    inventory_value
FROM v_inventory_aging
ORDER BY days_in_stock DESC
LIMIT 10;

SELECT '--- Test 3.2: v_inventory_aging_summary view ---' AS test_name;
SELECT 
    aging_bucket,
    item_count,
    total_quantity,
    total_value,
    ROUND(avg_days_in_stock, 2) AS avg_days
FROM v_inventory_aging_summary
ORDER BY 
    CASE aging_bucket
        WHEN '0-30 days' THEN 1
        WHEN '31-60 days' THEN 2
        WHEN '61-90 days' THEN 3
        WHEN '91-180 days' THEN 4
        WHEN '181-365 days' THEN 5
        WHEN 'Over 1 year' THEN 6
    END;

-- =============================================================================
-- TEST 4: Low Stock Alert Views (Requirement 5.4)
-- =============================================================================

SELECT '--- Test 4.1: v_low_stock_alerts view ---' AS test_name;
SELECT 
    COUNT(*) AS total_alerts,
    COUNT(CASE WHEN alert_level = 'OUT_OF_STOCK' THEN 1 END) AS out_of_stock_count,
    COUNT(CASE WHEN alert_level = 'CRITICAL' THEN 1 END) AS critical_count,
    COUNT(CASE WHEN alert_level = 'LOW' THEN 1 END) AS low_count
FROM v_low_stock_alerts;

SELECT '--- Test 4.2: Low stock alert details ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_code,
    quantity_available,
    reorder_point,
    units_below_reorder,
    alert_level,
    preferred_supplier_name
FROM v_low_stock_alerts
ORDER BY 
    CASE alert_level
        WHEN 'OUT_OF_STOCK' THEN 1
        WHEN 'CRITICAL' THEN 2
        WHEN 'LOW' THEN 3
    END,
    quantity_available ASC
LIMIT 10;

SELECT '--- Test 4.3: v_approaching_reorder view ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_code,
    quantity_available,
    reorder_point,
    percent_above_reorder,
    lead_time_days
FROM v_approaching_reorder
ORDER BY percent_above_reorder ASC
LIMIT 10;

-- =============================================================================
-- TEST 5: Inventory Turnover Analysis (Requirement 5.5)
-- =============================================================================

SELECT '--- Test 5.1: Inventory turnover function (last 30 days) ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_code,
    total_sales_quantity,
    ROUND(average_inventory, 2) AS avg_inventory,
    ROUND(turnover_ratio, 2) AS turnover,
    ROUND(days_of_supply, 2) AS days_supply
FROM calculate_inventory_turnover(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    NULL,
    NULL
)
WHERE total_sales_quantity > 0
ORDER BY turnover_ratio DESC
LIMIT 10;

SELECT '--- Test 5.2: v_inventory_turnover_90days view ---' AS test_name;
SELECT 
    COUNT(*) AS total_products,
    ROUND(AVG(turnover_ratio), 2) AS avg_turnover,
    ROUND(AVG(days_of_supply), 2) AS avg_days_supply,
    SUM(total_sales_quantity) AS total_sales
FROM v_inventory_turnover_90days
WHERE total_sales_quantity > 0;

SELECT '--- Test 5.3: v_slow_moving_inventory view ---' AS test_name;
SELECT 
    COUNT(*) AS slow_moving_count,
    SUM(average_inventory) AS total_slow_inventory
FROM v_slow_moving_inventory;

SELECT 
    product_sku,
    product_name,
    location_code,
    ROUND(average_inventory, 2) AS avg_inventory,
    ROUND(turnover_ratio, 2) AS turnover,
    ROUND(days_of_supply, 2) AS days_supply
FROM v_slow_moving_inventory
LIMIT 5;

SELECT '--- Test 5.4: v_fast_moving_inventory view ---' AS test_name;
SELECT 
    COUNT(*) AS fast_moving_count
FROM v_fast_moving_inventory;

SELECT 
    product_sku,
    product_name,
    location_code,
    total_sales_quantity,
    ROUND(average_inventory, 2) AS avg_inventory,
    ROUND(turnover_ratio, 2) AS turnover
FROM v_fast_moving_inventory
LIMIT 5;

-- =============================================================================
-- TEST 6: Comprehensive Dashboard View
-- =============================================================================

SELECT '--- Test 6.1: v_inventory_health_dashboard view ---' AS test_name;
SELECT 
    stock_status,
    COUNT(*) AS item_count,
    SUM(quantity_on_hand) AS total_quantity,
    SUM(inventory_value) AS total_value
FROM v_inventory_health_dashboard
GROUP BY stock_status
ORDER BY 
    CASE stock_status
        WHEN 'OUT_OF_STOCK' THEN 1
        WHEN 'LOW_STOCK' THEN 2
        WHEN 'NORMAL' THEN 3
        WHEN 'OVERSTOCK' THEN 4
    END;

SELECT '--- Test 6.2: Dashboard details by status ---' AS test_name;
SELECT 
    product_sku,
    product_name,
    location_code,
    quantity_available,
    reorder_point,
    stock_status,
    aging_bucket,
    inventory_value
FROM v_inventory_health_dashboard
WHERE stock_status IN ('OUT_OF_STOCK', 'LOW_STOCK')
ORDER BY 
    CASE stock_status
        WHEN 'OUT_OF_STOCK' THEN 1
        WHEN 'LOW_STOCK' THEN 2
    END,
    quantity_available ASC
LIMIT 10;

-- =============================================================================
-- TEST 7: Utility Functions
-- =============================================================================

SELECT '--- Test 7.1: get_product_movement_history function ---' AS test_name;
-- Test with first product that has movements
WITH first_product AS (
    SELECT product_id 
    FROM inventory_movements 
    LIMIT 1
)
SELECT 
    movement_date,
    movement_type,
    location_code,
    quantity,
    affects_quantity,
    unit_cost,
    reference_document
FROM get_product_movement_history(
    (SELECT product_id FROM first_product),
    NULL,
    NULL,
    NULL,
    10
)
ORDER BY movement_date DESC;

-- =============================================================================
-- TEST 8: Performance and Data Validation
-- =============================================================================

SELECT '--- Test 8.1: View performance check ---' AS test_name;
SELECT 
    'v_current_stock_levels' AS view_name,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('v_current_stock_levels'::regclass)) AS size
FROM v_current_stock_levels
UNION ALL
SELECT 
    'v_product_stock_summary' AS view_name,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('v_product_stock_summary'::regclass)) AS size
FROM v_product_stock_summary
UNION ALL
SELECT 
    'v_inventory_aging' AS view_name,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('v_inventory_aging'::regclass)) AS size
FROM v_inventory_aging
UNION ALL
SELECT 
    'v_low_stock_alerts' AS view_name,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('v_low_stock_alerts'::regclass)) AS size
FROM v_low_stock_alerts;

SELECT '--- Test 8.2: Data consistency validation ---' AS test_name;
-- Verify stock levels match between views
SELECT 
    'Stock Level Consistency' AS check_name,
    CASE 
        WHEN ABS(base_total - summary_total) < 0.01 THEN 'PASS'
        ELSE 'FAIL'
    END AS result,
    base_total,
    summary_total
FROM (
    SELECT 
        SUM(quantity_on_hand) AS base_total,
        (SELECT SUM(total_quantity_on_hand) FROM v_product_stock_summary) AS summary_total
    FROM stock_levels
) AS consistency_check;

-- Verify valuation calculations are non-negative
SELECT 
    'Valuation Non-Negative' AS check_name,
    CASE 
        WHEN MIN(fifo_value) >= 0 AND MIN(average_unit_cost) >= 0 THEN 'PASS'
        ELSE 'FAIL'
    END AS result,
    MIN(fifo_value) AS min_fifo_value,
    MIN(average_unit_cost) AS min_avg_cost
FROM calculate_inventory_valuation_fifo();

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

SELECT '--- TEST SUMMARY ---' AS test_name;
SELECT 
    'Total Views Created' AS metric,
    COUNT(*) AS value
FROM information_schema.views
WHERE table_schema = 'public' 
    AND table_name LIKE 'v_%'
UNION ALL
SELECT 
    'Total Functions Created' AS metric,
    COUNT(*) AS value
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name LIKE 'calculate_%' OR routine_name LIKE 'get_%';

-- Rollback transaction (comment out to keep test data)
ROLLBACK;

-- Display completion message
SELECT '=== ALL TESTS COMPLETED ===' AS test_result;
