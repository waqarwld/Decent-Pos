-- Test Script for Inventory Movement Procedures
-- Tests all stored procedures with various scenarios including error cases

-- =============================================================================
-- SETUP: Ensure we have test data
-- =============================================================================

-- This test assumes init_database.sql has been run
-- Products: 1=Laptop, 2=Mouse, 3=Paper
-- Locations: 1=Main Warehouse, 2=Secondary Warehouse

\echo '========================================='
\echo 'Testing Inventory Movement Procedures'
\echo '========================================='
\echo ''

-- =============================================================================
-- TEST 1: RECEIVE INVENTORY - Success Case
-- =============================================================================

\echo 'TEST 1: Receive Inventory - Success Case'
\echo '-----------------------------------------'

BEGIN;

-- Receive 50 laptops at main warehouse
SELECT * FROM receive_inventory(
    1,              -- product_id (Laptop)
    1,              -- location_id (Main Warehouse)
    50,             -- quantity
    800.00,         -- unit_cost
    'PO-2024-100',  -- reference_document
    'Initial stock receipt',  -- notes
    'test_user'     -- created_by
);

-- Verify stock level
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_on_hand,
    sl.quantity_available
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 1 AND sl.location_id = 1;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 2: RECEIVE INVENTORY - Error Cases
-- =============================================================================

\echo 'TEST 2: Receive Inventory - Error Cases'
\echo '----------------------------------------'

BEGIN;

-- Test negative quantity
\echo 'Test 2a: Negative quantity'
SELECT success, message FROM receive_inventory(
    1, 1, -10, 800.00, 'PO-2024-101', 'Test', 'test_user'
);

-- Test negative unit cost
\echo 'Test 2b: Negative unit cost'
SELECT success, message FROM receive_inventory(
    1, 1, 10, -800.00, 'PO-2024-102', 'Test', 'test_user'
);

-- Test invalid product
\echo 'Test 2c: Invalid product ID'
SELECT success, message FROM receive_inventory(
    99999, 1, 10, 800.00, 'PO-2024-103', 'Test', 'test_user'
);

-- Test invalid location
\echo 'Test 2d: Invalid location ID'
SELECT success, message FROM receive_inventory(
    1, 99999, 10, 800.00, 'PO-2024-104', 'Test', 'test_user'
);

-- Test empty created_by
\echo 'Test 2e: Empty created_by'
SELECT success, message FROM receive_inventory(
    1, 1, 10, 800.00, 'PO-2024-105', 'Test', ''
);

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 3: SHIP INVENTORY - Success Case
-- =============================================================================

\echo 'TEST 3: Ship Inventory - Success Case'
\echo '--------------------------------------'

BEGIN;

-- First receive some stock
SELECT * FROM receive_inventory(
    2, 1, 100, 25.00, 'PO-2024-200', 'Stock for shipping test', 'test_user'
);

-- Ship 30 mice
SELECT * FROM ship_inventory(
    2,              -- product_id (Mouse)
    1,              -- location_id (Main Warehouse)
    30,             -- quantity
    25.00,          -- unit_cost
    'SO-2024-200',  -- reference_document
    'Customer order',  -- notes
    'test_user'     -- created_by
);

-- Verify stock level (should be 70 remaining)
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_on_hand,
    sl.quantity_available
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 2 AND sl.location_id = 1;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 4: SHIP INVENTORY - Insufficient Stock
-- =============================================================================

\echo 'TEST 4: Ship Inventory - Insufficient Stock'
\echo '--------------------------------------------'

BEGIN;

-- Receive 20 items
SELECT * FROM receive_inventory(
    2, 1, 20, 25.00, 'PO-2024-201', 'Limited stock', 'test_user'
);

-- Try to ship 50 items (should fail)
\echo 'Attempting to ship more than available:'
SELECT success, message FROM ship_inventory(
    2, 1, 50, 25.00, 'SO-2024-201', 'Over-shipment attempt', 'test_user'
);

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 5: TRANSFER INVENTORY - Success Case
-- =============================================================================

\echo 'TEST 5: Transfer Inventory - Success Case'
\echo '------------------------------------------'

BEGIN;

-- Receive stock at main warehouse
SELECT * FROM receive_inventory(
    3, 1, 200, 5.00, 'PO-2024-300', 'Stock for transfer test', 'test_user'
);

