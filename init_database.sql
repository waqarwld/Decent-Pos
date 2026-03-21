-- Database Initialization Script
-- Run this script to create the inventory management database and schema

-- Create database (run this as superuser if database doesn't exist)
-- CREATE DATABASE inventory_management;

-- Connect to the database
-- \c inventory_management;

-- Create the schema
\i schema.sql

-- Create inventory procedures
\i inventory_procedures.sql

-- Insert basic reference data
INSERT INTO categories (name, description) VALUES 
    ('Electronics', 'Electronic devices and components'),
    ('Office Supplies', 'General office and administrative supplies'),
    ('Raw Materials', 'Base materials for manufacturing'),
    ('Finished Goods', 'Completed products ready for sale');

-- Insert sample location types and locations
INSERT INTO locations (code, name, location_type) VALUES 
    ('WH001', 'Main Warehouse', 'warehouse'),
    ('WH002', 'Secondary Warehouse', 'warehouse');

-- Insert sample suppliers
INSERT INTO suppliers (code, name, contact_person, email, payment_terms) VALUES 
    ('SUP001', 'Tech Components Ltd', 'John Smith', 'john@techcomponents.com', 'Net 30'),
    ('SUP002', 'Office Pro Supply', 'Sarah Johnson', 'sarah@officepro.com', 'Net 15'),
    ('SUP003', 'Global Materials Inc', 'Mike Chen', 'mike@globalmaterials.com', 'Net 45');

-- Verify the setup
SELECT 'Categories created: ' || COUNT(*) FROM categories;
SELECT 'Locations created: ' || COUNT(*) FROM locations;
SELECT 'Suppliers created: ' || COUNT(*) FROM suppliers;
-- In
sert movement types
INSERT INTO movement_types (code, name, description, affects_quantity) VALUES 
    ('RECEIPT', 'Receipt', 'Goods received from supplier', 1),
    ('SALE', 'Sale', 'Goods sold to customer', -1),
    ('TRANSFER_IN', 'Transfer In', 'Goods transferred into location', 1),
    ('TRANSFER_OUT', 'Transfer Out', 'Goods transferred out of location', -1),
    ('ADJUSTMENT_POS', 'Positive Adjustment', 'Inventory count adjustment - increase', 1),
    ('ADJUSTMENT_NEG', 'Negative Adjustment', 'Inventory count adjustment - decrease', -1),
    ('RETURN', 'Return', 'Goods returned from customer', 1),
    ('DAMAGE', 'Damage', 'Goods damaged or written off', -1);

-- Insert sample products for testing stock management
INSERT INTO products (sku, name, description, category_id, unit_of_measure, cost_price, selling_price) VALUES 
    ('LAPTOP001', 'Business Laptop Model X1', 'High-performance business laptop', 1, 'each', 800.00, 1200.00),
    ('MOUSE001', 'Wireless Mouse Pro', 'Ergonomic wireless mouse', 1, 'each', 25.00, 45.00),
    ('PAPER001', 'A4 Copy Paper', 'White A4 copy paper 500 sheets', 2, 'ream', 5.00, 8.00);

-- Insert sample reorder settings
INSERT INTO reorder_settings (product_id, location_id, reorder_point, reorder_quantity, maximum_stock) VALUES 
    (1, 1, 10, 50, 100),  -- Laptop: reorder 50 when stock hits 10, max 100
    (2, 1, 25, 100, 200), -- Mouse: reorder 100 when stock hits 25, max 200
    (3, 1, 50, 200, 500), -- Paper: reorder 200 when stock hits 50, max 500
    (1, 2, 5, 25, 50),    -- Laptop at secondary warehouse
    (2, 2, 15, 50, 100);  -- Mouse at secondary warehouse

-- Insert sample product-supplier relationships
INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, lead_time_days, minimum_order_qty, cost_price, is_preferred, quality_rating, on_time_delivery_rate, total_orders, total_delivered) VALUES 
    -- Laptop suppliers
    (1, 1, 'TC-LAPTOP-X1', 14, 10, 800.00, true, 4.5, 0.95, 12, 11),   -- Tech Components (preferred)
    (1, 3, 'GM-LAPTOP-BUS', 21, 5, 820.00, false, 4.2, 0.88, 8, 7),    -- Global Materials (alternative)
    
    -- Mouse suppliers  
    (2, 1, 'TC-MOUSE-PRO', 7, 50, 25.00, true, 4.8, 0.98, 24, 24),     -- Tech Components (preferred)
    (2, 2, 'OP-MOUSE-WIRELESS', 10, 25, 27.00, false, 4.3, 0.92, 15, 14), -- Office Pro (alternative)
    
    -- Paper suppliers
    (3, 2, 'OP-PAPER-A4-500', 3, 100, 5.00, true, 4.6, 0.96, 36, 35),  -- Office Pro (preferred)
    (3, 3, 'GM-PAPER-COPY', 5, 200, 4.80, false, 4.4, 0.94, 20, 19);   -- Global Materials (alternative)

-- Verify stock management setup
SELECT 'Movement types created: ' || COUNT(*) FROM movement_types;
SELECT 'Products created: ' || COUNT(*) FROM products;
SELECT 'Reorder settings created: ' || COUNT(*) FROM reorder_settings;
SELECT 'Product-supplier relationships created: ' || COUNT(*) FROM product_suppliers;