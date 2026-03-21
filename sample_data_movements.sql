-- ============================================================================
-- INVENTORY MOVEMENTS - Comprehensive transaction history
-- ============================================================================
-- This file contains sample inventory movements demonstrating all transaction
-- types and creating realistic stock levels across multiple locations.
-- Run this AFTER sample_data.sql
-- ============================================================================

-- Note: Movement types are already created in init_database.sql:
-- 1 = RECEIPT (affects_quantity = 1)
-- 2 = SALE (affects_quantity = -1)
-- 3 = TRANSFER_IN (affects_quantity = 1)
-- 4 = TRANSFER_OUT (affects_quantity = -1)
-- 5 = ADJUSTMENT_POS (affects_quantity = 1)
-- 6 = ADJUSTMENT_NEG (affects_quantity = -1)
-- 7 = RETURN (affects_quantity = 1)
-- 8 = DAMAGE (affects_quantity = -1)

-- ============================================================================
-- INITIAL RECEIPTS - Stock the warehouses (December 2023)
-- ============================================================================

-- Electronics - Laptops and Desktops (Main Warehouse)
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(1, 1, 1, 50, 850.00, 'PO-2023-1001', 'Initial stock - ProBook Laptops', 'system', '2023-12-01 09:00:00'),
(2, 1, 1, 75, 650.00, 'PO-2023-1002', 'Initial stock - UltraSlim Laptops', 'system', '2023-12-01 09:15:00'),
(3, 1, 1, 30, 1200.00, 'PO-2023-1003', 'Initial stock - WorkStation Desktops', 'system', '2023-12-01 09:30:00'),
(4, 1, 1, 100, 400.00, 'PO-2023-1004', 'Initial stock - Office Desktops', 'system', '2023-12-01 09:45:00'),

-- Peripherals (Main Warehouse - high volume)
(5, 1, 1, 300, 28.00, 'PO-2023-1005', 'Initial stock - Wireless Mice', 'system', '2023-12-01 10:00:00'),
(6, 1, 1, 200, 85.00, 'PO-2023-1006', 'Initial stock - Mechanical Keyboards', 'system', '2023-12-01 10:15:00'),
(7, 1, 1, 80, 320.00, 'PO-2023-1007', 'Initial stock - 27" Monitors', 'system', '2023-12-01 10:30:00'),
(8, 1, 1, 250, 45.00, 'PO-2023-1008', 'Initial stock - HD Webcams', 'system', '2023-12-01 10:45:00'),
(9, 1, 1, 150, 65.00, 'PO-2023-1009', 'Initial stock - Headsets', 'system', '2023-12-01 11:00:00'),

-- Networking Equipment (Main Warehouse)
(10, 1, 1, 60, 120.00, 'PO-2023-1010', 'Initial stock - WiFi Routers', 'system', '2023-12-01 11:15:00'),
(11, 1, 1, 35, 280.00, 'PO-2023-1011', 'Initial stock - 24-Port Switches', 'system', '2023-12-01 11:30:00'),
(12, 1, 1, 600, 5.50, 'PO-2023-1012', 'Initial stock - Cat6 Cables', 'system', '2023-12-01 11:45:00'),

-- Components (Main Warehouse)
(13, 1, 1, 400, 45.00, 'PO-2023-1013', 'Initial stock - 16GB RAM', 'system', '2023-12-01 12:00:00'),
(14, 1, 1, 300, 85.00, 'PO-2023-1014', 'Initial stock - 1TB SSDs', 'system', '2023-12-01 12:15:00'),
(15, 1, 1, 150, 95.00, 'PO-2023-1015', 'Initial stock - 750W PSUs', 'system', '2023-12-01 12:30:00'),

-- Office Supplies - Paper Products (Main Warehouse - very high volume)
(16, 1, 1, 1200, 4.50, 'PO-2023-1016', 'Initial stock - A4 Paper', 'system', '2023-12-01 13:00:00'),
(17, 1, 1, 800, 5.00, 'PO-2023-1017', 'Initial stock - Legal Paper', 'system', '2023-12-01 13:15:00'),
(18, 1, 1, 500, 3.20, 'PO-2023-1018', 'Initial stock - Spiral Notebooks', 'system', '2023-12-01 13:30:00'),
(19, 1, 1, 800, 4.80, 'PO-2023-1019', 'Initial stock - Sticky Notes', 'system', '2023-12-01 13:45:00'),

