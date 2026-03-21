-- ============================================================================
-- MASTER SAMPLE DATA LOADER
-- ============================================================================
-- This script loads comprehensive sample data into the inventory management
-- system. It should be run AFTER the schema and procedures are created.
--
-- Prerequisites:
--   1. Database created
--   2. schema.sql executed (creates all tables)
--   3. inventory_procedures.sql executed (creates stored procedures)
--   4. Movement types inserted (from init_database.sql or below)
--
-- Usage:
--   psql -d inventory_management -f load_sample_data.sql
--
-- Or from psql prompt:
--   \i load_sample_data.sql
-- ============================================================================

\echo '============================================================================'
\echo 'Loading Comprehensive Sample Data for Inventory Management System'
\echo '============================================================================'
\echo ''

-- Ensure movement types exist (these are reference data, not sample data)
\echo 'Checking movement types...'
INSERT INTO movement_types (code, name, description, affects_quantity) VALUES 
    ('RECEIPT', 'Receipt', 'Goods received from supplier', 1),
    ('SALE', 'Sale', 'Goods sold to customer', -1),
    ('TRANSFER_IN', 'Transfer In', 'Goods transferred into location', 1),
    ('TRANSFER_OUT', 'Transfer Out', 'Goods transferred out of location', -1),
    ('ADJUSTMENT_POS', 'Positive Adjustment', 'Inventory count adjustment - increase', 1),
    ('ADJUSTMENT_NEG', 'Negative Adjustment', 'Inventory count adjustment - decrease', -1),
    ('RETURN', 'Return', 'Goods returned from customer', 1),
    ('DAMAGE', 'Damage', 'Goods damaged or written off', -1)
ON CONFLICT (code) DO NOTHING;

\echo 'Movement types ready.'
\echo ''

-- Load main sample data (categories, locations, suppliers, products, relationships, reorder settings)
\echo 'Loading categories, locations, suppliers, products, and relationships...'
\i sample_data.sql

\echo ''
\echo 'Loading inventory movements and transaction history...'
\i sample_data_movements.sql

\echo ''
\echo '============================================================================'
\echo 'Sample Data Loading Complete!'
\echo '============================================================================'
\echo ''
\echo 'Data Summary:'
\echo '-------------'

-- Display summary statistics
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Products: ' || COUNT(*) FROM products;
SELECT 'Locations: ' || COUNT(*) FROM locations;
SELECT 'Suppliers: ' || COUNT(*) FROM suppliers;
SELECT 'Product-Supplier Relationships: ' || COUNT(*) FROM product_suppliers;
SELECT 'Reorder Settings: ' || COUNT(*) FROM reorder_settings;
SELECT 'Inventory Movements: ' || COUNT(*) FROM inventory_movements;
SELECT 'Stock Levels (auto-generated): ' || COUNT(*) FROM stock_levels;

\echo ''
\echo 'Sample Queries to Explore the Data:'
\echo '-----------------------------------'
\echo '1. View current stock levels:'
\echo '   SELECT * FROM stock_levels ORDER BY product_id, location_id;'
\echo ''
\echo '2. Check low stock alerts:'
\echo '   SELECT p.sku, p.name, l.name as location, sl.quantity_available,'
\echo '          rs.reorder_point'
\echo '   FROM stock_levels sl'
\echo '   JOIN products p ON sl.product_id = p.product_id'
\echo '   JOIN locations l ON sl.location_id = l.location_id'
\echo '   JOIN reorder_settings rs ON sl.product_id = rs.product_id'
\echo '                            AND sl.location_id = rs.location_id'
\echo '   WHERE sl.quantity_available <= rs.reorder_point'
\echo '   ORDER BY p.sku;'
\echo ''
\echo '3. View recent inventory movements:'
\echo '   SELECT p.sku, l.name as location, mt.name as movement_type,'
\echo '          im.quantity, im.reference_document, im.created_at'
\echo '   FROM inventory_movements im'
\echo '   JOIN products p ON im.product_id = p.product_id'
\echo '   JOIN locations l ON im.location_id = l.location_id'
\echo '   JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id'
\echo '   ORDER BY im.created_at DESC'
\echo '   LIMIT 20;'
\echo ''
\echo '4. View supplier performance:'
\echo '   SELECT s.name, ps.quality_rating, ps.on_time_delivery_rate,'
\echo '          ps.total_orders, ps.total_delivered'
\echo '   FROM product_suppliers ps'
\echo '   JOIN suppliers s ON ps.supplier_id = s.supplier_id'
\echo '   WHERE ps.is_active = true'
\echo '   ORDER BY ps.quality_rating DESC, ps.on_time_delivery_rate DESC;'
\echo ''
\echo '============================================================================'