-- Transfer 75 reams to secondary warehouse
SELECT * FROM transfer_inventory(
    3,              -- product_id (Paper)
    1,              -- from_location_id (Main Warehouse)
    2,              -- to_location_id (Secondary Warehouse)
    75,             -- quantity
    5.00,           -- unit_cost
    'TRF-2024-300', -- reference_document
    'Rebalancing stock',  -- notes
    'test_user'     -- created_by
);

-- Verify stock levels at both locations
\echo 'Stock levels after transfer:'
SELECT 
    p.sku,
    l.code as location,
    sl.quantity_on_hand,
    sl.quantity_available
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 3
ORDER BY l.location_id;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 6: TRANSFER INVENTORY - Error Cases
-- =============================================================================

\echo 'TEST 6: Transfer Inventory - Error Cases'
\echo '-----------------------------------------'

BEGIN;

-- Receive stock for testing
SELECT * FROM receive_inventory(
    1, 1, 30, 800.00, 'PO-2024-301', 'Stock for transfer error tests', 'test_user'
);

-- Test same source and destination
\echo 'Test 6a: Same source and destination'
SELECT success, message FROM transfer_inventory(
    1, 1, 1, 10, 800.00, 'TRF-2024-301', 'Test', 'test_user'
);

-- Test insufficient stock
\echo 'Test 6b: Insufficient stock'
SELECT success, message FROM transfer_inventory(
    1, 1, 2, 100, 800.00, 'TRF-2024-302', 'Test', 'test_user'
);

-- Test invalid source location
\echo 'Test 6c: Invalid source location'
SELECT success, message FROM transfer_inventory(
    1, 99999, 2, 10, 800.00, 'TRF-2024-303', 'Test', 'test_user'
);

-- Test invalid destination location
\echo 'Test 6d: Invalid destination location'
SELECT success, message FROM transfer_inventory(
    1, 1, 99999, 10, 800.00, 'TRF-2024-304', 'Test', 'test_user'
);

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 7: ADJUST INVENTORY - Positive Adjustment
-- =============================================================================

\echo 'TEST 7: Adjust Inventory - Positive Adjustment'
\echo '-----------------------------------------------'

BEGIN;

-- Receive initial stock
SELECT * FROM receive_inventory(
    1, 1, 40, 800.00, 'PO-2024-400', 'Initial stock', 'test_user'
);

\echo 'Stock before adjustment:'
SELECT quantity_on_hand FROM stock_levels WHERE product_id = 1 AND location_id = 1;

-- Positive adjustment (found extra items during count)
SELECT * FROM adjust_inventory(
    1,              -- product_id (Laptop)
    1,              -- location_id (Main Warehouse)
    5,              -- adjustment_quantity (positive)
    'Physical count found 5 additional units',  -- reason
    'ADJ-2024-400', -- reference_document
    'test_user'     -- created_by
);

\echo 'Stock after positive adjustment:'
SELECT quantity_on_hand FROM stock_levels WHERE product_id = 1 AND location_id = 1;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 8: ADJUST INVENTORY - Negative Adjustment
-- =============================================================================

\echo 'TEST 8: Adjust Inventory - Negative Adjustment'
\echo '-----------------------------------------------'

BEGIN;

-- Receive initial stock
SELECT * FROM receive_inventory(
    2, 1, 100, 25.00, 'PO-2024-401', 'Initial stock', 'test_user'
);

\echo 'Stock before adjustment:'
SELECT quantity_on_hand FROM stock_levels WHERE product_id = 2 AND location_id = 1;

-- Negative adjustment (damaged items)
SELECT * FROM adjust_inventory(
    2,              -- product_id (Mouse)
    1,              -- location_id (Main Warehouse)
    -8,             -- adjustment_quantity (negative)
    'Damaged units found during inspection',  -- reason
    'ADJ-2024-401', -- reference_document
    'test_user'     -- created_by
);

\echo 'Stock after negative adjustment:'
SELECT quantity_on_hand FROM stock_levels WHERE product_id = 2 AND location_id = 1;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 9: ADJUST INVENTORY - Error Cases
-- =============================================================================

\echo 'TEST 9: Adjust Inventory - Error Cases'
\echo '---------------------------------------'

BEGIN;