-- Writing Instruments (Main Warehouse)
(20, 1, 1, 1500, 3.60, 'PO-2023-1020', 'Initial stock - Ballpoint Pens', 'system', '2023-12-01 14:00:00'),
(21, 1, 1, 600, 8.50, 'PO-2023-1021', 'Initial stock - Gel Pen Sets', 'system', '2023-12-01 14:15:00'),
(22, 1, 1, 900, 5.20, 'PO-2023-1022', 'Initial stock - Whiteboard Markers', 'system', '2023-12-01 14:30:00'),
(23, 1, 1, 800, 4.80, 'PO-2023-1023', 'Initial stock - Highlighters', 'system', '2023-12-01 14:45:00'),

-- Filing & Storage (Main Warehouse)
(24, 1, 1, 400, 12.00, 'PO-2023-1024', 'Initial stock - Manila Folders', 'system', '2023-12-01 15:00:00'),
(25, 1, 1, 450, 6.50, 'PO-2023-1025', 'Initial stock - 3-Ring Binders', 'system', '2023-12-01 15:15:00'),
(26, 1, 1, 350, 4.20, 'PO-2023-1026', 'Initial stock - Storage Boxes', 'system', '2023-12-01 15:30:00'),

-- Desk Accessories (Main Warehouse)
(27, 1, 1, 300, 12.50, 'PO-2023-1027', 'Initial stock - Heavy Duty Staplers', 'system', '2023-12-01 15:45:00'),
(28, 1, 1, 380, 5.80, 'PO-2023-1028', 'Initial stock - Tape Dispensers', 'system', '2023-12-01 16:00:00'),
(29, 1, 1, 250, 8.90, 'PO-2023-1029', 'Initial stock - Desk Organizers', 'system', '2023-12-01 16:15:00'),

-- Raw Materials - Metals (Zone C)
(30, 7, 1, 100, 185.00, 'PO-2023-1030', 'Initial stock - Aluminum Sheets', 'system', '2023-12-02 09:00:00'),
(31, 7, 1, 200, 42.00, 'PO-2023-1031', 'Initial stock - Steel Bars', 'system', '2023-12-02 09:30:00'),
(32, 7, 1, 150, 95.00, 'PO-2023-1032', 'Initial stock - Copper Wire', 'system', '2023-12-02 10:00:00'),

-- Raw Materials - Plastics (Zone C)
(33, 7, 1, 400, 62.50, 'PO-2023-1033', 'Initial stock - ABS Pellets', 'system', '2023-12-02 10:30:00'),
(34, 7, 1, 120, 145.00, 'PO-2023-1034', 'Initial stock - Acrylic Sheets', 'system', '2023-12-02 11:00:00'),
(35, 7, 1, 500, 18.50, 'PO-2023-1035', 'Initial stock - PVC Pipes', 'system', '2023-12-02 11:30:00'),

-- Raw Materials - Textiles (Zone C)
(36, 7, 1, 80, 225.00, 'PO-2023-1036', 'Initial stock - Cotton Canvas', 'system', '2023-12-02 12:00:00'),
(37, 7, 1, 700, 12.50, 'PO-2023-1037', 'Initial stock - Polyester Thread', 'system', '2023-12-02 12:30:00'),

-- Tools - Hand Tools (Main Warehouse)
(38, 1, 1, 200, 18.50, 'PO-2023-1038', 'Initial stock - Screwdriver Sets', 'system', '2023-12-02 13:00:00'),
(39, 1, 1, 220, 14.20, 'PO-2023-1039', 'Initial stock - Adjustable Wrenches', 'system', '2023-12-02 13:30:00'),
(40, 1, 1, 250, 16.80, 'PO-2023-1040', 'Initial stock - Claw Hammers', 'system', '2023-12-02 14:00:00'),
(41, 1, 1, 180, 22.50, 'PO-2023-1041', 'Initial stock - Pliers Sets', 'system', '2023-12-02 14:30:00'),

-- Tools - Power Tools (Main Warehouse)
(42, 1, 1, 100, 95.00, 'PO-2023-1042', 'Initial stock - Cordless Drills', 'system', '2023-12-02 15:00:00'),
(43, 1, 1, 80, 78.00, 'PO-2023-1043', 'Initial stock - Circular Saws', 'system', '2023-12-02 15:30:00'),
(44, 1, 1, 120, 42.00, 'PO-2023-1044', 'Initial stock - Angle Grinders', 'system', '2023-12-02 16:00:00'),

