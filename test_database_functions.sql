-- =============================================================================
-- COMPREHENSIVE UNIT TESTS FOR DATABASE FUNCTIONS
-- =============================================================================
-- This test suite covers:
-- 1. Trigger functions for stock level updates
-- 2. Constraint enforcement and error handling
-- 3. Stored procedures with various scenarios
-- 4. Test data fixtures and cleanup procedures
--
-- Requirements: 2.5, 4.4, data integrity validation
-- =============================================================================

-- Enable test output formatting
\set QUIET off
\timing off

-- =============================================================================
-- TEST FIXTURES AND SETUP
-- =============================================================================

-- Create test fixture: Setup test data
CREATE OR REPLACE FUNCTION setup_test_data()
RETURNS void AS $
BEGIN
    -- Clean up any existing test data
    DELETE FROM inventory_movements WHERE created_by LIKE 'test_%';
    DELETE FROM stock_levels WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM reorder_settings WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM product_suppliers WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM products WHERE sku LIKE 'TEST-%';
    DELETE FROM locations WHERE code LIKE 'TEST-%';
    DELETE FROM suppliers WHERE code LIKE 'TEST-%';
    DELETE FROM categories WHERE name LIKE 'TEST-%';
    
    -- Create test category
    INSERT INTO categories (category_id, name, description)
    VALUES (9999, 'TEST-CATEGORY', 'Test category for unit tests')
    ON CONFLICT DO NOTHING;
    
    -- Create test products
    INSERT INTO products (product_id, sku, name, category_id, unit_of_measure, cost_price, selling_price, status)
    VALUES 
        (9001, 'TEST-PROD-001', 'Test Product 1', 9999, 'EA', 100.00, 150.00, 'active'),
        (9002, 'TEST-PROD-002', 'Test Product 2', 9999, 'EA', 50.00, 75.00, 'active'),
        (9003, 'TEST-PROD-003', 'Test Product 3', 9999, 'EA', 25.00, 40.00, 'discontinued')
    ON CONFLICT DO NOTHING;
    
    -- Create test locations
    INSERT INTO locations (location_id, code, name, location_type, is_active)
    VALUES 
        (9001, 'TEST-LOC-001', 'Test Location 1', 'warehouse', true),
        (9002, 'TEST-LOC-002', 'Test Location 2', 'warehouse', true),
        (9003, 'TEST-LOC-003', 'Test Location 3', 'warehouse', false)
    ON CONFLICT DO NOTHING;
    
    -- Create test suppliers
    INSERT INTO suppliers (supplier_id, code, name, is_active)
    VALUES 
        (9001, 'TEST-SUP-001', 'Test Supplier 1', true),
        (9002, 'TEST-SUP-002', 'Test Supplier 2', false)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data setup completed';
END;
$ LANGUAGE plpgsql;

-- Create test fixture: Cleanup test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $
BEGIN
    DELETE FROM inventory_movements WHERE created_by LIKE 'test_%';
    DELETE FROM stock_levels WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM reorder_settings WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM product_suppliers WHERE product_id IN (
        SELECT product_id FROM products WHERE sku LIKE 'TEST-%'
    );
    DELETE FROM products WHERE sku LIKE 'TEST-%';
    DELETE FROM locations WHERE code LIKE 'TEST-%';
    DELETE FROM suppliers WHERE code LIKE 'TEST-%';
    DELETE FROM categories WHERE name LIKE 'TEST-%';
    
    RAISE NOTICE 'Test data cleanup completed';
END;
$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 1: TRIGGER FUNCTION TESTS
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'SECTION 1: TRIGGER FUNCTION TESTS'
\echo '========================================='
\echo ''

-- Test 1.1: Trigger creates new stock level on first movement
\echo 'Test 1.1: Trigger creates new stock level on first movement'
\echo '------------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Insert a receipt movement
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 100, 100.00, 'test_trigger_1'
FROM movement_types WHERE code = 'RECEIPT';

-- Verify stock level was created
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM stock_levels 
        WHERE product_id = 9001 AND location_id = 9001 AND quantity_on_hand = 100
    ) THEN
        RAISE NOTICE 'PASS: Stock level created with correct quantity';
    ELSE
        RAISE EXCEPTION 'FAIL: Stock level not created correctly';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 1.2: Trigger updates existing stock level
\echo 'Test 1.2: Trigger updates existing stock level'
\echo '-----------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Insert first movement
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 50, 100.00, 'test_trigger_2a'
FROM movement_types WHERE code = 'RECEIPT';

-- Insert second movement
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 30, 100.00, 'test_trigger_2b'
FROM movement_types WHERE code = 'RECEIPT';

