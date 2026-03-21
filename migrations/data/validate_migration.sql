-- Data Migration Validation Script
-- Run this after importing data to verify data integrity and completeness

-- Create validation results table
CREATE TEMP TABLE IF NOT EXISTS validation_results (
    check_name VARCHAR(100),
    status VARCHAR(20),
    record_count INTEGER,
    message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to run all validation checks
CREATE OR REPLACE FUNCTION validate_migration()
RETURNS TABLE(
    check_name VARCHAR(100),
    status VARCHAR(20),
    record_count INTEGER,
    message TEXT
) AS $
BEGIN
    -- Clear previous results
    DELETE FROM validation_results;
    
    -- Check 1: Products without categories
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Products without categories',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All products have categories'
            ELSE 'Some products are missing category assignments'
        END
    FROM products
    WHERE category_id IS NULL;
    
    -- Check 2: Products with invalid prices
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Products with invalid prices',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All products have valid prices'
            ELSE 'Some products have missing or zero prices'
        END
    FROM products
    WHERE cost_price IS NULL OR cost_price = 0 OR selling_price IS NULL OR selling_price = 0;
    
    -- Check 3: Stock levels without products
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Orphaned stock levels',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All stock levels reference valid products'
            ELSE 'Some stock levels reference non-existent products'
        END
    FROM stock_levels sl
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.product_id = sl.product_id);
    
    -- Check 4: Stock levels without locations
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Stock levels with invalid locations',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All stock levels reference valid locations'
            ELSE 'Some stock levels reference non-existent locations'
        END
    FROM stock_levels sl
    WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.location_id = sl.location_id);
    
    -- Check 5: Negative stock quantities
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Negative stock quantities',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'No negative stock quantities found'
            ELSE 'Some locations have negative stock'
        END
    FROM stock_levels
    WHERE quantity_on_hand < 0;
    
    -- Check 6: Reserved quantity exceeds on-hand
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Reserved exceeds on-hand',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All reserved quantities are valid'
            ELSE 'Some locations have reserved > on-hand'
        END
    FROM stock_levels
    WHERE quantity_reserved > quantity_on_hand;
    
    -- Check 7: Products without suppliers
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Products without suppliers',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All products have at least one supplier'
            ELSE 'Some products have no suppliers assigned'
        END
    FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM product_suppliers ps 
        WHERE ps.product_id = p.product_id AND ps.is_active = true
    );
    
    -- Check 8: Duplicate SKUs
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Duplicate SKUs',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All SKUs are unique'
            ELSE 'Duplicate SKUs found'
        END
    FROM (
        SELECT sku, COUNT(*) as cnt
        FROM products
        GROUP BY sku
        HAVING COUNT(*) > 1
    ) dups;
    
    -- Check 9: Inventory movements without stock levels
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Movements without stock records',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
        COUNT(DISTINCT product_id || '-' || location_id)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All movements have corresponding stock levels'
            ELSE 'Some movements lack stock level records'
        END
    FROM inventory_movements im
    WHERE NOT EXISTS (
        SELECT 1 FROM stock_levels sl 
        WHERE sl.product_id = im.product_id 
        AND sl.location_id = im.location_id
    );
    
    -- Check 10: Stock levels without movements
    INSERT INTO validation_results (check_name, status, record_count, message)
    SELECT 
        'Stock without movements',
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) = 0 
            THEN 'All stock levels have movement history'
            ELSE 'Some stock levels have no movement records (may need opening balances)'
        END
    FROM stock_levels sl
    WHERE quantity_on_hand > 0
    AND NOT EXISTS (
        SELECT 1 FROM inventory_movements im 
        WHERE im.product_id = sl.product_id 
        AND im.location_id = sl.location_id
    );
    
    -- Return all results
    RETURN QUERY SELECT * FROM validation_results ORDER BY 
        CASE status 
            WHEN 'FAIL' THEN 1 
            WHEN 'WARNING' THEN 2 
            WHEN 'PASS' THEN 3 
        END,
        check_name;
END;
$ LANGUAGE plpgsql;

-- Function to generate migration summary statistics
CREATE OR REPLACE FUNCTION migration_summary()
RETURNS TABLE(
    entity VARCHAR(50),
    total_count BIGINT,
    active_count BIGINT,
    inactive_count BIGINT
) AS $
BEGIN
    RETURN QUERY
    SELECT 'Categories'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE is_active = true)::BIGINT,
           COUNT(*) FILTER (WHERE is_active = false)::BIGINT
    FROM categories
    UNION ALL
    SELECT 'Products'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
           COUNT(*) FILTER (WHERE status != 'active')::BIGINT
    FROM products
    UNION ALL
    SELECT 'Locations'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE is_active = true)::BIGINT,
           COUNT(*) FILTER (WHERE is_active = false)::BIGINT
    FROM locations
    UNION ALL
    SELECT 'Suppliers'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE is_active = true)::BIGINT,
           COUNT(*) FILTER (WHERE is_active = false)::BIGINT
    FROM suppliers
    UNION ALL
    SELECT 'Stock Levels'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE quantity_on_hand > 0)::BIGINT,
           COUNT(*) FILTER (WHERE quantity_on_hand = 0)::BIGINT
    FROM stock_levels
    UNION ALL
    SELECT 'Inventory Movements'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           NULL::BIGINT,
           NULL::BIGINT
    FROM inventory_movements
    UNION ALL
    SELECT 'Product-Supplier Links'::VARCHAR(50), 
           COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE is_active = true)::BIGINT,
           COUNT(*) FILTER (WHERE is_active = false)::BIGINT
    FROM product_suppliers;
END;
$ LANGUAGE plpgsql;

-- Run validation and show results
\echo 'Running migration validation checks...'
\echo ''

SELECT * FROM validate_migration();

\echo ''
\echo 'Migration Summary Statistics:'
\echo ''

SELECT * FROM migration_summary();

\echo ''
\echo 'Validation complete. Review any FAIL or WARNING statuses above.'

COMMENT ON FUNCTION validate_migration() IS 'Runs comprehensive validation checks on migrated data';
COMMENT ON FUNCTION migration_summary() IS 'Generates summary statistics for migrated entities';
