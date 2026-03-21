-- Create stock management tables

-- Movement types lookup table
CREATE TABLE IF NOT EXISTS movement_types (
    movement_type_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    affects_quantity INTEGER NOT NULL,
    CONSTRAINT movement_types_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT movement_types_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT movement_types_affects_quantity_valid CHECK (affects_quantity IN (-1, 1))
);

-- Current stock levels with generated available quantity
CREATE TABLE IF NOT EXISTS stock_levels (
    stock_level_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_levels_unique_product_location UNIQUE(product_id, location_id),
    CONSTRAINT stock_levels_positive_quantities CHECK (
        quantity_on_hand >= 0 AND 
        quantity_reserved >= 0 AND 
        quantity_reserved <= quantity_on_hand
    )
);

-- All inventory movements for audit trail
CREATE TABLE IF NOT EXISTS inventory_movements (
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
    CONSTRAINT inventory_movements_quantity_not_zero CHECK (quantity != 0),
    CONSTRAINT inventory_movements_created_by_not_empty CHECK (LENGTH(TRIM(created_by)) > 0),
    CONSTRAINT inventory_movements_unit_cost_positive CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- Reorder settings for automated reordering
CREATE TABLE IF NOT EXISTS reorder_settings (
    reorder_setting_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    maximum_stock INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reorder_settings_unique_product_location UNIQUE(product_id, location_id),
    CONSTRAINT reorder_settings_positive_values CHECK (
        reorder_point >= 0 AND 
        reorder_quantity > 0 AND 
        (maximum_stock IS NULL OR maximum_stock >= reorder_point)
    )
);

-- Stock management indexes
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_available ON stock_levels(quantity_available) WHERE quantity_available > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_location_date ON inventory_movements(location_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type_id);
CREATE INDEX IF NOT EXISTS idx_reorder_settings_product ON reorder_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_settings_location ON reorder_settings(location_id);
CREATE INDEX IF NOT EXISTS idx_reorder_settings_active ON reorder_settings(is_active) WHERE is_active = true;

-- Function to update stock levels from inventory movements
CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
DECLARE
    quantity_adjustment INTEGER;
BEGIN
    SELECT affects_quantity * NEW.quantity 
    INTO quantity_adjustment
    FROM movement_types 
    WHERE movement_type_id = NEW.movement_type_id;
    
    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand, last_movement_at)
    VALUES (NEW.product_id, NEW.location_id, quantity_adjustment, NEW.created_at)
    ON CONFLICT (product_id, location_id)
    DO UPDATE SET 
        quantity_on_hand = stock_levels.quantity_on_hand + quantity_adjustment,
        last_movement_at = NEW.created_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock levels when movements are inserted
DROP TRIGGER IF EXISTS trigger_update_stock_levels ON inventory_movements;
CREATE TRIGGER trigger_update_stock_levels
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_levels();

-- Insert default movement types
INSERT INTO movement_types (code, name, description, affects_quantity) VALUES
('RECEIPT', 'Receipt', 'Inventory received from supplier', 1),
('SALE', 'Sale', 'Inventory sold to customer', -1),
('SHIP', 'Shipment', 'Inventory shipped to customer', -1),
('TRANSFER_OUT', 'Transfer Out', 'Inventory transferred to another location', -1),
('TRANSFER_IN', 'Transfer In', 'Inventory received from another location', 1),
('ADJUSTMENT_IN', 'Adjustment In', 'Positive inventory adjustment', 1),
('ADJUSTMENT_OUT', 'Adjustment Out', 'Negative inventory adjustment', -1),
('RETURN', 'Return', 'Inventory returned from customer', 1),
('DAMAGE', 'Damage', 'Inventory damaged or lost', -1)
ON CONFLICT (code) DO NOTHING;