-- Safety Equipment (Main Warehouse - critical stock)
(45, 1, 1, 800, 8.50, 'PO-2023-1045', 'Initial stock - Work Gloves', 'system', '2023-12-03 09:00:00'),
(46, 1, 1, 1200, 4.20, 'PO-2023-1046', 'Initial stock - Safety Glasses', 'system', '2023-12-03 09:30:00'),
(47, 1, 1, 400, 12.00, 'PO-2023-1047', 'Initial stock - Ear Plugs', 'system', '2023-12-03 10:00:00'),
(48, 1, 1, 500, 6.80, 'PO-2023-1048', 'Initial stock - Safety Vests', 'system', '2023-12-03 10:30:00');

-- ============================================================================
-- TRANSFERS TO REGIONAL WAREHOUSES (December 2023)
-- ============================================================================

-- Transfer electronics to West Warehouse
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(1, 1, 4, 20, 850.00, 'TRF-2023-001', 'Transfer out to West Warehouse', 'john.smith', '2023-12-05 10:00:00'),
(1, 2, 3, 20, 850.00, 'TRF-2023-001', 'Transfer in from Main Warehouse', 'john.smith', '2023-12-05 10:00:00'),
(2, 1, 4, 30, 650.00, 'TRF-2023-002', 'Transfer out to West Warehouse', 'john.smith', '2023-12-05 10:30:00'),
(2, 2, 3, 30, 650.00, 'TRF-2023-002', 'Transfer in from Main Warehouse', 'john.smith', '2023-12-05 10:30:00'),
(5, 1, 4, 100, 28.00, 'TRF-2023-003', 'Transfer out to West Warehouse', 'john.smith', '2023-12-05 11:00:00'),
(5, 2, 3, 100, 28.00, 'TRF-2023-003', 'Transfer in from Main Warehouse', 'john.smith', '2023-12-05 11:00:00'),

-- Transfer electronics to East Warehouse
(1, 1, 4, 20, 850.00, 'TRF-2023-004', 'Transfer out to East Warehouse', 'sarah.jones', '2023-12-05 14:00:00'),
(1, 3, 3, 20, 850.00, 'TRF-2023-004', 'Transfer in from Main Warehouse', 'sarah.jones', '2023-12-05 14:00:00'),
(2, 1, 4, 30, 650.00, 'TRF-2023-005', 'Transfer out to East Warehouse', 'sarah.jones', '2023-12-05 14:30:00'),
(2, 3, 3, 30, 650.00, 'TRF-2023-005', 'Transfer in from Main Warehouse', 'sarah.jones', '2023-12-05 14:30:00'),
(5, 1, 4, 100, 28.00, 'TRF-2023-006', 'Transfer out to East Warehouse', 'sarah.jones', '2023-12-05 15:00:00'),
(5, 3, 3, 100, 28.00, 'TRF-2023-006', 'Transfer in from Main Warehouse', 'sarah.jones', '2023-12-05 15:00:00'),

-- Transfer office supplies to West Warehouse
(16, 1, 4, 400, 4.50, 'TRF-2023-007', 'Transfer out to West Warehouse', 'mike.wilson', '2023-12-06 09:00:00'),
(16, 2, 3, 400, 4.50, 'TRF-2023-007', 'Transfer in from Main Warehouse', 'mike.wilson', '2023-12-06 09:00:00'),
(20, 1, 4, 500, 3.60, 'TRF-2023-008', 'Transfer out to West Warehouse', 'mike.wilson', '2023-12-06 09:30:00'),
(20, 2, 3, 500, 3.60, 'TRF-2023-008', 'Transfer in from Main Warehouse', 'mike.wilson', '2023-12-06 09:30:00');


-- ============================================================================
-- SALES TRANSACTIONS (December 2023 - January 2024)
-- ============================================================================

-- Electronics sales - varied quantities and dates
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
-- Laptop sales
(1, 1, 2, 5, 850.00, 'SO-2023-2001', 'Corporate order - 5 ProBook laptops', 'sales.team', '2023-12-10 11:00:00'),
(1, 2, 2, 3, 850.00, 'SO-2023-2002', 'Small business order', 'sales.team', '2023-12-12 14:30:00'),
(2, 1, 2, 8, 650.00, 'SO-2023-2003', 'Education sector order', 'sales.team', '2023-12-15 10:00:00'),
(2, 3, 2, 5, 650.00, 'SO-2023-2004', 'Retail customer order', 'sales.team', '2023-12-18 15:45:00'),
(3, 1, 2, 4, 1200.00, 'SO-2023-2005', 'Engineering firm order', 'sales.team', '2023-12-20 09:30:00'),
(4, 1, 2, 12, 400.00, 'SO-2023-2006', 'Office setup - 12 desktops', 'sales.team', '2023-12-22 13:00:00'),

