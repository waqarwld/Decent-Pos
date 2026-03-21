# Sample Data Documentation

## Overview

This document describes the comprehensive sample data created for the inventory management system. The sample data demonstrates all features of the system and provides realistic scenarios for testing, development, and demonstration purposes.

## Files

### 1. `sample_data.sql`
Contains the foundational sample data:
- **Categories**: 19 categories in a hierarchical structure (6 top-level, 13 subcategories)
- **Locations**: 20 locations with 4-level hierarchy (warehouses → zones → aisles → bins)
- **Suppliers**: 10 suppliers with varied payment terms and contact information
- **Products**: 50 products across all categories with complete attributes
- **Product-Supplier Relationships**: 70+ relationships with performance metrics
- **Reorder Settings**: 60+ reorder configurations for different scenarios

### 2. `sample_data_movements.sql`
Contains transaction history demonstrating all movement types:
- **Initial Receipts**: ~50 receipts stocking all warehouses (December 2023)
- **Transfers**: Inter-warehouse transfers showing distribution network
- **Sales**: ~120 sales transactions with varied volumes and patterns
- **Replenishment**: Restock receipts triggered by reorder points (January 2024)
- **Returns**: Customer returns with various reasons
- **Adjustments**: Cycle count adjustments (positive and negative)
- **Damage**: Write-offs for damaged goods

### 3. `load_sample_data.sql`
Master loader script that:
- Ensures movement types are present
- Loads both sample data files in correct order
- Displays summary statistics
- Provides sample queries for exploration

## Data Structure

### Categories Hierarchy

```
Electronics
├── Computers
├── Peripherals
├── Networking
└── Components

Office Supplies
├── Paper Products
├── Writing Instruments
├── Filing & Storage
└── Desk Accessories

Raw Materials
├── Metals
├── Plastics
└── Textiles

Tools & Equipment
├── Hand Tools
└── Power Tools

Finished Goods
Safety Equipment
```

### Location Hierarchy

```
Main Distribution Center (WH-MAIN)
├── Zone A - Electronics
│   ├── Aisle A1 - Computers
│   │   ├── Bin A1-01
│   │   ├── Bin A1-02
│   │   └── Bin A1-03
│   ├── Aisle A2 - Peripherals
│   └── Aisle A3 - Components
├── Zone B - Office Supplies
│   ├── Aisle B1 - Paper Products
│   └── Aisle B2 - Writing & Desk
├── Zone C - Raw Materials
└── Zone D - Finished Goods

West Coast Warehouse (WH-WEST)
├── Zone A - General Storage
└── Zone B - High Value

East Coast Warehouse (WH-EAST)
├── Zone A - General Storage
└── Zone B - Bulk Storage

Returns Processing Center (WH-RET)
```

## Product Categories

### Electronics (16 products)
- **Laptops**: ProBook 15, UltraSlim 13
- **Desktops**: WorkStation Pro, Office Desktop Basic
- **Peripherals**: Mouse, Keyboard, Monitor, Webcam, Headset
- **Networking**: Router, Switch, Cables
- **Components**: RAM, SSD, Power Supply
- **Discontinued**: Legacy laptop, old mouse (for testing)

### Office Supplies (14 products)
- **Paper Products**: A4 paper, legal paper, notebooks, sticky notes
- **Writing Instruments**: Ballpoint pens, gel pens, markers, highlighters
- **Filing & Storage**: Folders, binders, storage boxes
- **Desk Accessories**: Staplers, tape dispensers, organizers

### Raw Materials (7 products)
- **Metals**: Aluminum sheets, steel bars, copper wire
- **Plastics**: ABS pellets, acrylic sheets, PVC pipes
- **Textiles**: Cotton canvas, polyester thread

### Tools (7 products)
- **Hand Tools**: Screwdriver sets, wrenches, hammers, pliers
- **Power Tools**: Cordless drills, circular saws, angle grinders

### Safety Equipment (4 products)
- Work gloves, safety glasses, ear plugs, safety vests

## Supplier Profiles

| Supplier | Specialization | Payment Terms | Lead Time |
|----------|---------------|---------------|-----------|
| TechSource Global | Electronics | Net 30 | 7-18 days |
| CompuWare Distributors | Computers | Net 45 | 12-21 days |
| Office Essentials Inc | Office Supplies | Net 15 | 2-8 days |
| Global Supply Chain Ltd | Import/Export | Net 60 | 30-45 days |
| Industrial Materials Co | Raw Materials | Net 30 | 12-25 days |
| ElectroComponents Direct | Components | Net 30 | 5-10 days |
| Paper Products Wholesale | Paper Goods | Net 15 | 2-7 days |
| ToolMaster Supply | Tools | Net 30 | 6-12 days |
| SafetyFirst Equipment | Safety Gear | Net 30 | 4-7 days |
| Asia Pacific Imports | Asian Imports | Net 90 | 30-48 days |

