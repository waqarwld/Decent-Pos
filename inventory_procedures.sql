-- Inventory Movement Stored Procedures
-- PostgreSQL implementation for common inventory operations
-- Provides atomic transaction handling with error management

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to validate product exists and is active
CREATE OR REPLACE FUNCTION validate_product(p_product_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM products 
        WHERE product_id = p_product_id AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate location exists and is active
CREATE OR REPLACE FUNCTION validate_location(p_location_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM locations 
        WHERE location_id = p_location_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get current stock quantity
CREATE OR REPLACE FUNCTION get_stock_quantity(
    p_product_id INTEGER,
    p_location_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_quantity INTEGER;
BEGIN
    SELECT quantity_on_hand INTO v_quantity
    FROM stock_levels
    WHERE product_id = p_product_id AND location_id = p_location_id;
    
    RETURN COALESCE(v_quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RECEIVE INVENTORY PROCEDURE
-- =============================================================================

CREATE OR REPLACE FUNCTION receive_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    movement_id INTEGER,
    new_stock_level INTEGER
) AS $$
DECLARE
    v_movement_id INTEGER;
    v_new_stock INTEGER;
    v_movement_type_id INTEGER;
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RETURN QUERY SELECT false, 'Quantity must be positive', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF p_unit_cost < 0 THEN
        RETURN QUERY SELECT false, 'Unit cost cannot be negative', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF LENGTH(TRIM(p_created_by)) = 0 THEN
        RETURN QUERY SELECT false, 'Created by user is required', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate product exists and is active
    IF NOT validate_product(p_product_id) THEN
        RETURN QUERY SELECT false, 'Product does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate location exists and is active
    IF NOT validate_location(p_location_id) THEN
        RETURN QUERY SELECT false, 'Location does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get movement type ID for RECEIPT
    SELECT movement_type_id INTO v_movement_type_id
    FROM movement_types
    WHERE code = 'RECEIPT';
    
    IF v_movement_type_id IS NULL THEN
        RETURN QUERY SELECT false, 'RECEIPT movement type not found', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert inventory movement (trigger will update stock levels)
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_location_id,
        v_movement_type_id,
        p_quantity,
        p_unit_cost,
        p_reference_document,
        p_notes,
        p_created_by
    ) RETURNING inventory_movements.movement_id INTO v_movement_id;
    
    -- Get new stock level
    v_new_stock := get_stock_quantity(p_product_id, p_location_id);
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        'Inventory received successfully'::TEXT, 
        v_movement_id, 
        v_new_stock;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            'Error receiving inventory: ' || SQLERRM, 
            NULL::INTEGER, 
            NULL::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SHIP INVENTORY PROCEDURE
-- =============================================================================

CREATE OR REPLACE FUNCTION ship_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    movement_id INTEGER,
    new_stock_level INTEGER
) AS $$
DECLARE
    v_movement_id INTEGER;
    v_new_stock INTEGER;
    v_current_stock INTEGER;
    v_movement_type_id INTEGER;
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RETURN QUERY SELECT false, 'Quantity must be positive', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF p_unit_cost < 0 THEN
        RETURN QUERY SELECT false, 'Unit cost cannot be negative', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF LENGTH(TRIM(p_created_by)) = 0 THEN
        RETURN QUERY SELECT false, 'Created by user is required', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate product exists and is active
    IF NOT validate_product(p_product_id) THEN
        RETURN QUERY SELECT false, 'Product does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate location exists and is active
    IF NOT validate_location(p_location_id) THEN
        RETURN QUERY SELECT false, 'Location does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Check if sufficient stock is available
    v_current_stock := get_stock_quantity(p_product_id, p_location_id);
    IF v_current_stock < p_quantity THEN
        RETURN QUERY SELECT 
            false, 
            'Insufficient stock. Available: ' || v_current_stock || ', Requested: ' || p_quantity, 
            NULL::INTEGER, 
            NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get movement type ID for SALE
    SELECT movement_type_id INTO v_movement_type_id
    FROM movement_types
    WHERE code = 'SALE';
    
    IF v_movement_type_id IS NULL THEN
        RETURN QUERY SELECT false, 'SALE movement type not found', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert inventory movement (trigger will update stock levels)
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_location_id,
        v_movement_type_id,
        p_quantity,
        p_unit_cost,
        p_reference_document,
        p_notes,
        p_created_by
    ) RETURNING inventory_movements.movement_id INTO v_movement_id;
    
    -- Get new stock level
    v_new_stock := get_stock_quantity(p_product_id, p_location_id);
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        'Inventory shipped successfully'::TEXT, 
        v_movement_id, 
        v_new_stock;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            'Error shipping inventory: ' || SQLERRM, 
            NULL::INTEGER, 
            NULL::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRANSFER INVENTORY PROCEDURE