-- Peripheral sales - higher volume
(5, 1, 2, 45, 28.00, 'SO-2023-2007', 'Bulk order - wireless mice', 'sales.team', '2023-12-11 10:00:00'),
(5, 2, 2, 20, 28.00, 'SO-2023-2008', 'Retail order', 'sales.team', '2023-12-14 11:30:00'),
(5, 3, 2, 25, 28.00, 'SO-2023-2009', 'Corporate accessories order', 'sales.team', '2023-12-16 14:00:00'),
(6, 1, 2, 30, 85.00, 'SO-2023-2010', 'Gaming setup order', 'sales.team', '2023-12-13 15:00:00'),
(7, 1, 2, 15, 320.00, 'SO-2023-2011', 'Office monitor upgrade', 'sales.team', '2023-12-17 10:30:00'),
(8, 1, 2, 40, 45.00, 'SO-2023-2012', 'Remote work setup', 'sales.team', '2023-12-19 12:00:00'),
(9, 1, 2, 25, 65.00, 'SO-2023-2013', 'Call center equipment', 'sales.team', '2023-12-21 09:00:00'),

-- Networking equipment sales
(10, 1, 2, 8, 120.00, 'SO-2023-2014', 'Small office network setup', 'sales.team', '2023-12-14 13:30:00'),
(11, 1, 2, 3, 280.00, 'SO-2023-2015', 'Enterprise network expansion', 'sales.team', '2023-12-23 11:00:00'),
(12, 1, 2, 150, 5.50, 'SO-2023-2016', 'Cabling project', 'sales.team', '2023-12-15 14:00:00'),

-- Component sales
(13, 1, 2, 60, 45.00, 'SO-2023-2017', 'PC builder order - RAM', 'sales.team', '2023-12-16 10:00:00'),
(14, 1, 2, 45, 85.00, 'SO-2023-2018', 'PC builder order - SSDs', 'sales.team', '2023-12-16 10:15:00'),
(15, 1, 2, 20, 95.00, 'SO-2023-2019', 'PC builder order - PSUs', 'sales.team', '2023-12-16 10:30:00'),

-- Office supplies sales - very high volume
(16, 1, 2, 200, 4.50, 'SO-2023-2020', 'Corporate office supplies', 'sales.team', '2023-12-12 09:00:00'),
(16, 2, 2, 80, 4.50, 'SO-2023-2021', 'School district order', 'sales.team', '2023-12-13 10:00:00'),
(16, 1, 2, 150, 4.50, 'SO-2023-2022', 'Government office order', 'sales.team', '2023-12-18 11:00:00'),
(17, 1, 2, 100, 5.00, 'SO-2023-2023', 'Law firm supplies', 'sales.team', '2023-12-19 14:00:00'),
(18, 1, 2, 80, 3.20, 'SO-2023-2024', 'Back to school order', 'sales.team', '2023-12-20 10:00:00'),
(19, 1, 2, 120, 4.80, 'SO-2023-2025', 'Office supplies bulk', 'sales.team', '2023-12-21 11:00:00'),

-- Writing instruments sales
(20, 1, 2, 300, 3.60, 'SO-2023-2026', 'Bulk pen order', 'sales.team', '2023-12-14 09:00:00'),
(20, 2, 2, 150, 3.60, 'SO-2023-2027', 'Retail pen order', 'sales.team', '2023-12-17 10:00:00'),
(21, 1, 2, 100, 8.50, 'SO-2023-2028', 'Premium pen sets', 'sales.team', '2023-12-15 11:00:00'),
(22, 1, 2, 150, 5.20, 'SO-2023-2029', 'Whiteboard supplies', 'sales.team', '2023-12-16 12:00:00'),
(23, 1, 2, 120, 4.80, 'SO-2023-2030', 'Highlighter order', 'sales.team', '2023-12-18 13:00:00'),

-- Filing & storage sales
(24, 1, 2, 80, 12.00, 'SO-2023-2031', 'Filing system setup', 'sales.team', '2023-12-19 09:00:00'),
(25, 1, 2, 90, 6.50, 'SO-2023-2032', 'Binder bulk order', 'sales.team', '2023-12-20 10:00:00'),
(26, 1, 2, 60, 4.20, 'SO-2023-2033', 'Storage boxes order', 'sales.team', '2023-12-21 11:00:00'),

