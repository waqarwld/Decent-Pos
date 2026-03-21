-- Inventory Management Database Schema
-- PostgreSQL implementation for comprehensive inventory tracking

-- Enable UUID extension for potential future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Categories table with hierarchical structure
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
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
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT products_sku_not_empty CHECK (LENGTH(TRIM(sku)) > 0),
    CONSTRAINT products_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT products_uom_not_empty CHECK (LENGTH(TRIM(unit_of_measure)) > 0),
    CONSTRAINT products_status_valid CHECK (status IN ('active', 'discontinued', 'pending')),
    CONSTRAINT products_weight_positive CHECK (weight_kg IS NULL OR weight_kg >= 0),
    CONSTRAINT products_dimensions_positive CHECK (
        (length_cm IS NULL OR length_cm >= 0) AND
        (width_cm IS NULL OR width_cm >= 0) AND
        (height_cm IS NULL OR height_cm >= 0)
    ),
    CONSTRAINT products_prices_positive CHECK (
        (cost_price IS NULL OR cost_price >= 0) AND
        (selling_price IS NULL OR selling_price >= 0)
    )
);

-- Storage locations with hierarchical organization
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    parent_location_id INTEGER REFERENCES locations(location_id),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT locations_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT locations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT locations_type_not_empty CHECK (LENGTH(TRIM(location_type)) > 0),
    CONSTRAINT locations_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT suppliers_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT suppliers_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT suppliers_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Categories indexes
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_name ON categories(name);

-- Products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_active ON products(status) WHERE status = 'active';

-- Locations indexes
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_parent ON locations(parent_location_id);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_active ON locations(is_active) WHERE is_active = true;

-- Suppliers indexes
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = true;

-- =============================================================================
-- SUPPLIER-PRODUCT RELATIONSHIP TABLES
-- =============================================================================

-- Product-supplier relationships with terms and performance tracking
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
    
    -- Performance tracking fields
    average_delivery_days DECIMAL(5,2),
    on_time_delivery_rate DECIMAL(5,4), -- Percentage as decimal (0.95 = 95%)
    quality_rating DECIMAL(3,2), -- Rating out of 5.00
    total_orders INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    last_order_date DATE,
    last_delivery_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT product_suppliers_unique_product_supplier UNIQUE(product_id, supplier_id),
    CONSTRAINT product_suppliers_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    CONSTRAINT product_suppliers_min_order_positive CHECK (minimum_order_qty IS NULL OR minimum_order_qty > 0),
    CONSTRAINT product_suppliers_cost_positive CHECK (cost_price IS NULL OR cost_price >= 0),
    CONSTRAINT product_suppliers_delivery_days_positive CHECK (average_delivery_days IS NULL OR average_delivery_days >= 0),
    CONSTRAINT product_suppliers_delivery_rate_valid CHECK (
        on_time_delivery_rate IS NULL OR 
        (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 1)
    ),
    CONSTRAINT product_suppliers_quality_rating_valid CHECK (
        quality_rating IS NULL OR 
        (quality_rating >= 0 AND quality_rating <= 5)
    ),
    CONSTRAINT product_suppliers_order_counts_valid CHECK (
        total_orders >= 0 AND 
        total_delivered >= 0 AND 
        total_delivered <= total_orders
    )
);

-- Product-supplier relationship indexes for performance
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_product_suppliers_preferred ON product_suppliers(product_id, is_preferred) WHERE is_preferred = true;
CREATE INDEX idx_product_suppliers_active ON product_suppliers(is_active) WHERE is_active = true;
CREATE INDEX idx_product_suppliers_supplier_sku ON product_suppliers(supplier_id, supplier_sku);
CREATE INDEX idx_product_suppliers_performance ON product_suppliers(quality_rating DESC, on_time_delivery_rate DESC) WHERE is_active = true;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables with updated_at columns
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Table comments
COMMENT ON TABLE categories IS 'Product categories with hierarchical structure support';
COMMENT ON TABLE products IS 'Master product catalog with detailed attributes and pricing';
COMMENT ON TABLE locations IS 'Storage locations with hierarchical organization (warehouse > zone > aisle > bin)';
COMMENT ON TABLE suppliers IS 'Vendor information and contact details for procurement';

-- Key column comments
COMMENT ON COLUMN categories.parent_category_id IS 'Self-reference for hierarchical category structure';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.status IS 'Product lifecycle status: active, discontinued, pending';
COMMENT ON COLUMN locations.location_type IS 'Type of location: warehouse, zone, aisle, bin, etc.';
COMMENT ON COLUMN locations.parent_location_id IS 'Self-reference for hierarchical location structure';
COMMENT ON COLUMN suppliers.payment_terms IS 'Payment terms and conditions for this supplier';$'
 
   )
);

-- =============================================================================
-- STOCK MANAGEMENT TABLES
-- =============================================================================

-- Movement types lookup table
CREATE TABLE movement_types (
    movement_type_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    affects_quantity INTEGER NOT NULL,
    
    -- Constraints
    CONSTRAINT movement_types_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT movement_types_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT movement_types_affects_quantity_valid CHECK (affects_quantity IN (-1, 1))
);