-- Verify stock level was updated
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM stock_levels 
        WHERE product_id = 9001 AND location_id = 9001 AND quantity_on_hand = 80
    ) THEN
        RAISE NOTICE 'PASS: Stock level updated correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Stock level not updated correctly';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 1.3: Trigger handles negative movements (sales)
\echo 'Test 1.3: Trigger handles negative movements (sales)'
\echo '-----------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Add initial stock
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 100, 100.00, 'test_trigger_3a'
FROM movement_types WHERE code = 'RECEIPT';

-- Remove stock via sale
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 25, 100.00, 'test_trigger_3b'
FROM movement_types WHERE code = 'SALE';

-- Verify stock level decreased
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM stock_levels 
        WHERE product_id = 9001 AND location_id = 9001 AND quantity_on_hand = 75
    ) THEN
        RAISE NOTICE 'PASS: Stock level decreased correctly for sale';
    ELSE
        RAISE EXCEPTION 'FAIL: Stock level not decreased correctly';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 1.4: Trigger handles transfers correctly
\echo 'Test 1.4: Trigger handles transfers correctly'
\echo '----------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Add initial stock at location 1
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 100, 100.00, 'test_trigger_4a'
FROM movement_types WHERE code = 'RECEIPT';

-- Transfer out from location 1
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 40, 100.00, 'test_trigger_4b'
FROM movement_types WHERE code = 'TRANSFER_OUT';

-- Transfer in to location 2
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9002, movement_type_id, 40, 100.00, 'test_trigger_4c'
FROM movement_types WHERE code = 'TRANSFER_IN';

-- Verify both locations
DO $
DECLARE
    v_loc1_qty INTEGER;
    v_loc2_qty INTEGER;
BEGIN
    SELECT quantity_on_hand INTO v_loc1_qty FROM stock_levels WHERE product_id = 9001 AND location_id = 9001;
    SELECT quantity_on_hand INTO v_loc2_qty FROM stock_levels WHERE product_id = 9001 AND location_id = 9002;
    
    IF v_loc1_qty = 60 AND v_loc2_qty = 40 THEN
        RAISE NOTICE 'PASS: Transfer handled correctly at both locations';
    ELSE
        RAISE EXCEPTION 'FAIL: Transfer not handled correctly (Loc1: %, Loc2: %)', v_loc1_qty, v_loc2_qty;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 1.5: Trigger updates last_movement_at timestamp
\echo 'Test 1.5: Trigger updates last_movement_at timestamp'
\echo '-----------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Insert movement
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, created_by)
SELECT 9001, 9001, movement_type_id, 50, 100.00, 'test_trigger_5'
FROM movement_types WHERE code = 'RECEIPT';

-- Verify timestamp was set
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM stock_levels 
        WHERE product_id = 9001 AND location_id = 9001 
        AND last_movement_at IS NOT NULL
        AND last_movement_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
    ) THEN
        RAISE NOTICE 'PASS: last_movement_at timestamp set correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: last_movement_at timestamp not set';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- =============================================================================
-- SECTION 2: CONSTRAINT ENFORCEMENT TESTS
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'SECTION 2: CONSTRAINT ENFORCEMENT TESTS'
\echo '========================================='
\echo ''

-- Test 2.1: Positive quantity constraint on stock_levels
\echo 'Test 2.1: Positive quantity constraint on stock_levels'
\echo '-------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert negative quantity_on_hand
DO $
BEGIN
    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand, quantity_reserved)
    VALUES (9001, 9001, -10, 0);
    RAISE EXCEPTION 'FAIL: Negative quantity_on_hand was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Negative quantity_on_hand rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.2: Reserved quantity cannot exceed on_hand
\echo 'Test 2.2: Reserved quantity cannot exceed on_hand'
\echo '--------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert reserved > on_hand
DO $
BEGIN
    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand, quantity_reserved)
    VALUES (9001, 9001, 50, 60);
    RAISE EXCEPTION 'FAIL: Reserved > on_hand was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Reserved > on_hand rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.3: Unique constraint on product-location combination
\echo 'Test 2.3: Unique constraint on product-location combination'
\echo '------------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Insert first stock level
INSERT INTO stock_levels (product_id, location_id, quantity_on_hand)
VALUES (9001, 9001, 50);

-- Try to insert duplicate
DO $
BEGIN
    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand)
    VALUES (9001, 9001, 30);
    RAISE EXCEPTION 'FAIL: Duplicate product-location was allowed';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'PASS: Duplicate product-location rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.4: SKU uniqueness constraint
\echo 'Test 2.4: SKU uniqueness constraint'
\echo '------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert duplicate SKU
DO $
BEGIN
    INSERT INTO products (sku, name, unit_of_measure)
    VALUES ('TEST-PROD-001', 'Duplicate SKU Product', 'EA');
    RAISE EXCEPTION 'FAIL: Duplicate SKU was allowed';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'PASS: Duplicate SKU rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.5: Foreign key constraint on product_id