-- Desk accessories sales
(27, 1, 2, 50, 12.50, 'SO-2023-2034', 'Office setup accessories', 'sales.team', '2023-12-22 09:00:00'),
(28, 1, 2, 70, 5.80, 'SO-2023-2035', 'Tape dispenser order', 'sales.team', '2023-12-22 10:00:00'),
(29, 1, 2, 40, 8.90, 'SO-2023-2036', 'Desk organizer order', 'sales.team', '2023-12-22 11:00:00'),

-- Raw materials sales
(30, 7, 2, 25, 185.00, 'SO-2023-2037', 'Manufacturing order - aluminum', 'sales.team', '2023-12-15 14:00:00'),
(31, 7, 2, 50, 42.00, 'SO-2023-2038', 'Construction order - steel', 'sales.team', '2023-12-16 15:00:00'),
(33, 7, 2, 100, 62.50, 'SO-2023-2039', 'Injection molding order', 'sales.team', '2023-12-18 13:00:00'),
(35, 7, 2, 120, 18.50, 'SO-2023-2040', 'Plumbing contractor order', 'sales.team', '2023-12-19 14:00:00'),

-- Tool sales
(38, 1, 2, 40, 18.50, 'SO-2023-2041', 'Contractor tool order', 'sales.team', '2023-12-20 10:00:00'),
(39, 1, 2, 35, 14.20, 'SO-2023-2042', 'Maintenance tools', 'sales.team', '2023-12-20 11:00:00'),
(40, 1, 2, 45, 16.80, 'SO-2023-2043', 'Construction tools', 'sales.team', '2023-12-20 12:00:00'),
(42, 1, 2, 15, 95.00, 'SO-2023-2044', 'Power tool order', 'sales.team', '2023-12-21 10:00:00'),
(43, 1, 2, 12, 78.00, 'SO-2023-2045', 'Carpentry tools', 'sales.team', '2023-12-21 11:00:00'),

-- Safety equipment sales - critical items
(45, 1, 2, 150, 8.50, 'SO-2023-2046', 'Construction site safety', 'sales.team', '2023-12-22 09:00:00'),
(46, 1, 2, 200, 4.20, 'SO-2023-2047', 'Safety glasses bulk order', 'sales.team', '2023-12-22 10:00:00'),
(47, 1, 2, 80, 12.00, 'SO-2023-2048', 'Hearing protection order', 'sales.team', '2023-12-22 11:00:00'),
(48, 1, 2, 100, 6.80, 'SO-2023-2049', 'Hi-vis vest order', 'sales.team', '2023-12-22 12:00:00');


-- ============================================================================
-- REPLENISHMENT RECEIPTS (January 2024)
-- ============================================================================

-- Restock electronics after holiday sales
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(1, 1, 1, 30, 850.00, 'PO-2024-0001', 'Restock ProBook laptops', 'purchasing', '2024-01-08 10:00:00'),
(2, 1, 1, 40, 650.00, 'PO-2024-0002', 'Restock UltraSlim laptops', 'purchasing', '2024-01-08 10:30:00'),
(4, 1, 1, 50, 400.00, 'PO-2024-0003', 'Restock office desktops', 'purchasing', '2024-01-08 11:00:00'),
(5, 1, 1, 150, 28.00, 'PO-2024-0004', 'Restock wireless mice', 'purchasing', '2024-01-09 09:00:00'),
(6, 1, 1, 100, 85.00, 'PO-2024-0005', 'Restock keyboards', 'purchasing', '2024-01-09 09:30:00'),
(7, 1, 1, 40, 320.00, 'PO-2024-0006', 'Restock monitors', 'purchasing', '2024-01-09 10:00:00'),
(8, 1, 1, 150, 45.00, 'PO-2024-0007', 'Restock webcams', 'purchasing', '2024-01-09 10:30:00'),
(9, 1, 1, 80, 65.00, 'PO-2024-0008', 'Restock headsets', 'purchasing', '2024-01-09 11:00:00'),

-- Restock components
(13, 1, 1, 200, 45.00, 'PO-2024-0009', 'Restock RAM modules', 'purchasing', '2024-01-10 09:00:00'),
(14, 1, 1, 150, 85.00, 'PO-2024-0010', 'Restock SSDs', 'purchasing', '2024-01-10 09:30:00'),
(15, 1, 1, 75, 95.00, 'PO-2024-0011', 'Restock power supplies', 'purchasing', '2024-01-10 10:00:00'),

