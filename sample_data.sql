-- ============================================================================
-- COMPREHENSIVE SAMPLE DATA FOR INVENTORY MANAGEMENT SYSTEM
-- ============================================================================
-- This script populates the database with realistic sample data for testing
-- and demonstration purposes. It includes:
-- - Diverse product categories and products
-- - Multiple locations with hierarchical structure
-- - Supplier relationships with varied terms
-- - Inventory movements demonstrating all transaction types
-- - Reorder settings for different scenarios
-- ============================================================================

-- Clear existing sample data (except movement types which are reference data)
DELETE FROM inventory_movements;
DELETE FROM reorder_settings;
DELETE FROM stock_levels;
DELETE FROM product_suppliers;
DELETE FROM products;
DELETE FROM suppliers;
DELETE FROM locations;
DELETE FROM categories;

-- Reset sequences
ALTER SEQUENCE categories_category_id_seq RESTART WITH 1;
ALTER SEQUENCE products_product_id_seq RESTART WITH 1;
ALTER SEQUENCE locations_location_id_seq RESTART WITH 1;
ALTER SEQUENCE suppliers_supplier_id_seq RESTART WITH 1;
ALTER SEQUENCE product_suppliers_product_supplier_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_levels_stock_level_id_seq RESTART WITH 1;
ALTER SEQUENCE reorder_settings_reorder_setting_id_seq RESTART WITH 1;
ALTER SEQUENCE inventory_movements_movement_id_seq RESTART WITH 1;

-- ============================================================================
-- CATEGORIES - Hierarchical product classification
-- ============================================================================

INSERT INTO categories (name, description, parent_category_id, is_active) VALUES
-- Top-level categories
('Electronics', 'Electronic devices, components, and accessories', NULL, true),
('Office Supplies', 'Office equipment and consumables', NULL, true),
('Raw Materials', 'Base materials for manufacturing and production', NULL, true),
('Finished Goods', 'Completed products ready for sale', NULL, true),
('Tools & Equipment', 'Hand tools, power tools, and equipment', NULL, true),
('Safety Equipment', 'Personal protective equipment and safety gear', NULL, true),

-- Electronics subcategories
('Computers', 'Desktop and laptop computers', 1, true),
('Peripherals', 'Computer accessories and peripherals', 1, true),
('Networking', 'Network equipment and cables', 1, true),
('Components', 'Electronic components and parts', 1, true),

-- Office Supplies subcategories
('Paper Products', 'Paper, notebooks, and related items', 2, true),
('Writing Instruments', 'Pens, pencils, markers', 2, true),
('Filing & Storage', 'Folders, binders, storage boxes', 2, true),
('Desk Accessories', 'Staplers, tape dispensers, organizers', 2, true),

-- Raw Materials subcategories
('Metals', 'Metal sheets, bars, and components', 3, true),
('Plastics', 'Plastic resins and molded parts', 3, true),
('Textiles', 'Fabrics and textile materials', 3, true),

-- Tools subcategories
('Hand Tools', 'Manual tools and implements', 5, true),
('Power Tools', 'Electric and battery-powered tools', 5, true);

-- ============================================================================
-- LOCATIONS - Hierarchical warehouse structure
-- ============================================================================

INSERT INTO locations (code, name, location_type, parent_location_id, capacity, is_active) VALUES
-- Warehouses (top level)
('WH-MAIN', 'Main Distribution Center', 'warehouse', NULL, 100000, true),
('WH-WEST', 'West Coast Warehouse', 'warehouse', NULL, 50000, true),
('WH-EAST', 'East Coast Warehouse', 'warehouse', NULL, 50000, true),
('WH-RET', 'Returns Processing Center', 'warehouse', NULL, 10000, true),

-- Main Warehouse - Zones
('WH-MAIN-A', 'Zone A - Electronics', 'zone', 1, 25000, true),
('WH-MAIN-B', 'Zone B - Office Supplies', 'zone', 1, 25000, true),
('WH-MAIN-C', 'Zone C - Raw Materials', 'zone', 1, 30000, true),
('WH-MAIN-D', 'Zone D - Finished Goods', 'zone', 1, 20000, true),

-- Zone A - Aisles
('WH-MAIN-A1', 'Aisle A1 - Computers', 'aisle', 5, 5000, true),
('WH-MAIN-A2', 'Aisle A2 - Peripherals', 'aisle', 5, 5000, true),
('WH-MAIN-A3', 'Aisle A3 - Components', 'aisle', 5, 5000, true),

-- Zone B - Aisles
('WH-MAIN-B1', 'Aisle B1 - Paper Products', 'aisle', 6, 8000, true),
('WH-MAIN-B2', 'Aisle B2 - Writing & Desk', 'aisle', 6, 5000, true),

