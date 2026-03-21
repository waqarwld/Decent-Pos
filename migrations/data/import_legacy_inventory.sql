-- Data Migration: Import Legacy Inventory Levels
-- Description: Imports stock levels from a legacy system
-- Prerequisites: Products and locations must already exist in the system

-- Create staging table for legacy inventory data
CREATE TEMP TABLE IF NOT EXISTS staging_inventory (
    legacy_product_id VARCHAR(50),
    product_sku VARCHAR(50),
    location_code VARCHAR(50),
    quantity INTEGER,
    reserved_qty INTEGER,
    last_count_date DATE,
    import_notes TEXT
);

-- Function to import inventory from staging table
CREATE OR REPLACE FUNCTION import_legacy_inventory()
RETURNS TABLE(
    imported_count INTEGER,
    skipped_count INTEGER,
    error_count INTEGER,
    details TEXT
) AS $
DECLARE
    v_imported INTEGER := 0;
    v_skipped INTEGER := 0;
    v_errors INTEGER := 0;
    v_product_id INTEGER;
    v_location_id INTEGER;
    v_details TEXT := '';
BEGIN
    -- Create import log table if it doesn't exist
    CREATE TEMP TABLE IF NOT EXISTS inventory_import_log (
        product_sku VARCHAR(50),
        location_code VARCHAR(50),
        status VARCHAR(20),
        message TEXT,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Process each staging record
    FOR rec IN SELECT * FROM staging_inventory LOOP
        BEGIN
            -- Find product by SKU
            SELECT product_id INTO v_product_id
            FROM products
            WHERE sku = rec.product_sku;
            
            IF v_product_id IS NULL THEN
                v_errors := v_errors + 1;
                INSERT INTO inventory_import_log (product_sku, location_code, status, message)
                VALUES (rec.product_sku, rec.location_code, 'ERROR', 'Product not found');
                CONTINUE;
            END IF;
            
            -- Find location by code
            SELECT location_id INTO v_location_id
            FROM locations
            WHERE code = rec.location_code;
            
            IF v_location_id IS NULL THEN
                v_errors := v_errors + 1;
                INSERT INTO inventory_import_log (product_sku, location_code, status, message)
                VALUES (rec.product_sku, rec.location_code, 'ERROR', 'Location not found');
                CONTINUE;
            END IF;
            
            -- Insert or update stock level
            INSERT INTO stock_levels (
                product_id,
                location_id,
                quantity_on_hand,
                quantity_reserved,
                last_counted_at
            ) VALUES (
                v_product_id,
                v_location_id,
                COALESCE(rec.quantity, 0),
                COALESCE(rec.reserved_qty, 0),
                rec.last_count_date
            )
            ON CONFLICT (product_id, location_id)
            DO UPDATE SET
                quantity_on_hand = EXCLUDED.quantity_on_hand,
                quantity_reserved = EXCLUDED.quantity_reserved,
                last_counted_at = EXCLUDED.last_counted_at;
            
            v_imported := v_imported + 1;
            INSERT INTO inventory_import_log (product_sku, location_code, status, message)
            VALUES (rec.product_sku, rec.location_code, 'SUCCESS', 'Inventory imported');
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO inventory_import_log (product_sku, location_code, status, message)
            VALUES (rec.product_sku, rec.location_code, 'ERROR', SQLERRM);
        END;
    END LOOP;
    
    -- Build details message
    v_details := format('Imported: %s, Skipped: %s, Errors: %s', v_imported, v_skipped, v_errors);
    
    RETURN QUERY SELECT v_imported, v_skipped, v_errors, v_details;
END;
$ LANGUAGE plpgsql;

-- Function to create opening balance movements for imported inventory
CREATE OR REPLACE FUNCTION create_opening_balances(
    p_created_by VARCHAR(100) DEFAULT 'SYSTEM_MIGRATION'
)
RETURNS INTEGER AS $
DECLARE
    v_movement_type_id INTEGER;
    v_count INTEGER := 0;
BEGIN
    -- Get the adjustment movement type
    SELECT movement_type_id INTO v_movement_type_id
    FROM movement_types
    WHERE code = 'ADJUSTMENT_POS';
    
    IF v_movement_type_id IS NULL THEN
        RAISE EXCEPTION 'Movement type ADJUSTMENT_POS not found';
    END IF;
    
    -- Create opening balance movements for all stock levels without movements
    INSERT INTO inventory_movements (
        product_id,
        location_id,
        movement_type_id,
        quantity,
        unit_cost,
        reference_document,
        notes,
        created_by,
        created_at
    )
    SELECT 
        sl.product_id,
        sl.location_id,
        v_movement_type_id,
        sl.quantity_on_hand,
        p.cost_price,
        'OPENING_BALANCE',
        'Opening balance from legacy system migration',
        p_created_by,
        COALESCE(sl.last_counted_at, CURRENT_TIMESTAMP)
    FROM stock_levels sl
    JOIN products p ON sl.product_id = p.product_id
    WHERE sl.quantity_on_hand > 0
    AND NOT EXISTS (
        SELECT 1 FROM inventory_movements im
        WHERE im.product_id = sl.product_id
        AND im.location_id = sl.location_id
        AND im.reference_document = 'OPENING_BALANCE'
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$ LANGUAGE plpgsql;

-- Example usage:
-- 1. Load data from CSV
-- COPY staging_inventory FROM '/path/to/legacy_inventory.csv' WITH CSV HEADER;

-- 2. Run the import
-- SELECT * FROM import_legacy_inventory();

-- 3. Create opening balance movements
-- SELECT create_opening_balances('MIGRATION_USER');

-- 4. View import results
-- SELECT * FROM inventory_import_log ORDER BY imported_at DESC;

COMMENT ON FUNCTION import_legacy_inventory() IS 'Imports inventory levels from staging_inventory table';
COMMENT ON FUNCTION create_opening_balances(VARCHAR) IS 'Creates opening balance movements for imported inventory';