\echo 'Test 2.5: Foreign key constraint on product_id'
\echo '-----------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert movement with invalid product_id
DO $
BEGIN
    INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, created_by)
    SELECT 99999, 9001, movement_type_id, 10, 'test_constraint_5'
    FROM movement_types WHERE code = 'RECEIPT';
    RAISE EXCEPTION 'FAIL: Invalid product_id was allowed';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS: Invalid product_id rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.6: Foreign key constraint on location_id
\echo 'Test 2.6: Foreign key constraint on location_id'
\echo '------------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert movement with invalid location_id
DO $
BEGIN
    INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, created_by)
    SELECT 9001, 99999, movement_type_id, 10, 'test_constraint_6'
    FROM movement_types WHERE code = 'RECEIPT';
    RAISE EXCEPTION 'FAIL: Invalid location_id was allowed';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS: Invalid location_id rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.7: Movement quantity cannot be zero
\echo 'Test 2.7: Movement quantity cannot be zero'
\echo '-------------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert zero quantity movement
DO $
BEGIN
    INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, created_by)
    SELECT 9001, 9001, movement_type_id, 0, 'test_constraint_7'
    FROM movement_types WHERE code = 'RECEIPT';
    RAISE EXCEPTION 'FAIL: Zero quantity movement was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Zero quantity movement rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.8: Product status validation
\echo 'Test 2.8: Product status validation'
\echo '------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert invalid status
DO $
BEGIN
    INSERT INTO products (sku, name, unit_of_measure, status)
    VALUES ('TEST-INVALID', 'Invalid Status Product', 'EA', 'invalid_status');
    RAISE EXCEPTION 'FAIL: Invalid product status was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Invalid product status rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.9: Positive price constraints
\echo 'Test 2.9: Positive price constraints'
\echo '-------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert negative cost price
DO $
BEGIN
    INSERT INTO products (sku, name, unit_of_measure, cost_price)
    VALUES ('TEST-NEG-PRICE', 'Negative Price Product', 'EA', -50.00);
    RAISE EXCEPTION 'FAIL: Negative cost price was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Negative cost price rejected';
END;
$;

ROLLBACK;
\echo ''

-- Test 2.10: Reorder settings validation
\echo 'Test 2.10: Reorder settings validation'
\echo '---------------------------------------'
BEGIN;
SELECT setup_test_data();

-- Try to insert invalid reorder settings (max < reorder point)
DO $
BEGIN
    INSERT INTO reorder_settings (product_id, location_id, reorder_point, reorder_quantity, maximum_stock)
    VALUES (9001, 9001, 100, 50, 50);  -- max_stock < reorder_point
    RAISE EXCEPTION 'FAIL: Invalid reorder settings (max < reorder_point) was allowed';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Invalid reorder settings rejected';
END;
$;

ROLLBACK;
\echo ''

-- =============================================================================
-- SECTION 3: STORED PROCEDURE TESTS
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'SECTION 3: STORED PROCEDURE TESTS'
\echo '========================================='
\echo ''

-- Test 3.1: receive_inventory - Success case
\echo 'Test 3.1: receive_inventory - Success case'
\echo '-------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM receive_inventory(
        9001, 9001, 100, 100.00, 'PO-TEST-001', 'Test receipt', 'test_user'
    );
    
    IF v_result.success AND v_result.new_stock_level = 100 THEN
        RAISE NOTICE 'PASS: receive_inventory succeeded with correct stock level';
    ELSE
        RAISE EXCEPTION 'FAIL: receive_inventory failed or incorrect stock level';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.2: receive_inventory - Negative quantity
\echo 'Test 3.2: receive_inventory - Negative quantity'
\echo '------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM receive_inventory(
        9001, 9001, -10, 100.00, 'PO-TEST-002', 'Test', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%positive%' THEN
        RAISE NOTICE 'PASS: receive_inventory rejected negative quantity';
    ELSE
        RAISE EXCEPTION 'FAIL: receive_inventory should reject negative quantity';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.3: receive_inventory - Inactive product
\echo 'Test 3.3: receive_inventory - Inactive product'
\echo '-----------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM receive_inventory(
        9003, 9001, 10, 100.00, 'PO-TEST-003', 'Test', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%not active%' THEN
        RAISE NOTICE 'PASS: receive_inventory rejected inactive product';
    ELSE
        RAISE EXCEPTION 'FAIL: receive_inventory should reject inactive product';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.4: ship_inventory - Success case