-- =============================================================================

CREATE OR REPLACE FUNCTION transfer_inventory(
    p_product_id INTEGER,
    p_from_location_id INTEGER,
    p_to_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    movement_out_id INTEGER,
    movement_in_id INTEGER,
    from_stock_level INTEGER,
    to_stock_level INTEGER
) AS $$
DECLARE
    v_movement_out_id INTEGER;
    v_movement_in_id INTEGER;
    v_from_stock INTEGER;
    v_to_stock INTEGER;
    v_current_stock INTEGER;
    v_transfer_out_type_id INTEGER;
    v_transfer_in_type_id INTEGER;
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RETURN QUERY SELECT false, 'Quantity must be positive', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF p_unit_cost < 0 THEN
        RETURN QUERY SELECT false, 'Unit cost cannot be negative', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF LENGTH(TRIM(p_created_by)) = 0 THEN
        RETURN QUERY SELECT false, 'Created by user is required', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF p_from_location_id = p_to_location_id THEN
        RETURN QUERY SELECT false, 'Source and destination locations must be different', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate product exists and is active
    IF NOT validate_product(p_product_id) THEN
        RETURN QUERY SELECT false, 'Product does not exist or is not active', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate both locations exist and are active
    IF NOT validate_location(p_from_location_id) THEN
        RETURN QUERY SELECT false, 'Source location does not exist or is not active', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF NOT validate_location(p_to_location_id) THEN
        RETURN QUERY SELECT false, 'Destination location does not exist or is not active', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Check if sufficient stock is available at source location
    v_current_stock := get_stock_quantity(p_product_id, p_from_location_id);
    IF v_current_stock < p_quantity THEN
        RETURN QUERY SELECT 
            false, 
            'Insufficient stock at source location. Available: ' || v_current_stock || ', Requested: ' || p_quantity, 
            NULL::INTEGER, 
            NULL::INTEGER,
            NULL::INTEGER,
            NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get movement type IDs
    SELECT movement_type_id INTO v_transfer_out_type_id
    FROM movement_types WHERE code = 'TRANSFER_OUT';
    
    SELECT movement_type_id INTO v_transfer_in_type_id
    FROM movement_types WHERE code = 'TRANSFER_IN';
    
    IF v_transfer_out_type_id IS NULL OR v_transfer_in_type_id IS NULL THEN
        RETURN QUERY SELECT false, 'Transfer movement types not found', NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert transfer out movement
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_from_location_id,
        v_transfer_out_type_id,
        p_quantity,
        p_unit_cost,
        p_reference_document,
        p_notes || ' (Transfer Out)',
        p_created_by
    ) RETURNING inventory_movements.movement_id INTO v_movement_out_id;
    
    -- Insert transfer in movement
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_to_location_id,
        v_transfer_in_type_id,
        p_quantity,
        p_unit_cost,
        p_reference_document,
        p_notes || ' (Transfer In)',
        p_created_by
    ) RETURNING inventory_movements.movement_id INTO v_movement_in_id;
    
    -- Get new stock levels
    v_from_stock := get_stock_quantity(p_product_id, p_from_location_id);
    v_to_stock := get_stock_quantity(p_product_id, p_to_location_id);
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        'Inventory transferred successfully'::TEXT, 
        v_movement_out_id, 
        v_movement_in_id,
        v_from_stock,
        v_to_stock;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            'Error transferring inventory: ' || SQLERRM, 
            NULL::INTEGER, 
            NULL::INTEGER,
            NULL::INTEGER,
            NULL::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ADJUST INVENTORY PROCEDURE