## Movement Types Demonstrated

| Type | Code | Affects Quantity | Count | Use Case |
|------|------|------------------|-------|----------|
| Receipt | RECEIPT | +1 | ~90 | Goods received from suppliers |
| Sale | SALE | -1 | ~120 | Goods sold to customers |
| Transfer In | TRANSFER_IN | +1 | ~10 | Goods transferred into location |
| Transfer Out | TRANSFER_OUT | -1 | ~10 | Goods transferred out of location |
| Positive Adjustment | ADJUSTMENT_POS | +1 | 3 | Cycle count corrections (found) |
| Negative Adjustment | ADJUSTMENT_NEG | -1 | 3 | Cycle count corrections (missing) |
| Return | RETURN | +1 | 10 | Customer returns |
| Damage | DAMAGE | -1 | 4 | Damaged goods write-off |

## Reorder Settings Scenarios

### Conservative (High-Value Items)
- **ProBook Laptop**: Reorder 30 when stock hits 15, max 75
- **WorkStation Desktop**: Reorder 20 when stock hits 10, max 50
- **27" Monitor**: Reorder 40 when stock hits 20, max 100

### Moderate (Standard Items)
- **Wireless Mouse**: Reorder 150 when stock hits 50, max 400
- **Mechanical Keyboard**: Reorder 100 when stock hits 40, max 250
- **Cordless Drill**: Reorder 50 when stock hits 20, max 125

### Aggressive (High-Volume Consumables)
- **A4 Paper**: Reorder 500 when stock hits 200, max 1500
- **Ballpoint Pens**: Reorder 800 when stock hits 300, max 2000
- **Safety Glasses**: Reorder 600 when stock hits 250, max 1500

### Bulk (Raw Materials)
- **ABS Pellets**: Reorder 200 when stock hits 60, max 600
- **Steel Bars**: Reorder 100 when stock hits 40, max 300
- **PVC Pipes**: Reorder 200 when stock hits 80, max 600

## Testing Scenarios Enabled

### 1. Low Stock Alerts
Several products are intentionally below reorder points after the transaction history:
- Check with the low stock query in `load_sample_data.sql`
- Tests reorder point logic and alert generation

### 2. Multi-Location Inventory
Products are distributed across multiple warehouses:
- Main Warehouse: Primary stock
- West/East Warehouses: Regional distribution
- Returns Center: Returned goods processing

### 3. Supplier Performance Analysis
Suppliers have varied performance metrics:
- Quality ratings: 4.0 to 4.9
- On-time delivery: 75% to 99%
- Total orders and deliveries tracked

### 4. Inventory Valuation
Multiple cost prices and movement dates enable:
- FIFO/LIFO calculations
- Weighted average cost
- Inventory aging analysis

### 5. Audit Trail
Complete transaction history with:
- Timestamps spanning 2 months
- User attribution (system, purchasing, sales.team, etc.)
- Reference documents (PO, SO, RMA, TRF, ADJ, DMG)
- Detailed notes explaining each transaction

### 6. Returns Processing
Customer returns demonstrate:
- Various return reasons (defective, wrong item, changed mind)
- Returns center workflow
- Quality control scenarios

### 7. Inventory Accuracy
Adjustments demonstrate:
- Cycle counting processes
- Shrinkage tracking
- Found inventory
- Damage write-offs

## Usage Instructions

### Loading the Data

```bash
# From command line
psql -d inventory_management -f load_sample_data.sql

# Or from psql prompt
\c inventory_management
\i load_sample_data.sql
```

### Clearing Sample Data

To remove sample data and start fresh:

```sql
-- Clear all sample data (keeps schema and movement types)
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
```

## Sample Queries

### Current Stock Levels
```sql
SELECT 
    p.sku,
    p.name,
    l.name as location,
    sl.quantity_on_hand,
    sl.quantity_reserved,
    sl.quantity_available,
    sl.last_movement_at
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
ORDER BY p.sku, l.name;
```