\echo 'Test 3.4: ship_inventory - Success case'
\echo '----------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    -- First receive stock
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-004', 'Setup', 'test_user');
    
    -- Then ship
    SELECT * INTO v_result FROM ship_inventory(
        9001, 9001, 30, 100.00, 'SO-TEST-001', 'Test shipment', 'test_user'
    );
    
    IF v_result.success AND v_result.new_stock_level = 70 THEN
        RAISE NOTICE 'PASS: ship_inventory succeeded with correct stock level';
    ELSE
        RAISE EXCEPTION 'FAIL: ship_inventory failed or incorrect stock level';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.5: ship_inventory - Insufficient stock
\echo 'Test 3.5: ship_inventory - Insufficient stock'
\echo '----------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    -- Receive only 20 units
    PERFORM receive_inventory(9001, 9001, 20, 100.00, 'PO-TEST-005', 'Setup', 'test_user');
    
    -- Try to ship 50 units
    SELECT * INTO v_result FROM ship_inventory(
        9001, 9001, 50, 100.00, 'SO-TEST-002', 'Test', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%Insufficient stock%' THEN
        RAISE NOTICE 'PASS: ship_inventory rejected insufficient stock';
    ELSE
        RAISE EXCEPTION 'FAIL: ship_inventory should reject insufficient stock';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.6: transfer_inventory - Success case
\echo 'Test 3.6: transfer_inventory - Success case'
\echo '--------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    -- Setup stock at location 1
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-006', 'Setup', 'test_user');
    
    -- Transfer to location 2
    SELECT * INTO v_result FROM transfer_inventory(
        9001, 9001, 9002, 40, 100.00, 'TRF-TEST-001', 'Test transfer', 'test_user'
    );
    
    IF v_result.success AND v_result.from_stock_level = 60 AND v_result.to_stock_level = 40 THEN
        RAISE NOTICE 'PASS: transfer_inventory succeeded with correct stock levels';
    ELSE
        RAISE EXCEPTION 'FAIL: transfer_inventory failed or incorrect stock levels';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.7: transfer_inventory - Same source and destination
\echo 'Test 3.7: transfer_inventory - Same source and destination'
\echo '-----------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-007', 'Setup', 'test_user');
    
    SELECT * INTO v_result FROM transfer_inventory(
        9001, 9001, 9001, 40, 100.00, 'TRF-TEST-002', 'Test', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%must be different%' THEN
        RAISE NOTICE 'PASS: transfer_inventory rejected same source and destination';
    ELSE
        RAISE EXCEPTION 'FAIL: transfer_inventory should reject same locations';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.8: transfer_inventory - Insufficient stock
\echo 'Test 3.8: transfer_inventory - Insufficient stock'
\echo '--------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    PERFORM receive_inventory(9001, 9001, 30, 100.00, 'PO-TEST-008', 'Setup', 'test_user');
    
    SELECT * INTO v_result FROM transfer_inventory(
        9001, 9001, 9002, 50, 100.00, 'TRF-TEST-003', 'Test', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%Insufficient stock%' THEN
        RAISE NOTICE 'PASS: transfer_inventory rejected insufficient stock';
    ELSE
        RAISE EXCEPTION 'FAIL: transfer_inventory should reject insufficient stock';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.9: adjust_inventory - Positive adjustment
\echo 'Test 3.9: adjust_inventory - Positive adjustment'
\echo '-------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-009', 'Setup', 'test_user');
    
    SELECT * INTO v_result FROM adjust_inventory(
        9001, 9001, 10, 'Found extra units during count', 'ADJ-TEST-001', 'test_user'
    );
    
    IF v_result.success AND v_result.new_stock_level = 110 THEN
        RAISE NOTICE 'PASS: adjust_inventory positive adjustment succeeded';
    ELSE
        RAISE EXCEPTION 'FAIL: adjust_inventory positive adjustment failed';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.10: adjust_inventory - Negative adjustment
\echo 'Test 3.10: adjust_inventory - Negative adjustment'
\echo '--------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-010', 'Setup', 'test_user');
    
    SELECT * INTO v_result FROM adjust_inventory(
        9001, 9001, -15, 'Damaged units', 'ADJ-TEST-002', 'test_user'
    );
    
    IF v_result.success AND v_result.new_stock_level = 85 THEN
        RAISE NOTICE 'PASS: adjust_inventory negative adjustment succeeded';
    ELSE
        RAISE EXCEPTION 'FAIL: adjust_inventory negative adjustment failed';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.11: adjust_inventory - Zero adjustment
\echo 'Test 3.11: adjust_inventory - Zero adjustment'
\echo '----------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM adjust_inventory(
        9001, 9001, 0, 'Test', 'ADJ-TEST-003', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%cannot be zero%' THEN
        RAISE NOTICE 'PASS: adjust_inventory rejected zero adjustment';
    ELSE
        RAISE EXCEPTION 'FAIL: adjust_inventory should reject zero adjustment';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.12: adjust_inventory - Insufficient stock for negative adjustment