-- Aisle A1 - Bins (sample bins for computers)
('WH-MAIN-A1-01', 'Bin A1-01', 'bin', 9, 500, true),
('WH-MAIN-A1-02', 'Bin A1-02', 'bin', 9, 500, true),
('WH-MAIN-A1-03', 'Bin A1-03', 'bin', 9, 500, true),

-- West Warehouse - Zones
('WH-WEST-A', 'Zone A - General Storage', 'zone', 2, 30000, true),
('WH-WEST-B', 'Zone B - High Value', 'zone', 2, 20000, true),

-- East Warehouse - Zones
('WH-EAST-A', 'Zone A - General Storage', 'zone', 3, 30000, true),
('WH-EAST-B', 'Zone B - Bulk Storage', 'zone', 3, 20000, true);

-- ============================================================================
-- SUPPLIERS - Diverse vendor base
-- ============================================================================

INSERT INTO suppliers (code, name, contact_person, email, phone, address, payment_terms, is_active) VALUES
('SUP-TECH-001', 'TechSource Global', 'Jennifer Martinez', 'j.martinez@techsource.com', '+1-555-0101', '123 Tech Park, San Jose, CA 95110', 'Net 30', true),
('SUP-COMP-002', 'CompuWare Distributors', 'David Chen', 'd.chen@compuware.com', '+1-555-0102', '456 Silicon Valley Blvd, Santa Clara, CA 95050', 'Net 45', true),
('SUP-OFFI-003', 'Office Essentials Inc', 'Sarah Thompson', 's.thompson@officeessentials.com', '+1-555-0103', '789 Business Park Dr, Austin, TX 78701', 'Net 15', true),
('SUP-GLOB-004', 'Global Supply Chain Ltd', 'Michael Wong', 'm.wong@globalsupply.com', '+1-555-0104', '321 Import Plaza, Long Beach, CA 90802', 'Net 60', true),
('SUP-INDU-005', 'Industrial Materials Co', 'Robert Johnson', 'r.johnson@indmaterials.com', '+1-555-0105', '654 Manufacturing Way, Detroit, MI 48201', 'Net 30', true),
('SUP-ELEC-006', 'ElectroComponents Direct', 'Lisa Anderson', 'l.anderson@electrocomp.com', '+1-555-0106', '987 Component Circle, Boston, MA 02101', 'Net 30', true),
('SUP-PAPE-007', 'Paper Products Wholesale', 'James Wilson', 'j.wilson@paperproducts.com', '+1-555-0107', '147 Mill Street, Portland, OR 97201', 'Net 15', true),
('SUP-TOOL-008', 'ToolMaster Supply', 'Patricia Garcia', 'p.garcia@toolmaster.com', '+1-555-0108', '258 Industrial Pkwy, Chicago, IL 60601', 'Net 30', true),
('SUP-SAFE-009', 'SafetyFirst Equipment', 'Thomas Brown', 't.brown@safetyfirst.com', '+1-555-0109', '369 Protection Ave, Houston, TX 77001', 'Net 30', true),
('SUP-ASIA-010', 'Asia Pacific Imports', 'Wei Zhang', 'w.zhang@asiapacific.com', '+1-555-0110', '741 Harbor View, Seattle, WA 98101', 'Net 90', true);

-- ============================================================================
-- PRODUCTS - Comprehensive product catalog
-- ============================================================================

INSERT INTO products (sku, name, description, category_id, unit_of_measure, weight_kg, length_cm, width_cm, height_cm, cost_price, selling_price, status) VALUES
-- Electronics - Computers
('COMP-LAP-001', 'ProBook 15 Business Laptop', 'Intel i7, 16GB RAM, 512GB SSD, 15.6" display', 7, 'each', 2.1, 38.0, 25.5, 2.0, 850.00, 1299.99, 'active'),
('COMP-LAP-002', 'UltraSlim 13 Laptop', 'Intel i5, 8GB RAM, 256GB SSD, 13.3" display', 7, 'each', 1.3, 30.5, 21.0, 1.5, 650.00, 999.99, 'active'),
('COMP-DESK-001', 'WorkStation Pro Desktop', 'Intel i9, 32GB RAM, 1TB SSD, No monitor', 7, 'each', 8.5, 45.0, 20.0, 40.0, 1200.00, 1899.99, 'active'),
('COMP-DESK-002', 'Office Desktop Basic', 'Intel i3, 8GB RAM, 256GB SSD', 7, 'each', 6.0, 35.0, 15.0, 35.0, 400.00, 649.99, 'active'),