### Low Stock Alerts
```sql
SELECT 
    p.sku,
    p.name,
    l.name as location,
    sl.quantity_available,
    rs.reorder_point,
    rs.reorder_quantity,
    (rs.reorder_point - sl.quantity_available) as units_below_reorder
FROM stock_levels sl
JOIN products p ON sl.product_id = p.product_id
JOIN locations l ON sl.location_id = l.location_id
JOIN reorder_settings rs ON sl.product_id = rs.product_id 
                         AND sl.location_id = rs.location_id
WHERE sl.quantity_available <= rs.reorder_point
  AND rs.is_active = true
ORDER BY units_below_reorder DESC;
```

### Inventory Movement History
```sql
SELECT 
    p.sku,
    p.name,
    l.name as location,
    mt.name as movement_type,
    im.quantity,
    im.unit_cost,
    im.reference_document,
    im.notes,
    im.created_by,
    im.created_at
FROM inventory_movements im
JOIN products p ON im.product_id = p.product_id
JOIN locations l ON im.location_id = l.location_id
JOIN movement_types mt ON im.movement_type_id = mt.movement_type_id
ORDER BY im.created_at DESC
LIMIT 50;
```

### Supplier Performance
```sql
SELECT 
    s.name as supplier,
    COUNT(DISTINCT ps.product_id) as products_supplied,
    ROUND(AVG(ps.quality_rating), 2) as avg_quality_rating,
    ROUND(AVG(ps.on_time_delivery_rate) * 100, 1) as avg_on_time_pct,
    SUM(ps.total_orders) as total_orders,
    SUM(ps.total_delivered) as total_delivered,
    ROUND(AVG(ps.lead_time_days), 1) as avg_lead_time_days
FROM product_suppliers ps
JOIN suppliers s ON ps.supplier_id = s.supplier_id
WHERE ps.is_active = true
GROUP BY s.supplier_id, s.name
ORDER BY avg_quality_rating DESC, avg_on_time_pct DESC;
```

### Inventory Valuation by Category
```sql
SELECT 
    c.name as category,
    COUNT(DISTINCT p.product_id) as product_count,
    SUM(sl.quantity_on_hand) as total_units,
    SUM(sl.quantity_on_hand * p.cost_price) as inventory_value_cost,
    SUM(sl.quantity_on_hand * p.selling_price) as inventory_value_retail
FROM categories c
JOIN products p ON c.category_id = p.category_id
LEFT JOIN stock_levels sl ON p.product_id = sl.product_id
WHERE p.status = 'active'
GROUP BY c.category_id, c.name
ORDER BY inventory_value_cost DESC;
```

### Products with No Stock
```sql
SELECT 
    p.sku,
    p.name,
    p.status,
    c.name as category
FROM products p
JOIN categories c ON p.category_id = c.category_id
LEFT JOIN stock_levels sl ON p.product_id = sl.product_id
WHERE sl.stock_level_id IS NULL
   OR sl.quantity_on_hand = 0
ORDER BY p.sku;
```

## Data Characteristics

### Volume Statistics
- **Total Products**: 50 (48 active, 2 discontinued)
- **Total Locations**: 20 (4 warehouses, 8 zones, 5 aisles, 3 bins)
- **Total Suppliers**: 10
- **Product-Supplier Relationships**: 70+
- **Reorder Settings**: 60+
- **Inventory Movements**: 250+
- **Stock Levels**: Auto-generated based on movements

### Date Range
- **Initial Stock**: December 1-3, 2023
- **Transfers**: December 5-6, 2023
- **Sales Period**: December 10-30, 2023
- **Replenishment**: January 8-15, 2024
- **Returns**: January 10-20, 2024
- **Adjustments**: January 15-21, 2024
- **Recent Sales**: January 22-30, 2024

### Value Distribution
- **Low-value items**: $3-$50 (office supplies, small tools)
- **Mid-value items**: $50-$500 (peripherals, tools, materials)
- **High-value items**: $500-$2000 (laptops, desktops, equipment)

## Maintenance

### Updating Sample Data
To modify or extend the sample data:
1. Edit `sample_data.sql` for foundational data
2. Edit `sample_data_movements.sql` for transaction history
3. Reload using `load_sample_data.sql`

### Adding New Scenarios
To add new testing scenarios:
1. Add new products/categories in `sample_data.sql`
2. Add corresponding movements in `sample_data_movements.sql`
3. Update this documentation

## Requirements Coverage

This sample data validates all requirements from the specification:

- **Requirement 1**: Product information with SKU, attributes, pricing, status
- **Requirement 2**: Stock levels by location, reserved quantities, hierarchical locations
- **Requirement 3**: Supplier information, product-supplier relationships, reorder points
- **Requirement 4**: Complete inventory movement tracking with audit trail
- **Requirement 5**: Data for stock reports, valuation, aging, low stock alerts, turnover analysis