-- Restock office supplies - high volume
(16, 1, 1, 500, 4.50, 'PO-2024-0012', 'Restock A4 paper', 'purchasing', '2024-01-11 08:00:00'),
(17, 1, 1, 400, 5.00, 'PO-2024-0013', 'Restock legal paper', 'purchasing', '2024-01-11 08:30:00'),
(18, 1, 1, 250, 3.20, 'PO-2024-0014', 'Restock notebooks', 'purchasing', '2024-01-11 09:00:00'),
(19, 1, 1, 400, 4.80, 'PO-2024-0015', 'Restock sticky notes', 'purchasing', '2024-01-11 09:30:00'),
(20, 1, 1, 800, 3.60, 'PO-2024-0016', 'Restock ballpoint pens', 'purchasing', '2024-01-11 10:00:00'),
(21, 1, 1, 300, 8.50, 'PO-2024-0017', 'Restock gel pens', 'purchasing', '2024-01-11 10:30:00'),
(22, 1, 1, 450, 5.20, 'PO-2024-0018', 'Restock whiteboard markers', 'purchasing', '2024-01-11 11:00:00'),
(23, 1, 1, 400, 4.80, 'PO-2024-0019', 'Restock highlighters', 'purchasing', '2024-01-11 11:30:00'),

-- Restock filing & storage
(24, 1, 1, 200, 12.00, 'PO-2024-0020', 'Restock manila folders', 'purchasing', '2024-01-12 09:00:00'),
(25, 1, 1, 225, 6.50, 'PO-2024-0021', 'Restock binders', 'purchasing', '2024-01-12 09:30:00'),
(26, 1, 1, 175, 4.20, 'PO-2024-0022', 'Restock storage boxes', 'purchasing', '2024-01-12 10:00:00'),

-- Restock desk accessories
(27, 1, 1, 150, 12.50, 'PO-2024-0023', 'Restock staplers', 'purchasing', '2024-01-12 10:30:00'),
(28, 1, 1, 190, 5.80, 'PO-2024-0024', 'Restock tape dispensers', 'purchasing', '2024-01-12 11:00:00'),
(29, 1, 1, 125, 8.90, 'PO-2024-0025', 'Restock desk organizers', 'purchasing', '2024-01-12 11:30:00'),

-- Restock raw materials
(30, 7, 1, 50, 185.00, 'PO-2024-0026', 'Restock aluminum sheets', 'purchasing', '2024-01-13 09:00:00'),
(31, 7, 1, 100, 42.00, 'PO-2024-0027', 'Restock steel bars', 'purchasing', '2024-01-13 10:00:00'),
(33, 7, 1, 200, 62.50, 'PO-2024-0028', 'Restock ABS pellets', 'purchasing', '2024-01-13 11:00:00'),
(35, 7, 1, 200, 18.50, 'PO-2024-0029', 'Restock PVC pipes', 'purchasing', '2024-01-13 12:00:00'),

-- Restock tools
(38, 1, 1, 100, 18.50, 'PO-2024-0030', 'Restock screwdriver sets', 'purchasing', '2024-01-14 09:00:00'),
(39, 1, 1, 110, 14.20, 'PO-2024-0031', 'Restock wrenches', 'purchasing', '2024-01-14 09:30:00'),
(40, 1, 1, 125, 16.80, 'PO-2024-0032', 'Restock hammers', 'purchasing', '2024-01-14 10:00:00'),
(42, 1, 1, 50, 95.00, 'PO-2024-0033', 'Restock cordless drills', 'purchasing', '2024-01-14 10:30:00'),
(43, 1, 1, 40, 78.00, 'PO-2024-0034', 'Restock circular saws', 'purchasing', '2024-01-14 11:00:00'),

-- Restock safety equipment - critical
(45, 1, 1, 400, 8.50, 'PO-2024-0035', 'Restock work gloves', 'purchasing', '2024-01-15 08:00:00'),
(46, 1, 1, 600, 4.20, 'PO-2024-0036', 'Restock safety glasses', 'purchasing', '2024-01-15 08:30:00'),
(47, 1, 1, 200, 12.00, 'PO-2024-0037', 'Restock ear plugs', 'purchasing', '2024-01-15 09:00:00'),
(48, 1, 1, 250, 6.80, 'PO-2024-0038', 'Restock safety vests', 'purchasing', '2024-01-15 09:30:00');

-- ============================================================================
-- CUSTOMER RETURNS (January 2024)
-- ============================================================================