-- Electronics - Peripherals
('PERI-MOU-001', 'Wireless Ergonomic Mouse', 'Bluetooth, rechargeable, 6 buttons', 8, 'each', 0.12, 12.0, 7.0, 4.0, 28.00, 49.99, 'active'),
('PERI-KEY-001', 'Mechanical Keyboard RGB', 'Cherry MX switches, RGB backlight, USB-C', 8, 'each', 0.95, 44.0, 13.0, 3.5, 85.00, 149.99, 'active'),
('PERI-MON-001', '27" 4K Monitor', 'IPS panel, 60Hz, USB-C, height adjustable', 8, 'each', 6.8, 61.0, 52.0, 18.0, 320.00, 549.99, 'active'),
('PERI-WEB-001', 'HD Webcam Pro', '1080p, auto-focus, built-in mic', 8, 'each', 0.18, 9.0, 7.0, 6.0, 45.00, 79.99, 'active'),
('PERI-HEA-001', 'Noise Cancelling Headset', 'Wireless, 30hr battery, boom mic', 8, 'each', 0.28, 20.0, 18.0, 8.0, 65.00, 119.99, 'active'),

-- Electronics - Networking
('NET-ROU-001', 'Enterprise WiFi Router', 'Dual-band, gigabit ports, VPN support', 9, 'each', 0.65, 25.0, 18.0, 5.0, 120.00, 199.99, 'active'),
('NET-SWI-001', '24-Port Gigabit Switch', 'Managed, PoE+, rack mountable', 9, 'each', 3.2, 44.0, 28.0, 4.4, 280.00, 479.99, 'active'),
('NET-CAB-001', 'Cat6 Ethernet Cable 10ft', 'Shielded, snagless connectors', 9, 'each', 0.15, 30.0, 10.0, 2.0, 5.50, 12.99, 'active'),

-- Electronics - Components
('COMP-RAM-001', '16GB DDR4 RAM Module', '3200MHz, desktop DIMM', 10, 'each', 0.05, 13.5, 3.0, 0.5, 45.00, 79.99, 'active'),
('COMP-SSD-001', '1TB NVMe SSD', 'M.2 form factor, 3500MB/s read', 10, 'each', 0.01, 8.0, 2.2, 0.2, 85.00, 139.99, 'active'),
('COMP-PSU-001', '750W Power Supply', '80+ Gold, modular cables', 10, 'each', 1.8, 15.0, 15.0, 8.5, 95.00, 159.99, 'active'),

-- Office Supplies - Paper Products
('OFFI-PAP-001', 'A4 Copy Paper 500 sheets', 'White, 80gsm, multipurpose', 11, 'ream', 2.5, 29.7, 21.0, 5.0, 4.50, 8.99, 'active'),
('OFFI-PAP-002', 'Legal Size Paper 500 sheets', 'White, 80gsm, 8.5x14"', 11, 'ream', 2.8, 35.6, 21.6, 5.0, 5.00, 9.99, 'active'),
('OFFI-NOT-001', 'Spiral Notebook A5', '200 pages, ruled, hardcover', 11, 'each', 0.35, 21.0, 14.8, 1.5, 3.20, 6.99, 'active'),
('OFFI-PAD-001', 'Sticky Notes 3x3 Pack', '12 pads, assorted colors', 11, 'pack', 0.18, 7.6, 7.6, 3.0, 4.80, 9.99, 'active'),

-- Office Supplies - Writing Instruments
('OFFI-PEN-001', 'Ballpoint Pen Blue Box/12', 'Medium point, comfortable grip', 12, 'box', 0.12, 15.0, 8.0, 2.0, 3.60, 7.99, 'active'),
('OFFI-PEN-002', 'Gel Pen Set 10 colors', 'Fine point, smooth ink flow', 12, 'set', 0.15, 16.0, 10.0, 2.5, 8.50, 15.99, 'active'),
('OFFI-MAR-001', 'Whiteboard Markers 4-pack', 'Chisel tip, low odor, assorted', 12, 'pack', 0.08, 14.0, 10.0, 2.0, 5.20, 10.99, 'active'),
('OFFI-HIG-001', 'Highlighter Set 6 colors', 'Chisel tip, fluorescent colors', 12, 'set', 0.10, 13.0, 9.0, 2.0, 4.80, 9.99, 'active'),

-- Office Supplies - Filing & Storage
('OFFI-FOL-001', 'Manila File Folders Box/100', 'Letter size, 1/3 cut tabs', 13, 'box', 2.5, 31.0, 23.0, 8.0, 12.00, 22.99, 'active'),
('OFFI-BIN-001', '3-Ring Binder 2"', 'D-ring, clear overlay, black', 13, 'each', 0.65, 28.0, 25.0, 5.0, 6.50, 12.99, 'active'),
('OFFI-BOX-001', 'Storage Box Letter/Legal', 'Corrugated, lift-off lid', 13, 'each', 0.85, 40.0, 32.0, 26.0, 4.20, 8.99, 'active'),