-- Current stock levels with generated available quantity
CREATE TABLE stock_levels (
    stock_level_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT stock_levels_unique_product_location UNIQUE(product_id, location_id),
    CONSTRAINT stock_levels_positive_quantities CHECK (
        quantity_on_hand >= 0 AND 
        quantity_reserved >= 0 AND 
        quantity_reserved <= quantity_on_hand
    )
);

-- All inventory movements for audit trail
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT inventory_movements_quantity_not_zero CHECK (quantity != 0),
    CONSTRAINT inventory_movements_created_by_not_empty CHECK (LENGTH(TRIM(created_by)) > 0),
    CONSTRAINT inventory_movements_unit_cost_positive CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- Reorder settings for automated reordering
CREATE TABLE reorder_settings (
    reorder_setting_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    maximum_stock INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT reorder_settings_unique_product_location UNIQUE(product_id, location_id),
    CONSTRAINT reorder_settings_positive_values CHECK (
        reorder_point >= 0 AND 
        reorder_quantity > 0 AND 
        (maximum_stock IS NULL OR maximum_stock >= reorder_point)
    )
);

-- Stock management indexes
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_location ON stock_levels(location_id);
CREATE INDEX idx_stock_levels_available ON stock_levels(quantity_available) WHERE quantity_available > 0;
CREATE INDEX idx_inventory_movements_product_date ON inventory_movements(product_id, created_at);
CREATE INDEX idx_inventory_movements_location_date ON inventory_movements(location_id, created_at);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type_id);
CREATE INDEX idx_reorder_settings_product ON reorder_settings(product_id);
CREATE INDEX idx_reorder_settings_location ON reorder_settings(location_id);
CREATE INDEX idx_reorder_settings_active ON reorder_settings(is_active) WHERE is_active = true;

-- =============================================================================
-- STOCK MANAGEMENT TRIGGERS
-- =============================================================================

-- Function to update stock levels from inventory movements
CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $
BEGIN
    -- Get the quantity adjustment based on movement type
    DECLARE
        quantity_adjustment INTEGER;
    BEGIN
        SELECT affects_quantity * NEW.quantity 
        INTO quantity_adjustment
        FROM movement_types 
        WHERE movement_type_id = NEW.movement_type_id;
        
        -- Insert or update stock levels
        INSERT INTO stock_levels (product_id, location_id, quantity_on_hand, last_movement_at)
        VALUES (NEW.product_id, NEW.location_id, quantity_adjustment, NEW.created_at)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET 
            quantity_on_hand = stock_levels.quantity_on_hand + quantity_adjustment,
            last_movement_at = NEW.created_at;
        
        RETURN NEW;
    END;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically update stock levels when movements are inserted
CREATE TRIGGER trigger_update_stock_levels
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_levels();

-- Add update trigger for reorder_settings
CREATE TRIGGER trigger_reorder_settings_updated_at
    BEFORE UPDATE ON reorder_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add update trigger for product_suppliers
CREATE TRIGGER trigger_product_suppliers_updated_at
    BEFORE UPDATE ON product_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STOCK MANAGEMENT COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE movement_types IS 'Lookup table for different types of inventory movements';
COMMENT ON TABLE stock_levels IS 'Current stock quantities by product and location with generated available quantity';
COMMENT ON TABLE inventory_movements IS 'Complete audit trail of all inventory transactions';
COMMENT ON TABLE reorder_settings IS 'Automated reordering configuration by product and location';
COMMENT ON TABLE product_suppliers IS 'Product-supplier relationships with terms and performance tracking';

-- Key column comments
COMMENT ON COLUMN movement_types.affects_quantity IS 'Multiplier for quantity: 1 for increases (receipts), -1 for decreases (sales)';
COMMENT ON COLUMN stock_levels.quantity_available IS 'Generated column: quantity_on_hand - quantity_reserved';
COMMENT ON COLUMN stock_levels.quantity_reserved IS 'Quantity allocated but not yet shipped';
COMMENT ON COLUMN inventory_movements.quantity IS 'Quantity moved (always positive, direction determined by movement type)';
COMMENT ON COLUMN reorder_settings.reorder_point IS 'Stock level that triggers reorder';
COMMENT ON COLUMN reorder_settings.maximum_stock IS 'Maximum stock level to maintain';
COMMENT ON COLUMN product_suppliers.supplier_sku IS 'Supplier''s internal SKU/part number for this product';
COMMENT ON COLUMN product_suppliers.is_preferred IS 'Indicates if this is the preferred supplier for this product';
COMMENT ON COLUMN product_suppliers.average_delivery_days IS 'Average actual delivery time in days';
COMMENT ON COLUMN product_suppliers.on_time_delivery_rate IS 'Percentage of orders delivered on time (0.0-1.0)';
COMMENT ON COLUMN product_suppliers.quality_rating IS 'Quality rating from 0.0 to 5.0 based on received goods';
COMMENT ON COLUMN product_suppliers.total_orders IS 'Total number of orders placed with this supplier for this product';
COMMENT ON COLUMN product_suppliers.total_delivered IS 'Total number of orders successfully delivered';