-- Electronics returns - various reasons
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(1, 4, 7, 2, 850.00, 'RMA-2024-001', 'Customer return - wrong model ordered', 'returns.dept', '2024-01-10 14:00:00'),
(2, 4, 7, 1, 650.00, 'RMA-2024-002', 'Customer return - changed mind', 'returns.dept', '2024-01-12 10:30:00'),
(5, 4, 7, 8, 28.00, 'RMA-2024-003', 'Customer return - defective units', 'returns.dept', '2024-01-13 11:00:00'),
(6, 4, 7, 3, 85.00, 'RMA-2024-004', 'Customer return - not as described', 'returns.dept', '2024-01-14 15:30:00'),
(7, 4, 7, 1, 320.00, 'RMA-2024-005', 'Customer return - dead pixels', 'returns.dept', '2024-01-15 09:45:00'),
(8, 4, 7, 5, 45.00, 'RMA-2024-006', 'Customer return - compatibility issues', 'returns.dept', '2024-01-16 13:20:00'),

-- Office supplies returns - less common
(20, 4, 7, 50, 3.60, 'RMA-2024-007', 'Customer return - wrong color', 'returns.dept', '2024-01-17 10:00:00'),
(22, 4, 7, 20, 5.20, 'RMA-2024-008', 'Customer return - dried out markers', 'returns.dept', '2024-01-18 11:30:00'),

-- Tool returns
(42, 4, 7, 2, 95.00, 'RMA-2024-009', 'Customer return - warranty claim', 'returns.dept', '2024-01-19 14:00:00'),
(43, 4, 7, 1, 78.00, 'RMA-2024-010', 'Customer return - defective blade guard', 'returns.dept', '2024-01-20 10:30:00');

-- ============================================================================
-- INVENTORY ADJUSTMENTS (January 2024)
-- ============================================================================

-- Positive adjustments - found during cycle counts
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(12, 1, 5, 25, 5.50, 'ADJ-2024-001', 'Cycle count adjustment - found extra cables', 'inventory.team', '2024-01-15 16:00:00'),
(20, 1, 5, 40, 3.60, 'ADJ-2024-002', 'Cycle count adjustment - miscount corrected', 'inventory.team', '2024-01-16 10:00:00'),
(37, 7, 5, 15, 12.50, 'ADJ-2024-003', 'Cycle count adjustment - found in wrong bin', 'inventory.team', '2024-01-17 11:00:00'),

-- Negative adjustments - shrinkage, damage, obsolescence
(5, 1, 6, 12, 28.00, 'ADJ-2024-004', 'Cycle count adjustment - shrinkage', 'inventory.team', '2024-01-15 16:30:00'),
(16, 1, 6, 35, 4.50, 'ADJ-2024-005', 'Cycle count adjustment - water damage', 'inventory.team', '2024-01-16 10:30:00'),
(45, 1, 6, 18, 8.50, 'ADJ-2024-006', 'Cycle count adjustment - worn out gloves', 'inventory.team', '2024-01-17 11:30:00'),

-- Damage write-offs
(7, 1, 8, 3, 320.00, 'DMG-2024-001', 'Damaged in warehouse - forklift accident', 'warehouse.mgr', '2024-01-18 14:00:00'),
(11, 1, 8, 1, 280.00, 'DMG-2024-002', 'Damaged during receiving - dropped', 'warehouse.mgr', '2024-01-19 09:00:00'),
(34, 7, 8, 5, 145.00, 'DMG-2024-003', 'Damaged acrylic sheets - scratched', 'warehouse.mgr', '2024-01-20 10:00:00'),
(43, 1, 8, 2, 78.00, 'DMG-2024-004', 'Damaged saws - shipping damage', 'warehouse.mgr', '2024-01-21 11:00:00');

-- ============================================================================
-- RECENT SALES (Late January 2024)
-- ============================================================================