-- Office Supplies - Desk Accessories
('OFFI-STA-001', 'Heavy Duty Stapler', '50 sheet capacity, metal construction', 14, 'each', 0.45, 18.0, 6.0, 5.0, 12.50, 24.99, 'active'),
('OFFI-TAP-001', 'Tape Dispenser Desktop', 'Weighted base, for 1" tape', 14, 'each', 0.32, 15.0, 8.0, 6.0, 5.80, 11.99, 'active'),
('OFFI-ORG-001', 'Desk Organizer 5-compartment', 'Mesh metal, black', 14, 'each', 0.55, 25.0, 12.0, 10.0, 8.90, 17.99, 'active'),

-- Raw Materials - Metals
('RAW-MET-001', 'Aluminum Sheet 4x8ft', '0.125" thick, 6061 alloy', 15, 'sheet', 45.0, 244.0, 122.0, 0.3, 185.00, 299.99, 'active'),
('RAW-MET-002', 'Steel Bar 1" Round 6ft', 'Cold rolled, 1018 steel', 15, 'bar', 22.0, 183.0, 2.5, 2.5, 42.00, 69.99, 'active'),
('RAW-MET-003', 'Copper Wire 10AWG 100ft', 'Bare, solid conductor', 15, 'spool', 8.5, 30.0, 30.0, 10.0, 95.00, 159.99, 'active'),

-- Raw Materials - Plastics
('RAW-PLA-001', 'ABS Plastic Pellets 25kg', 'Injection molding grade, natural', 16, 'bag', 25.0, 60.0, 40.0, 15.0, 62.50, 109.99, 'active'),
('RAW-PLA-002', 'Acrylic Sheet 4x8ft Clear', '1/4" thick, cast acrylic', 16, 'sheet', 32.0, 244.0, 122.0, 0.6, 145.00, 249.99, 'active'),
('RAW-PLA-003', 'PVC Pipe 2" Schedule 40 10ft', 'White, pressure rated', 16, 'pipe', 4.2, 305.0, 6.0, 6.0, 18.50, 32.99, 'active'),

-- Raw Materials - Textiles
('RAW-TEX-001', 'Cotton Canvas 60" 50yd', '10oz weight, natural color', 17, 'roll', 28.0, 152.0, 15.0, 15.0, 225.00, 389.99, 'active'),
('RAW-TEX-002', 'Polyester Thread 5000yd', 'All-purpose, white', 17, 'spool', 0.35, 10.0, 10.0, 8.0, 12.50, 22.99, 'active'),

-- Tools - Hand Tools
('TOOL-HAN-001', 'Screwdriver Set 10-piece', 'Phillips and flathead, magnetic tips', 18, 'set', 0.85, 30.0, 15.0, 4.0, 18.50, 34.99, 'active'),
('TOOL-HAN-002', 'Adjustable Wrench 12"', 'Chrome vanadium, cushion grip', 18, 'each', 0.65, 30.0, 5.0, 2.0, 14.20, 26.99, 'active'),
('TOOL-HAN-003', 'Hammer Claw 16oz', 'Fiberglass handle, rubber grip', 18, 'each', 0.72, 33.0, 12.0, 3.0, 16.80, 31.99, 'active'),
('TOOL-HAN-004', 'Pliers Set 3-piece', 'Needle nose, slip joint, diagonal', 18, 'set', 0.55, 25.0, 18.0, 3.0, 22.50, 42.99, 'active'),

-- Tools - Power Tools
('TOOL-POW-001', 'Cordless Drill 20V', 'Brushless motor, 2 batteries, charger', 19, 'kit', 2.8, 35.0, 28.0, 12.0, 95.00, 169.99, 'active'),
('TOOL-POW-002', 'Circular Saw 7-1/4"', 'Corded, 15A motor, laser guide', 19, 'each', 4.2, 38.0, 25.0, 28.0, 78.00, 139.99, 'active'),
('TOOL-POW-003', 'Angle Grinder 4-1/2"', 'Corded, 6A motor, paddle switch', 19, 'each', 2.1, 28.0, 12.0, 12.0, 42.00, 74.99, 'active'),

-- Safety Equipment
('SAFE-GLO-001', 'Work Gloves Leather Large', 'Reinforced palm, elastic wrist', 6, 'pair', 0.18, 28.0, 15.0, 2.0, 8.50, 16.99, 'active'),
('SAFE-GOG-001', 'Safety Glasses Clear', 'Anti-fog, scratch resistant, ANSI Z87', 6, 'each', 0.05, 15.0, 6.0, 5.0, 4.20, 8.99, 'active'),
('SAFE-EAR-001', 'Ear Plugs Foam 100-pair', 'NRR 32dB, individually wrapped', 6, 'box', 0.45, 20.0, 15.0, 10.0, 12.00, 22.99, 'active'),
('SAFE-VES-001', 'Safety Vest Hi-Vis Orange XL', 'Class 2, reflective strips, mesh', 6, 'each', 0.22, 30.0, 25.0, 2.0, 6.80, 13.99, 'active'),