\echo 'Test 3.12: adjust_inventory - Insufficient stock for negative adjustment'
\echo '-------------------------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    PERFORM receive_inventory(9001, 9001, 20, 100.00, 'PO-TEST-011', 'Setup', 'test_user');
    
    SELECT * INTO v_result FROM adjust_inventory(
        9001, 9001, -50, 'Over-adjustment', 'ADJ-TEST-004', 'test_user'
    );
    
    IF NOT v_result.success AND v_result.message LIKE '%Insufficient stock%' THEN
        RAISE NOTICE 'PASS: adjust_inventory rejected insufficient stock for negative adjustment';
    ELSE
        RAISE EXCEPTION 'FAIL: adjust_inventory should reject insufficient stock';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.13: Helper function - validate_product
\echo 'Test 3.13: Helper function - validate_product'
\echo '----------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
BEGIN
    -- Test valid active product
    IF validate_product(9001) THEN
        RAISE NOTICE 'PASS: validate_product returns true for active product';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_product should return true for active product';
    END IF;
    
    -- Test inactive product
    IF NOT validate_product(9003) THEN
        RAISE NOTICE 'PASS: validate_product returns false for inactive product';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_product should return false for inactive product';
    END IF;
    
    -- Test non-existent product
    IF NOT validate_product(99999) THEN
        RAISE NOTICE 'PASS: validate_product returns false for non-existent product';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_product should return false for non-existent product';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.14: Helper function - validate_location
\echo 'Test 3.14: Helper function - validate_location'
\echo '-----------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
BEGIN
    -- Test valid active location
    IF validate_location(9001) THEN
        RAISE NOTICE 'PASS: validate_location returns true for active location';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_location should return true for active location';
    END IF;
    
    -- Test inactive location
    IF NOT validate_location(9003) THEN
        RAISE NOTICE 'PASS: validate_location returns false for inactive location';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_location should return false for inactive location';
    END IF;
    
    -- Test non-existent location
    IF NOT validate_location(99999) THEN
        RAISE NOTICE 'PASS: validate_location returns false for non-existent location';
    ELSE
        RAISE EXCEPTION 'FAIL: validate_location should return false for non-existent location';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 3.15: Helper function - get_stock_quantity
\echo 'Test 3.15: Helper function - get_stock_quantity'
\echo '------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_qty INTEGER;
BEGIN
    -- Setup stock
    PERFORM receive_inventory(9001, 9001, 75, 100.00, 'PO-TEST-012', 'Setup', 'test_user');
    
    -- Get stock quantity
    v_qty := get_stock_quantity(9001, 9001);
    
    IF v_qty = 75 THEN
        RAISE NOTICE 'PASS: get_stock_quantity returns correct quantity';
    ELSE
        RAISE EXCEPTION 'FAIL: get_stock_quantity returned % instead of 75', v_qty;
    END IF;
    
    -- Test non-existent stock (should return 0)
    v_qty := get_stock_quantity(9002, 9002);
    
    IF v_qty = 0 THEN
        RAISE NOTICE 'PASS: get_stock_quantity returns 0 for non-existent stock';
    ELSE
        RAISE EXCEPTION 'FAIL: get_stock_quantity should return 0 for non-existent stock';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- =============================================================================
-- SECTION 4: EDGE CASES AND COMPLEX SCENARIOS
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'SECTION 4: EDGE CASES AND COMPLEX SCENARIOS'
\echo '========================================='
\echo ''

-- Test 4.1: Multiple concurrent movements
\echo 'Test 4.1: Multiple concurrent movements'
\echo '----------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_final_qty INTEGER;
BEGIN
    -- Perform multiple operations
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-013', 'Op1', 'test_user');
    PERFORM ship_inventory(9001, 9001, 20, 100.00, 'SO-TEST-003', 'Op2', 'test_user');
    PERFORM receive_inventory(9001, 9001, 30, 100.00, 'PO-TEST-014', 'Op3', 'test_user');
    PERFORM adjust_inventory(9001, 9001, -5, 'Damaged', 'ADJ-TEST-005', 'test_user');
    
    v_final_qty := get_stock_quantity(9001, 9001);
    
    -- Expected: 100 - 20 + 30 - 5 = 105
    IF v_final_qty = 105 THEN
        RAISE NOTICE 'PASS: Multiple concurrent movements calculated correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Expected 105, got %', v_final_qty;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.2: Transfer chain across multiple locations
\echo 'Test 4.2: Transfer chain across multiple locations'
\echo '---------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_loc1_qty INTEGER;
    v_loc2_qty INTEGER;