-- =============================================================================

CREATE OR REPLACE FUNCTION adjust_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_adjustment_quantity INTEGER,
    p_reason TEXT,
    p_reference_document VARCHAR(100),
    p_created_by VARCHAR(100)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    movement_id INTEGER,
    new_stock_level INTEGER
) AS $$
DECLARE
    v_movement_id INTEGER;
    v_new_stock INTEGER;
    v_current_stock INTEGER;
    v_movement_type_id INTEGER;
    v_adjustment_type VARCHAR(20);
    v_abs_quantity INTEGER;
BEGIN
    -- Validate inputs
    IF p_adjustment_quantity = 0 THEN
        RETURN QUERY SELECT false, 'Adjustment quantity cannot be zero', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF LENGTH(TRIM(p_created_by)) = 0 THEN
        RETURN QUERY SELECT false, 'Created by user is required', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    IF LENGTH(TRIM(p_reason)) = 0 THEN
        RETURN QUERY SELECT false, 'Reason for adjustment is required', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate product exists and is active
    IF NOT validate_product(p_product_id) THEN
        RETURN QUERY SELECT false, 'Product does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Validate location exists and is active
    IF NOT validate_location(p_location_id) THEN
        RETURN QUERY SELECT false, 'Location does not exist or is not active', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Determine adjustment type and validate stock for negative adjustments
    v_abs_quantity := ABS(p_adjustment_quantity);
    
    IF p_adjustment_quantity > 0 THEN
        v_adjustment_type := 'ADJUSTMENT_POS';
    ELSE
        v_adjustment_type := 'ADJUSTMENT_NEG';
        
        -- Check if sufficient stock exists for negative adjustment
        v_current_stock := get_stock_quantity(p_product_id, p_location_id);
        IF v_current_stock < v_abs_quantity THEN
            RETURN QUERY SELECT 
                false, 
                'Insufficient stock for adjustment. Available: ' || v_current_stock || ', Adjustment: ' || v_abs_quantity, 
                NULL::INTEGER, 
                NULL::INTEGER;
            RETURN;
        END IF;
    END IF;
    
    -- Get movement type ID
    SELECT movement_type_id INTO v_movement_type_id
    FROM movement_types
    WHERE code = v_adjustment_type;
    
    IF v_movement_type_id IS NULL THEN
        RETURN QUERY SELECT false, 'Adjustment movement type not found', NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insert inventory movement (trigger will update stock levels)
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_location_id,
        v_movement_type_id,
        v_abs_quantity,
        NULL,  -- Unit cost not applicable for adjustments
        p_reference_document,
        p_reason,
        p_created_by
    ) RETURNING inventory_movements.movement_id INTO v_movement_id;
    
    -- Get new stock level
    v_new_stock := get_stock_quantity(p_product_id, p_location_id);
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        'Inventory adjusted successfully'::TEXT, 
        v_movement_id, 
        v_new_stock;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            'Error adjusting inventory: ' || SQLERRM, 
            NULL::INTEGER, 
            NULL::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION receive_inventory IS 'Records inventory receipt from supplier with validation and error handling';
COMMENT ON FUNCTION ship_inventory IS 'Records inventory shipment to customer with stock validation';
COMMENT ON FUNCTION transfer_inventory IS 'Transfers inventory between locations atomically';
COMMENT ON FUNCTION adjust_inventory IS 'Adjusts inventory levels for counts, damage, or corrections';
COMMENT ON FUNCTION validate_product IS 'Helper function to validate product exists and is active';
COMMENT ON FUNCTION validate_location IS 'Helper function to validate location exists and is active';
COMMENT ON FUNCTION get_stock_quantity IS 'Helper function to retrieve current stock quantity';