-- Discontinued products for testing
('COMP-LAP-OLD', 'Legacy Laptop Model 2019', 'Discontinued model, limited support', 7, 'each', 2.3, 38.0, 26.0, 2.5, 450.00, 699.99, 'discontinued'),
('PERI-MOU-OLD', 'Wired Mouse Basic', 'Discontinued, replaced by wireless', 8, 'each', 0.08, 11.0, 6.0, 3.5, 8.00, 14.99, 'discontinued');


-- ============================================================================
-- PRODUCT-SUPPLIER RELATIONSHIPS - Varied terms and performance metrics
-- ============================================================================

INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, lead_time_days, minimum_order_qty, cost_price, is_preferred, average_delivery_days, on_time_delivery_rate, quality_rating, total_orders, total_delivered, last_order_date, last_delivery_date, is_active) VALUES
-- Laptops - Multiple suppliers with different terms
(1, 1, 'TS-PROBOOK15-I7', 14, 10, 850.00, true, 13.5, 0.96, 4.7, 24, 23, '2024-01-15', '2024-01-28', true),
(1, 2, 'CW-LAPTOP-PRO15', 21, 5, 870.00, false, 22.0, 0.85, 4.3, 12, 10, '2023-12-10', '2024-01-02', true),
(2, 1, 'TS-ULTRASLIM13', 10, 15, 650.00, true, 9.8, 0.98, 4.8, 18, 18, '2024-01-20', '2024-01-30', true),
(2, 10, 'AP-LAPTOP-SLIM13', 45, 20, 620.00, false, 48.0, 0.75, 4.0, 6, 4, '2023-11-15', '2024-01-05', true),

-- Desktops
(3, 1, 'TS-WORKSTATION-I9', 18, 5, 1200.00, true, 17.2, 0.94, 4.6, 15, 14, '2024-01-10', '2024-01-27', true),
(4, 2, 'CW-DESKTOP-BASIC', 12, 10, 400.00, true, 11.5, 0.95, 4.5, 32, 31, '2024-01-22', '2024-02-03', true),

-- Peripherals - High volume, multiple suppliers
(5, 1, 'TS-MOUSE-ERGO-BT', 7, 50, 28.00, true, 6.8, 0.99, 4.9, 48, 48, '2024-01-25', '2024-02-01', true),
(5, 6, 'EC-MOUSE-WIRELESS', 10, 100, 26.50, false, 10.2, 0.96, 4.7, 24, 23, '2024-01-18', '2024-01-28', true),
(6, 1, 'TS-KEYBOARD-MECH-RGB', 8, 25, 85.00, true, 7.5, 0.98, 4.8, 36, 36, '2024-01-23', '2024-01-31', true),
(6, 10, 'AP-KEYBOARD-RGB', 30, 50, 78.00, false, 32.0, 0.88, 4.4, 8, 7, '2023-12-20', '2024-01-22', true),
(7, 1, 'TS-MONITOR-27-4K', 12, 10, 320.00, true, 11.8, 0.97, 4.7, 28, 27, '2024-01-20', '2024-02-01', true),
(8, 6, 'EC-WEBCAM-HD-PRO', 5, 30, 45.00, true, 4.9, 0.99, 4.9, 42, 42, '2024-01-26', '2024-01-31', true),
(9, 1, 'TS-HEADSET-NC-WIRELESS', 9, 20, 65.00, true, 8.7, 0.98, 4.8, 30, 30, '2024-01-24', '2024-02-02', true),

-- Networking equipment
(10, 1, 'TS-ROUTER-WIFI-ENT', 10, 5, 120.00, true, 9.5, 0.97, 4.7, 20, 19, '2024-01-15', '2024-01-25', true),
(10, 6, 'EC-ROUTER-ENTERPRISE', 8, 10, 125.00, false, 8.2, 0.98, 4.8, 15, 15, '2024-01-18', '2024-01-26', true),
(11, 1, 'TS-SWITCH-24P-POE', 15, 3, 280.00, true, 14.5, 0.96, 4.7, 12, 12, '2024-01-12', '2024-01-27', true),
(12, 6, 'EC-CABLE-CAT6-10FT', 3, 100, 5.50, true, 2.8, 0.99, 4.9, 60, 60, '2024-01-28', '2024-01-31', true),