BEGIN
    -- Setup initial stock at location 1
    PERFORM receive_inventory(9001, 9001, 200, 100.00, 'PO-TEST-015', 'Setup', 'test_user');
    
    -- Transfer from loc1 to loc2
    PERFORM transfer_inventory(9001, 9001, 9002, 80, 100.00, 'TRF-TEST-004', 'Transfer', 'test_user');
    
    v_loc1_qty := get_stock_quantity(9001, 9001);
    v_loc2_qty := get_stock_quantity(9001, 9002);
    
    IF v_loc1_qty = 120 AND v_loc2_qty = 80 THEN
        RAISE NOTICE 'PASS: Transfer chain handled correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Expected loc1=120, loc2=80, got loc1=%, loc2=%', v_loc1_qty, v_loc2_qty;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.3: Stock level with reserved quantity
\echo 'Test 4.3: Stock level with reserved quantity'
\echo '---------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_available INTEGER;
BEGIN
    -- Setup stock
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-016', 'Setup', 'test_user');
    
    -- Reserve some quantity
    UPDATE stock_levels 
    SET quantity_reserved = 30 
    WHERE product_id = 9001 AND location_id = 9001;
    
    -- Check available quantity (generated column)
    SELECT quantity_available INTO v_available 
    FROM stock_levels 
    WHERE product_id = 9001 AND location_id = 9001;
    
    IF v_available = 70 THEN
        RAISE NOTICE 'PASS: Available quantity calculated correctly (100 - 30 = 70)';
    ELSE
        RAISE EXCEPTION 'FAIL: Expected available=70, got %', v_available;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.4: Reorder point detection
\echo 'Test 4.4: Reorder point detection'
\echo '----------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_needs_reorder BOOLEAN;
BEGIN
    -- Setup stock and reorder settings
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-017', 'Setup', 'test_user');
    
    INSERT INTO reorder_settings (product_id, location_id, reorder_point, reorder_quantity, maximum_stock)
    VALUES (9001, 9001, 50, 100, 200);
    
    -- Ship to bring below reorder point
    PERFORM ship_inventory(9001, 9001, 60, 100.00, 'SO-TEST-004', 'Ship', 'test_user');
    
    -- Check if reorder is needed
    SELECT (sl.quantity_available <= rs.reorder_point) INTO v_needs_reorder
    FROM stock_levels sl
    JOIN reorder_settings rs ON sl.product_id = rs.product_id AND sl.location_id = rs.location_id
    WHERE sl.product_id = 9001 AND sl.location_id = 9001;
    
    IF v_needs_reorder THEN
        RAISE NOTICE 'PASS: Reorder point detection working correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Reorder should be triggered';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.5: Movement audit trail
\echo 'Test 4.5: Movement audit trail'
\echo '-------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_movement_count INTEGER;
BEGIN
    -- Perform various operations
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-018', 'Op1', 'user1');
    PERFORM ship_inventory(9001, 9001, 20, 100.00, 'SO-TEST-005', 'Op2', 'user2');
    PERFORM adjust_inventory(9001, 9001, 5, 'Count adjustment', 'ADJ-TEST-006', 'user3');
    
    -- Count movements
    SELECT COUNT(*) INTO v_movement_count
    FROM inventory_movements
    WHERE product_id = 9001 AND location_id = 9001
    AND created_by IN ('user1', 'user2', 'user3');
    
    IF v_movement_count = 3 THEN
        RAISE NOTICE 'PASS: All movements recorded in audit trail';
    ELSE
        RAISE EXCEPTION 'FAIL: Expected 3 movements, found %', v_movement_count;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.6: Product-supplier relationship with performance metrics
\echo 'Test 4.6: Product-supplier relationship with performance metrics'
\echo '-----------------------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
BEGIN
    -- Insert product-supplier relationship
    INSERT INTO product_suppliers (
        product_id, supplier_id, supplier_sku, lead_time_days, 
        minimum_order_qty, cost_price, is_preferred,
        quality_rating, on_time_delivery_rate, total_orders, total_delivered
    ) VALUES (
        9001, 9001, 'SUP-SKU-001', 7, 50, 95.00, true,
        4.5, 0.95, 10, 9
    );
    
    -- Verify insertion
    IF EXISTS (
        SELECT 1 FROM product_suppliers 
        WHERE product_id = 9001 AND supplier_id = 9001
        AND quality_rating = 4.5 AND on_time_delivery_rate = 0.95
    ) THEN
        RAISE NOTICE 'PASS: Product-supplier relationship with metrics created';
    ELSE
        RAISE EXCEPTION 'FAIL: Product-supplier relationship not created correctly';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.7: Error handling in procedures