-- Receive stock for testing
SELECT * FROM receive_inventory(
    1, 1, 20, 800.00, 'PO-2024-402', 'Stock for adjustment error tests', 'test_user'
);

-- Test zero adjustment
\echo 'Test 9a: Zero adjustment'
SELECT success, message FROM adjust_inventory(
    1, 1, 0, 'Test', 'ADJ-2024-402', 'test_user'
);

-- Test empty reason
\echo 'Test 9b: Empty reason'
SELECT success, message FROM adjust_inventory(
    1, 1, 5, '', 'ADJ-2024-403', 'test_user'
);

-- Test insufficient stock for negative adjustment
\echo 'Test 9c: Insufficient stock for negative adjustment'
SELECT success, message FROM adjust_inventory(
    1, 1, -50, 'Over-adjustment', 'ADJ-2024-404', 'test_user'
);

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 10: ATOMIC TRANSACTION - Multiple Operations
-- =============================================================================

\echo 'TEST 10: Atomic Transaction - Multiple Operations'
\echo '--------------------------------------------------'

BEGIN;

-- Perform multiple operations in a transaction
\echo 'Performing multiple operations:'

-- Receive stock
SELECT success, message FROM receive_inventory(
    1, 1, 100, 800.00, 'PO-2024-500', 'Batch operations test', 'test_user'
);

-- Ship some
SELECT success, message FROM ship_inventory(
    1, 1, 25, 800.00, 'SO-2024-500', 'First shipment', 'test_user'
);

-- Transfer some
SELECT success, message FROM transfer_inventory(
    1, 1, 2, 30, 800.00, 'TRF-2024-500', 'Transfer to secondary', 'test_user'
);

-- Adjust
SELECT success, message FROM adjust_inventory(
    1, 1, -2, 'Damaged units', 'ADJ-2024-500', 'test_user'
);

-- Check final stock levels
\echo 'Final stock levels after all operations:'
SELECT 
    l.code as location,
    sl.quantity_on_hand
FROM stock_levels sl
JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 1
ORDER BY l.location_id;

-- Verify movement history
\echo 'Movement history:'
SELECT 
    mt.name as movement_type,
    im.quantity,
    l.code as location,
    im.reference_document
FROM inventory_movements im
JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
JOIN locations l ON im.location_id = l.location_id
WHERE im.product_id = 1
ORDER BY im.created_at;

ROLLBACK;
\echo ''

-- =============================================================================
-- TEST 11: CONCURRENT OPERATIONS SIMULATION
-- =============================================================================

\echo 'TEST 11: Concurrent Operations Simulation'
\echo '------------------------------------------'

BEGIN;

-- Setup initial stock
SELECT * FROM receive_inventory(
    2, 1, 200, 25.00, 'PO-2024-600', 'Concurrent test stock', 'test_user'
);

-- Simulate multiple users performing operations
\echo 'User 1 ships 50 units:'
SELECT success, new_stock_level FROM ship_inventory(
    2, 1, 50, 25.00, 'SO-2024-601', 'User 1 order', 'user1'
);

\echo 'User 2 ships 30 units:'
SELECT success, new_stock_level FROM ship_inventory(
    2, 1, 30, 25.00, 'SO-2024-602', 'User 2 order', 'user2'
);

\echo 'User 3 adjusts -5 units:'
SELECT success, new_stock_level FROM adjust_inventory(
    2, 1, -5, 'Damaged', 'ADJ-2024-601', 'user3'
);

\echo 'Final stock level (should be 115):'
SELECT quantity_on_hand FROM stock_levels WHERE product_id = 2 AND location_id = 1;

ROLLBACK;
\echo ''

-- =============================================================================
-- SUMMARY
-- =============================================================================

\echo '========================================='
\echo 'All Inventory Procedure Tests Completed'
\echo '========================================='
\echo ''
\echo 'Tests covered:'
\echo '  - Receive inventory (success and error cases)'
\echo '  - Ship inventory (success and insufficient stock)'
\echo '  - Transfer inventory (success and error cases)'
\echo '  - Adjust inventory (positive, negative, and error cases)'
\echo '  - Atomic transactions with multiple operations'
\echo '  - Concurrent operations simulation'
\echo ''
\echo 'All tests use transactions and rollback to avoid affecting the database.'
