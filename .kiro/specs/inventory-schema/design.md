# Inventory Schema Design Document

## Overview

This document outlines the design for a comprehensive PostgreSQL inventory management schema. The design follows relational database best practices, implements proper normalization, and includes performance optimizations for common inventory operations. The schema supports multi-location inventory tracking, supplier management, and complete audit trails.

## Architecture

### Database Design Principles

- **Normalization**: Tables are normalized to 3NF to eliminate redundancy while maintaining performance
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Audit Trail**: Complete transaction history with timestamps and user tracking
- **Performance**: Strategic indexing and partitioning for high-volume operations
- **Scalability**: Design supports multiple warehouses, locations, and high transaction volumes

### Core Entity Relationships

```
Products (1) ←→ (M) ProductSuppliers (M) ←→ (1) Suppliers
Products (1) ←→ (M) StockLevels (M) ←→ (1) Locations
Products (1) ←→ (M) InventoryMovements
Locations (1) ←→ (M) InventoryMovements
```

## Components and Interfaces

### 1. Product Management Component

**Tables:**
- `categories`: Product classification hierarchy
- `products`: Core product information
- `product_attributes`: Flexible key-value attributes

**Key Features:**
- Hierarchical category structure with self-referencing foreign keys
- Flexible attribute system for varying product properties
- SKU uniqueness enforcement
- Product lifecycle status tracking

### 2. Location Management Component

**Tables:**
- `locations`: Storage locations with hierarchical organization
- `location_types`: Classification of location types

**Key Features:**
- Hierarchical location structure (warehouse → zone → aisle → bin)
- Location capacity and restrictions
- Active/inactive status management

### 3. Stock Management Component

**Tables:**
- `stock_levels`: Current inventory quantities by product and location
- `reorder_settings`: Automated reordering configuration

**Key Features:**
- Real-time stock level tracking
- Reserved quantity management
- Reorder point automation
- Multi-location stock aggregation

### 4. Supplier Management Component

**Tables:**
- `suppliers`: Vendor information and contact details
- `product_suppliers`: Product-supplier relationships with terms

**Key Features:**
- Multiple suppliers per product
- Lead time and minimum order quantity tracking
- Preferred supplier designation
- Supplier performance metrics

### 5. Transaction Management Component

**Tables:**
- `inventory_movements`: All inventory transactions
- `movement_types`: Classification of transaction types

**Key Features:**
- Complete audit trail with timestamps
- Atomic stock level updates via triggers
- Document reference tracking
- User accountability

## Data Models

### Core Tables Schema

```sql
-- Categories with hierarchical structure
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products master table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(category_id),
    unit_of_measure VARCHAR(20) NOT NULL,
    weight_kg DECIMAL(10,3),
    length_cm DECIMAL(8,2),
    width_cm DECIMAL(8,2),
    height_cm DECIMAL(8,2),
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage locations with hierarchy
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    parent_location_id INTEGER REFERENCES locations(location_id),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current stock levels
CREATE TABLE stock_levels (
    stock_level_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, location_id),
    CONSTRAINT positive_quantities CHECK (quantity_on_hand >= 0 AND quantity_reserved >= 0)
);

-- Suppliers information
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    payment_terms VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product-supplier relationships
CREATE TABLE product_suppliers (
    product_supplier_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id),
    supplier_sku VARCHAR(100),
    lead_time_days INTEGER,
    minimum_order_qty INTEGER,
    cost_price DECIMAL(12,2),
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, supplier_id)
);

-- Reorder settings
CREATE TABLE reorder_settings (
    reorder_setting_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    maximum_stock INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(product_id, location_id)
);

-- Movement types lookup
CREATE TABLE movement_types (
    movement_type_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    affects_quantity INTEGER NOT NULL CHECK (affects_quantity IN (-1, 1))
);

-- All inventory movements
CREATE TABLE inventory_movements (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    movement_type_id INTEGER NOT NULL REFERENCES movement_types(movement_type_id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_document VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance

```sql
-- Primary performance indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_location ON stock_levels(location_id);
CREATE INDEX idx_movements_product_date ON inventory_movements(product_id, created_at);
CREATE INDEX idx_movements_location_date ON inventory_movements(location_id, created_at);
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
```

## Error Handling

### Data Integrity Constraints

1. **Stock Level Validation**: Check constraints prevent negative quantities
2. **SKU Uniqueness**: Unique constraints on product SKUs and supplier codes
3. **Referential Integrity**: Foreign key constraints maintain relationships
4. **Status Validation**: Check constraints ensure valid status values

### Transaction Safety

1. **Atomic Updates**: Stock level changes wrapped in transactions
2. **Trigger-based Updates**: Automatic stock level updates from movements
3. **Deadlock Prevention**: Consistent lock ordering in concurrent operations
4. **Rollback Procedures**: Error handling with transaction rollback

### Business Rule Enforcement

```sql
-- Trigger to update stock levels from movements
CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand)
    VALUES (NEW.product_id, NEW.location_id, 
            CASE WHEN (SELECT affects_quantity FROM movement_types WHERE movement_type_id = NEW.movement_type_id) = 1 
                 THEN NEW.quantity 
                 ELSE -NEW.quantity 
            END)
    ON CONFLICT (product_id, location_id)
    DO UPDATE SET 
        quantity_on_hand = stock_levels.quantity_on_hand + 
            CASE WHEN (SELECT affects_quantity FROM movement_types WHERE movement_type_id = NEW.movement_type_id) = 1 
                 THEN NEW.quantity 
                 ELSE -NEW.quantity 
            END,
        last_movement_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_levels
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_levels();
```

## Testing Strategy

### Unit Testing Approach

1. **Constraint Testing**: Verify all check constraints and foreign key relationships
2. **Trigger Testing**: Validate stock level updates from inventory movements
3. **Function Testing**: Test custom functions for calculations and validations
4. **Index Performance**: Verify query performance with realistic data volumes

### Integration Testing

1. **Transaction Testing**: Multi-table operations with rollback scenarios
2. **Concurrent Access**: Multiple users updating inventory simultaneously
3. **Data Migration**: Import/export procedures and data validation
4. **Reporting Queries**: Complex analytical queries with performance benchmarks

### Performance Testing

1. **Load Testing**: High-volume inventory movements and stock queries
2. **Scalability Testing**: Performance with millions of products and movements
3. **Index Optimization**: Query plan analysis and index effectiveness
4. **Partitioning Strategy**: Large table partitioning for historical data