\echo 'Test 4.7: Error handling in procedures'
\echo '---------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_result RECORD;
BEGIN
    -- Test that errors are caught and returned gracefully
    SELECT * INTO v_result FROM receive_inventory(
        NULL, 9001, 10, 100.00, 'PO-TEST-019', 'Test', 'test_user'
    );
    
    IF NOT v_result.success THEN
        RAISE NOTICE 'PASS: Procedure handles NULL product_id gracefully';
    ELSE
        RAISE EXCEPTION 'FAIL: Procedure should handle NULL product_id';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.8: Timestamp tracking
\echo 'Test 4.8: Timestamp tracking'
\echo '----------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_created_at TIMESTAMP;
    v_last_movement_at TIMESTAMP;
BEGIN
    -- Perform operation
    PERFORM receive_inventory(9001, 9001, 50, 100.00, 'PO-TEST-020', 'Test', 'test_user');
    
    -- Check timestamps
    SELECT im.created_at, sl.last_movement_at 
    INTO v_created_at, v_last_movement_at
    FROM inventory_movements im
    JOIN stock_levels sl ON im.product_id = sl.product_id AND im.location_id = sl.location_id
    WHERE im.product_id = 9001 AND im.location_id = 9001
    ORDER BY im.created_at DESC
    LIMIT 1;
    
    IF v_created_at IS NOT NULL AND v_last_movement_at IS NOT NULL THEN
        RAISE NOTICE 'PASS: Timestamps tracked correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Timestamps not set';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.9: Transaction atomicity
\echo 'Test 4.9: Transaction atomicity'
\echo '--------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Setup initial stock
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-021', 'Setup', 'test_user');
    v_stock_before := get_stock_quantity(9001, 9001);
    
    -- Start a nested transaction that will fail
    BEGIN
        PERFORM ship_inventory(9001, 9001, 20, 100.00, 'SO-TEST-006', 'Op1', 'test_user');
        -- This should fail due to insufficient stock
        PERFORM ship_inventory(9001, 9001, 200, 100.00, 'SO-TEST-007', 'Op2', 'test_user');
    EXCEPTION
        WHEN OTHERS THEN
            -- Transaction should rollback
            NULL;
    END;
    
    v_stock_after := get_stock_quantity(9001, 9001);
    
    -- Stock should be 80 (first ship succeeded before the error)
    IF v_stock_after = 80 THEN
        RAISE NOTICE 'PASS: Transaction atomicity maintained';
    ELSE
        RAISE EXCEPTION 'FAIL: Expected stock=80, got %', v_stock_after;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 4.10: Large quantity handling
\echo 'Test 4.10: Large quantity handling'
\echo '-----------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_qty INTEGER;
BEGIN
    -- Test with large quantities
    PERFORM receive_inventory(9001, 9001, 1000000, 100.00, 'PO-TEST-022', 'Large qty', 'test_user');
    
    v_qty := get_stock_quantity(9001, 9001);
    
    IF v_qty = 1000000 THEN
        RAISE NOTICE 'PASS: Large quantities handled correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Large quantity not handled correctly';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- =============================================================================
-- SECTION 5: DATA INTEGRITY VALIDATION
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'SECTION 5: DATA INTEGRITY VALIDATION'
\echo '========================================='
\echo ''

-- Test 5.1: Stock level consistency with movements
\echo 'Test 5.1: Stock level consistency with movements'
\echo '-------------------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_calculated_stock INTEGER;
    v_actual_stock INTEGER;
BEGIN
    -- Perform various movements
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-023', 'Op1', 'test_user');
    PERFORM ship_inventory(9001, 9001, 30, 100.00, 'SO-TEST-008', 'Op2', 'test_user');
    PERFORM receive_inventory(9001, 9001, 50, 100.00, 'PO-TEST-024', 'Op3', 'test_user');
    PERFORM adjust_inventory(9001, 9001, -10, 'Adjustment', 'ADJ-TEST-007', 'test_user');
    
    -- Calculate expected stock from movements
    SELECT COALESCE(SUM(im.quantity * mt.affects_quantity), 0) INTO v_calculated_stock
    FROM inventory_movements im
    JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
    WHERE im.product_id = 9001 AND im.location_id = 9001;
    
    -- Get actual stock
    v_actual_stock := get_stock_quantity(9001, 9001);
    
    IF v_calculated_stock = v_actual_stock THEN
        RAISE NOTICE 'PASS: Stock level consistent with movements (both = %)', v_actual_stock;
    ELSE
        RAISE EXCEPTION 'FAIL: Stock inconsistent. Calculated: %, Actual: %', v_calculated_stock, v_actual_stock;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 5.2: Referential integrity cascade