-- Continued sales activity
INSERT INTO inventory_movements (product_id, location_id, movement_type_id, quantity, unit_cost, reference_document, notes, created_by, created_at) VALUES
(1, 1, 2, 8, 850.00, 'SO-2024-0101', 'Enterprise laptop order', 'sales.team', '2024-01-22 10:00:00'),
(2, 2, 2, 6, 650.00, 'SO-2024-0102', 'Small business order', 'sales.team', '2024-01-23 11:00:00'),
(4, 1, 2, 15, 400.00, 'SO-2024-0103', 'Office expansion order', 'sales.team', '2024-01-24 09:00:00'),
(5, 1, 2, 35, 28.00, 'SO-2024-0104', 'Peripheral bundle order', 'sales.team', '2024-01-25 10:00:00'),
(6, 1, 2, 25, 85.00, 'SO-2024-0105', 'Gaming setup order', 'sales.team', '2024-01-26 11:00:00'),
(7, 1, 2, 10, 320.00, 'SO-2024-0106', 'Monitor upgrade project', 'sales.team', '2024-01-27 12:00:00'),
(8, 1, 2, 30, 45.00, 'SO-2024-0107', 'Video conferencing setup', 'sales.team', '2024-01-28 13:00:00'),
(9, 1, 2, 20, 65.00, 'SO-2024-0108', 'Call center expansion', 'sales.team', '2024-01-29 14:00:00'),

-- High-volume office supplies sales
(16, 1, 2, 180, 4.50, 'SO-2024-0109', 'Monthly office supplies', 'sales.team', '2024-01-22 08:00:00'),
(16, 2, 2, 95, 4.50, 'SO-2024-0110', 'School supplies order', 'sales.team', '2024-01-23 09:00:00'),
(20, 1, 2, 250, 3.60, 'SO-2024-0111', 'Bulk pen order', 'sales.team', '2024-01-24 10:00:00'),
(22, 1, 2, 140, 5.20, 'SO-2024-0112', 'Whiteboard supplies', 'sales.team', '2024-01-25 11:00:00'),
(23, 1, 2, 110, 4.80, 'SO-2024-0113', 'Highlighter bulk order', 'sales.team', '2024-01-26 12:00:00'),

-- Raw materials sales
(30, 7, 2, 18, 185.00, 'SO-2024-0114', 'Manufacturing project', 'sales.team', '2024-01-27 09:00:00'),
(31, 7, 2, 35, 42.00, 'SO-2024-0115', 'Construction materials', 'sales.team', '2024-01-28 10:00:00'),
(33, 7, 2, 85, 62.50, 'SO-2024-0116', 'Injection molding run', 'sales.team', '2024-01-29 11:00:00'),

-- Tool sales
(38, 1, 2, 32, 18.50, 'SO-2024-0117', 'Contractor tool kit', 'sales.team', '2024-01-27 13:00:00'),
(39, 1, 2, 28, 14.20, 'SO-2024-0118', 'Maintenance tools', 'sales.team', '2024-01-28 14:00:00'),
(40, 1, 2, 38, 16.80, 'SO-2024-0119', 'Construction tools', 'sales.team', '2024-01-29 15:00:00'),
(42, 1, 2, 12, 95.00, 'SO-2024-0120', 'Power tool order', 'sales.team', '2024-01-30 10:00:00'),

-- Safety equipment sales - ongoing demand
(45, 1, 2, 125, 8.50, 'SO-2024-0121', 'Construction site safety', 'sales.team', '2024-01-30 11:00:00'),
(46, 1, 2, 175, 4.20, 'SO-2024-0122', 'Safety glasses order', 'sales.team', '2024-01-30 12:00:00'),
(47, 1, 2, 65, 12.00, 'SO-2024-0123', 'Hearing protection', 'sales.team', '2024-01-30 13:00:00'),
(48, 1, 2, 85, 6.80, 'SO-2024-0124', 'Hi-vis vests', 'sales.team', '2024-01-30 14:00:00');

-- ============================================================================
-- SUMMARY COMMENTS
-- ============================================================================

-- This sample data demonstrates:
-- 1. Initial stock receipts across all product categories
-- 2. Inter-warehouse transfers showing distribution network
-- 3. Sales transactions with varied volumes and patterns
-- 4. Replenishment receipts triggered by reorder points
-- 5. Customer returns processing
-- 6. Inventory adjustments (positive and negative)
-- 7. Damage write-offs
-- 8. Realistic stock levels that trigger reorder alerts
-- 9. Complete audit trail with timestamps and user tracking
-- 10. All movement types (RECEIPT, SALE, TRANSFER_IN, TRANSFER_OUT, 
--     ADJUSTMENT_POS, ADJUSTMENT_NEG, RETURN, DAMAGE)

-- The data creates realistic scenarios for testing:
-- - Low stock alerts (some products below reorder point)
-- - Inventory valuation calculations
-- - Movement history analysis
-- - Supplier performance tracking
-- - Multi-location inventory management
-- - Returns processing workflows
-- - Inventory accuracy and shrinkage analysis