-- Components
(13, 6, 'EC-RAM-16GB-DDR4-3200', 5, 50, 45.00, true, 4.8, 0.99, 4.9, 45, 45, '2024-01-27', '2024-02-01', true),
(14, 6, 'EC-SSD-1TB-NVME', 6, 30, 85.00, true, 5.9, 0.98, 4.8, 38, 38, '2024-01-26', '2024-02-01', true),
(15, 1, 'TS-PSU-750W-GOLD', 10, 15, 95.00, true, 9.8, 0.97, 4.7, 25, 24, '2024-01-20', '2024-01-30', true),

-- Office Supplies - Paper Products (high volume, short lead times)
(16, 3, 'OE-PAPER-A4-500-80G', 2, 200, 4.50, true, 1.9, 0.99, 4.8, 120, 119, '2024-01-29', '2024-01-31', true),
(16, 7, 'PP-COPY-PAPER-A4', 3, 500, 4.30, false, 3.1, 0.98, 4.7, 80, 79, '2024-01-25', '2024-01-28', true),
(17, 3, 'OE-PAPER-LEGAL-500', 2, 150, 5.00, true, 2.0, 0.99, 4.8, 90, 90, '2024-01-29', '2024-01-31', true),
(18, 3, 'OE-NOTEBOOK-A5-200P', 5, 100, 3.20, true, 4.8, 0.98, 4.7, 65, 64, '2024-01-26', '2024-01-31', true),
(19, 3, 'OE-STICKY-NOTES-3X3', 3, 200, 4.80, true, 2.9, 0.99, 4.8, 85, 85, '2024-01-28', '2024-01-31', true),

-- Writing Instruments
(20, 3, 'OE-PEN-BALL-BLUE-12', 4, 500, 3.60, true, 3.8, 0.98, 4.7, 95, 93, '2024-01-27', '2024-01-31', true),
(21, 3, 'OE-PEN-GEL-10COLOR', 5, 200, 8.50, true, 4.9, 0.98, 4.7, 55, 54, '2024-01-25', '2024-01-30', true),
(22, 3, 'OE-MARKER-WB-4PACK', 4, 300, 5.20, true, 3.9, 0.98, 4.8, 72, 71, '2024-01-26', '2024-01-30', true),
(23, 3, 'OE-HIGHLIGHTER-6COLOR', 4, 250, 4.80, true, 3.8, 0.99, 4.8, 68, 68, '2024-01-27', '2024-01-31', true),

-- Filing & Storage
(24, 3, 'OE-FOLDER-MANILA-100', 6, 50, 12.00, true, 5.8, 0.97, 4.6, 48, 47, '2024-01-24', '2024-01-30', true),
(25, 3, 'OE-BINDER-3RING-2IN', 5, 100, 6.50, true, 4.9, 0.98, 4.7, 58, 57, '2024-01-25', '2024-01-30', true),
(26, 3, 'OE-BOX-STORAGE-LTR', 7, 75, 4.20, true, 6.8, 0.96, 4.6, 42, 41, '2024-01-23', '2024-01-30', true),

-- Desk Accessories
(27, 3, 'OE-STAPLER-HD-50SH', 6, 50, 12.50, true, 5.9, 0.97, 4.7, 45, 44, '2024-01-24', '2024-01-30', true),
(28, 3, 'OE-TAPE-DISP-DESK', 5, 100, 5.80, true, 4.9, 0.98, 4.7, 52, 51, '2024-01-25', '2024-01-30', true),
(29, 3, 'OE-ORGANIZER-5COMP', 8, 40, 8.90, true, 7.8, 0.96, 4.6, 38, 37, '2024-01-22', '2024-01-30', true),

-- Raw Materials - Metals (longer lead times, bulk orders)
(30, 5, 'IM-ALUMINUM-4X8-125', 21, 10, 185.00, true, 20.5, 0.92, 4.5, 18, 17, '2024-01-08', '2024-01-29', true),
(30, 4, 'GS-ALUM-SHEET-4X8', 35, 20, 175.00, false, 36.0, 0.85, 4.2, 8, 7, '2023-12-15', '2024-01-20', true),
(31, 5, 'IM-STEEL-BAR-1IN-6FT', 18, 25, 42.00, true, 17.8, 0.93, 4.5, 22, 21, '2024-01-10', '2024-01-28', true),
(32, 5, 'IM-COPPER-WIRE-10AWG', 15, 20, 95.00, true, 14.8, 0.94, 4.6, 16, 15, '2024-01-12', '2024-01-27', true),

-- Raw Materials - Plastics
(33, 5, 'IM-ABS-PELLETS-25KG', 25, 40, 62.50, true, 24.5, 0.90, 4.4, 14, 13, '2024-01-05', '2024-01-30', true),
(33, 4, 'GS-ABS-RESIN-25KG', 40, 100, 58.00, false, 42.0, 0.82, 4.1, 6, 5, '2023-12-10', '2024-01-20', true),
(34, 5, 'IM-ACRYLIC-4X8-CLEAR', 20, 15, 145.00, true, 19.5, 0.92, 4.5, 12, 11, '2024-01-08', '2024-01-28', true),
(35, 5, 'IM-PVC-PIPE-2IN-10FT', 12, 50, 18.50, true, 11.8, 0.95, 4.6, 28, 27, '2024-01-15', '2024-01-27', true),