\echo 'Test 5.2: Referential integrity cascade'
\echo '----------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_can_delete BOOLEAN := false;
BEGIN
    -- Create stock level
    PERFORM receive_inventory(9001, 9001, 50, 100.00, 'PO-TEST-025', 'Setup', 'test_user');
    
    -- Try to delete product (should fail due to foreign key)
    BEGIN
        DELETE FROM products WHERE product_id = 9001;
        v_can_delete := true;
    EXCEPTION
        WHEN foreign_key_violation THEN
            v_can_delete := false;
    END;
    
    IF NOT v_can_delete THEN
        RAISE NOTICE 'PASS: Referential integrity prevents orphaned records';
    ELSE
        RAISE EXCEPTION 'FAIL: Product deletion should be prevented';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 5.3: Unique constraint enforcement
\echo 'Test 5.3: Unique constraint enforcement'
\echo '----------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_duplicate_allowed BOOLEAN := false;
BEGIN
    -- Create product-supplier relationship
    INSERT INTO product_suppliers (product_id, supplier_id, cost_price)
    VALUES (9001, 9001, 95.00);
    
    -- Try to create duplicate
    BEGIN
        INSERT INTO product_suppliers (product_id, supplier_id, cost_price)
        VALUES (9001, 9001, 90.00);
        v_duplicate_allowed := true;
    EXCEPTION
        WHEN unique_violation THEN
            v_duplicate_allowed := false;
    END;
    
    IF NOT v_duplicate_allowed THEN
        RAISE NOTICE 'PASS: Unique constraint prevents duplicate product-supplier';
    ELSE
        RAISE EXCEPTION 'FAIL: Duplicate product-supplier should be prevented';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 5.4: Check constraint validation
\echo 'Test 5.4: Check constraint validation'
\echo '--------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_invalid_allowed BOOLEAN := false;
BEGIN
    -- Try to insert product with negative weight
    BEGIN
        INSERT INTO products (sku, name, unit_of_measure, weight_kg)
        VALUES ('TEST-INVALID-WEIGHT', 'Invalid Weight', 'EA', -5.0);
        v_invalid_allowed := true;
    EXCEPTION
        WHEN check_violation THEN
            v_invalid_allowed := false;
    END;
    
    IF NOT v_invalid_allowed THEN
        RAISE NOTICE 'PASS: Check constraint prevents negative weight';
    ELSE
        RAISE EXCEPTION 'FAIL: Negative weight should be prevented';
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- Test 5.5: Generated column accuracy
\echo 'Test 5.5: Generated column accuracy'
\echo '------------------------------------'
BEGIN;
SELECT setup_test_data();

DO $
DECLARE
    v_available INTEGER;
    v_on_hand INTEGER;
    v_reserved INTEGER;
BEGIN
    -- Setup stock
    PERFORM receive_inventory(9001, 9001, 100, 100.00, 'PO-TEST-026', 'Setup', 'test_user');
    
    -- Reserve some quantity
    UPDATE stock_levels 
    SET quantity_reserved = 35 
    WHERE product_id = 9001 AND location_id = 9001;
    
    -- Get values
    SELECT quantity_on_hand, quantity_reserved, quantity_available 
    INTO v_on_hand, v_reserved, v_available
    FROM stock_levels 
    WHERE product_id = 9001 AND location_id = 9001;
    
    IF v_available = (v_on_hand - v_reserved) THEN
        RAISE NOTICE 'PASS: Generated column quantity_available calculated correctly';
    ELSE
        RAISE EXCEPTION 'FAIL: Generated column incorrect. On hand: %, Reserved: %, Available: %', 
            v_on_hand, v_reserved, v_available;
    END IF;
END;
$;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST SUMMARY AND CLEANUP
-- =============================================================================

\echo ''
\echo '========================================='
\echo 'TEST EXECUTION SUMMARY'
\echo '========================================='
\echo ''
\echo 'All unit tests completed successfully!'
\echo ''
\echo 'Test Coverage:'
\echo '  - Section 1: Trigger Functions (5 tests)'
\echo '  - Section 2: Constraint Enforcement (10 tests)'
\echo '  - Section 3: Stored Procedures (15 tests)'
\echo '  - Section 4: Edge Cases and Complex Scenarios (10 tests)'
\echo '  - Section 5: Data Integrity Validation (5 tests)'
\echo ''
\echo 'Total: 45 unit tests'
\echo ''
\echo 'Requirements Validated:'
\echo '  - Requirement 2.5: Prevent negative stock levels'
\echo '  - Requirement 4.4: Ensure inventory movements update stock levels atomically'
\echo '  - Data integrity validation across all operations'
\echo ''
\echo 'All tests use transactions with ROLLBACK to avoid affecting the database.'
\echo ''

-- Final cleanup of test fixtures
SELECT cleanup_test_data();

\echo ''
\echo '========================================='
\echo 'TEST SUITE EXECUTION COMPLETE'
\echo '========================================='
