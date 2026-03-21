-- Data Migration: Import Legacy Products
-- Description: Imports products from a legacy system into the inventory schema
-- Prerequisites: Legacy data should be loaded into a temporary staging table

-- Create staging table for legacy product data
CREATE TEMP TABLE IF NOT EXISTS staging_products (
    legacy_id VARCHAR(50),
    legacy_sku VARCHAR(50),
    product_name VARCHAR(200),
    product_description TEXT,
    category_name VARCHAR(100),
    uom VARCHAR(20),
    weight DECIMAL(10,3),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    cost DECIMAL(12,2),
    price DECIMAL(12,2),
    product_status VARCHAR(20),
    import_notes TEXT
);

-- Function to import products from staging table
CREATE OR REPLACE FUNCTION import_legacy_products()
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
    v_category_id INTEGER;
    v_product_id INTEGER;
    v_details TEXT := '';
BEGIN
    -- Create import log table if it doesn't exist
    CREATE TEMP TABLE IF NOT EXISTS import_log (
        legacy_id VARCHAR(50),
        status VARCHAR(20),
        message TEXT,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Process each staging record
    FOR rec IN SELECT * FROM staging_products LOOP
        BEGIN
            -- Find or create category
            SELECT category_id INTO v_category_id
            FROM categories
            WHERE name = rec.category_name;
            
            IF v_category_id IS NULL THEN
                INSERT INTO categories (name, description)
                VALUES (rec.category_name, 'Imported from legacy system')
                RETURNING category_id INTO v_category_id;
            END IF;
            
            -- Check if product already exists by SKU
            SELECT product_id INTO v_product_id
            FROM products
            WHERE sku = rec.legacy_sku;
            
            IF v_product_id IS NOT NULL THEN
                -- Product exists, skip
                v_skipped := v_skipped + 1;
                INSERT INTO import_log (legacy_id, status, message)
                VALUES (rec.legacy_id, 'SKIPPED', 'Product with SKU ' || rec.legacy_sku || ' already exists');
            ELSE
                -- Insert new product
                INSERT INTO products (
                    sku,
                    name,
                    description,
                    category_id,
                    unit_of_measure,
                    weight_kg,
                    length_cm,
                    width_cm,
                    height_cm,
                    cost_price,
                    selling_price,
                    status
                ) VALUES (
                    rec.legacy_sku,
                    rec.product_name,
                    COALESCE(rec.product_description, '') || E'\n\nImported from legacy system. Legacy ID: ' || rec.legacy_id,
                    v_category_id,
                    COALESCE(rec.uom, 'each'),
                    rec.weight,
                    rec.length,
                    rec.width,
                    rec.height,
                    rec.cost,
                    rec.price,
                    COALESCE(rec.product_status, 'active')
                ) RETURNING product_id INTO v_product_id;
                
                v_imported := v_imported + 1;
                INSERT INTO import_log (legacy_id, status, message)
                VALUES (rec.legacy_id, 'SUCCESS', 'Product imported with ID ' || v_product_id);
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            INSERT INTO import_log (legacy_id, status, message)
            VALUES (rec.legacy_id, 'ERROR', SQLERRM);
        END;
    END LOOP;
    
    -- Build details message
    v_details := format('Imported: %s, Skipped: %s, Errors: %s', v_imported, v_skipped, v_errors);
    
    RETURN QUERY SELECT v_imported, v_skipped, v_errors, v_details;
END;
$ LANGUAGE plpgsql;

-- Example: Load data from CSV into staging table
-- COPY staging_products FROM '/path/to/legacy_products.csv' WITH CSV HEADER;

-- Run the import
-- SELECT * FROM import_legacy_products();

-- View import results
-- SELECT * FROM import_log ORDER BY imported_at DESC;

COMMENT ON FUNCTION import_legacy_products() IS 'Imports products from staging_products table into the main products table';