-- Raw Materials - Textiles
(36, 4, 'GS-CANVAS-60IN-50YD', 30, 10, 225.00, true, 29.5, 0.88, 4.3, 10, 9, '2024-01-02', '2024-02-01', true),
(37, 4, 'GS-THREAD-POLY-5000Y', 15, 100, 12.50, true, 14.8, 0.92, 4.5, 24, 23, '2024-01-12', '2024-01-27', true),

-- Tools - Hand Tools
(38, 8, 'TM-SCREWDRIVER-SET-10', 8, 25, 18.50, true, 7.8, 0.97, 4.7, 32, 31, '2024-01-20', '2024-01-28', true),
(39, 8, 'TM-WRENCH-ADJ-12IN', 7, 30, 14.20, true, 6.9, 0.98, 4.8, 35, 35, '2024-01-22', '2024-01-29', true),
(40, 8, 'TM-HAMMER-CLAW-16OZ', 6, 40, 16.80, true, 5.9, 0.98, 4.8, 38, 38, '2024-01-23', '2024-01-29', true),
(41, 8, 'TM-PLIERS-SET-3PC', 8, 30, 22.50, true, 7.8, 0.97, 4.7, 28, 27, '2024-01-21', '2024-01-29', true),

-- Tools - Power Tools (higher value, moderate lead times)
(42, 8, 'TM-DRILL-CORDLESS-20V', 12, 10, 95.00, true, 11.5, 0.96, 4.7, 22, 21, '2024-01-15', '2024-01-27', true),
(42, 1, 'TS-DRILL-KIT-20V', 15, 5, 102.00, false, 14.8, 0.94, 4.6, 12, 11, '2024-01-10', '2024-01-25', true),
(43, 8, 'TM-SAW-CIRCULAR-7.25', 10, 8, 78.00, true, 9.8, 0.97, 4.7, 18, 18, '2024-01-18', '2024-01-28', true),
(44, 8, 'TM-GRINDER-ANGLE-4.5', 9, 15, 42.00, true, 8.8, 0.97, 4.7, 24, 23, '2024-01-20', '2024-01-29', true),

-- Safety Equipment (critical items, reliable suppliers)
(45, 9, 'SF-GLOVES-LEATHER-L', 5, 100, 8.50, true, 4.8, 0.99, 4.9, 52, 52, '2024-01-26', '2024-01-31', true),
(46, 9, 'SF-GLASSES-CLEAR-Z87', 4, 200, 4.20, true, 3.9, 0.99, 4.9, 68, 68, '2024-01-27', '2024-01-31', true),
(47, 9, 'SF-EARPLUGS-FOAM-100', 6, 50, 12.00, true, 5.8, 0.98, 4.8, 45, 44, '2024-01-25', '2024-01-31', true),
(48, 9, 'SF-VEST-HIVIS-ORG-XL', 7, 50, 6.80, true, 6.9, 0.98, 4.8, 38, 37, '2024-01-24', '2024-01-31', true);

-- ============================================================================
-- REORDER SETTINGS - Different scenarios and strategies
-- ============================================================================

INSERT INTO reorder_settings (product_id, location_id, reorder_point, reorder_quantity, maximum_stock, is_active) VALUES
-- High-value electronics - Conservative reorder points
(1, 1, 15, 30, 75, true),      -- ProBook Laptop at Main Warehouse
(1, 2, 8, 15, 40, true),       -- ProBook Laptop at West Warehouse
(1, 3, 8, 15, 40, true),       -- ProBook Laptop at East Warehouse
(2, 1, 20, 40, 100, true),     -- UltraSlim Laptop at Main Warehouse
(3, 1, 10, 20, 50, true),      -- WorkStation Desktop at Main Warehouse
(4, 1, 25, 50, 120, true),     -- Office Desktop at Main Warehouse

-- Peripherals - Higher volume, more aggressive reordering
(5, 1, 50, 150, 400, true),    -- Wireless Mouse at Main Warehouse
(5, 2, 30, 100, 250, true),    -- Wireless Mouse at West Warehouse
(5, 3, 30, 100, 250, true),    -- Wireless Mouse at East Warehouse
(6, 1, 40, 100, 250, true),    -- Mechanical Keyboard at Main Warehouse
(7, 1, 20, 40, 100, true),     -- 27" Monitor at Main Warehouse
(8, 1, 60, 150, 350, true),    -- HD Webcam at Main Warehouse
(9, 1, 35, 80, 200, true),     -- Noise Cancelling Headset at Main Warehouse

-- Networking - Moderate volume
(10, 1, 15, 30, 75, true),     -- WiFi Router at Main Warehouse
(11, 1, 8, 15, 40, true),      -- 24-Port Switch at Main Warehouse
(12, 1, 100, 300, 800, true),  -- Cat6 Cable at Main Warehouse (high volume)

-- Components - High turnover
(13, 1, 80, 200, 500, true),   -- 16GB RAM at Main Warehouse
(14, 1, 60, 150, 400, true),   -- 1TB SSD at Main Warehouse
(15, 1, 30, 75, 180, true),    -- 750W PSU at Main Warehouse

-- Office Supplies - Very high volume, frequent reordering
(16, 1, 200, 500, 1500, true), -- A4 Paper at Main Warehouse (bulk)
(16, 2, 100, 300, 800, true),  -- A4 Paper at West Warehouse
(16, 6, 150, 400, 1200, true), -- A4 Paper at Zone B (direct to zone)
(17, 1, 150, 400, 1000, true), -- Legal Paper at Main Warehouse
(18, 1, 100, 250, 600, true),  -- Spiral Notebooks at Main Warehouse
(19, 1, 150, 400, 1000, true), -- Sticky Notes at Main Warehouse

-- Writing Instruments - High volume consumables
(20, 1, 300, 800, 2000, true), -- Ballpoint Pens at Main Warehouse
(21, 1, 120, 300, 750, true),  -- Gel Pen Sets at Main Warehouse
(22, 1, 180, 450, 1100, true), -- Whiteboard Markers at Main Warehouse
(23, 1, 160, 400, 1000, true), -- Highlighters at Main Warehouse

-- Filing & Storage - Moderate volume
(24, 1, 80, 200, 500, true),   -- Manila Folders at Main Warehouse
(25, 1, 90, 225, 550, true),   -- 3-Ring Binders at Main Warehouse
(26, 1, 70, 175, 450, true),   -- Storage Boxes at Main Warehouse

-- Desk Accessories - Steady demand
(27, 1, 60, 150, 375, true),   -- Heavy Duty Staplers at Main Warehouse
(28, 1, 75, 190, 475, true),   -- Tape Dispensers at Main Warehouse
(29, 1, 50, 125, 320, true),   -- Desk Organizers at Main Warehouse

-- Raw Materials - Bulk ordering, longer lead times
(30, 7, 20, 50, 150, true),    -- Aluminum Sheets at Zone C
(31, 7, 40, 100, 300, true),   -- Steel Bars at Zone C
(32, 7, 30, 75, 200, true),    -- Copper Wire at Zone C
(33, 7, 60, 200, 600, true),   -- ABS Pellets at Zone C (bulk)
(34, 7, 25, 60, 180, true),    -- Acrylic Sheets at Zone C
(35, 7, 80, 200, 600, true),   -- PVC Pipes at Zone C
(36, 7, 15, 40, 120, true),    -- Cotton Canvas at Zone C
(37, 7, 120, 300, 900, true),  -- Polyester Thread at Zone C

-- Tools - Moderate reorder points
(38, 1, 40, 100, 250, true),   -- Screwdriver Sets at Main Warehouse
(39, 1, 45, 110, 280, true),   -- Adjustable Wrenches at Main Warehouse
(40, 1, 50, 125, 320, true),   -- Claw Hammers at Main Warehouse
(41, 1, 35, 90, 225, true),    -- Pliers Sets at Main Warehouse
(42, 1, 20, 50, 125, true),    -- Cordless Drills at Main Warehouse
(43, 1, 15, 40, 100, true),    -- Circular Saws at Main Warehouse
(44, 1, 25, 60, 150, true),    -- Angle Grinders at Main Warehouse

-- Safety Equipment - Critical stock levels, never run out
(45, 1, 150, 400, 1000, true), -- Work Gloves at Main Warehouse (critical)
(46, 1, 250, 600, 1500, true), -- Safety Glasses at Main Warehouse (critical)
(47, 1, 80, 200, 500, true),   -- Ear Plugs at Main Warehouse (critical)
(48, 1, 100, 250, 625, true),  -- Safety Vests at Main Warehouse (critical)

-- Multi-location reorder settings for key items
(5, 17, 25, 75, 200, true),    -- Wireless Mouse at West Zone A
(16, 17, 120, 350, 900, true), -- A4 Paper at West Zone A
(20, 17, 200, 550, 1400, true),-- Ballpoint Pens at West Zone A
(45, 17, 100, 275, 700, true), -- Work Gloves at West Zone A

-- Inactive reorder settings (for testing)
(49, 1, 10, 25, 60, false),    -- Discontinued laptop (inactive)
(50, 1, 20, 50, 120, false);   -- Discontinued mouse (inactive)

