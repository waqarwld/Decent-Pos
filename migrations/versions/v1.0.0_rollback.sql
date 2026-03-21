-- Rollback: v1.0.0 - Initial Schema
-- Description: Removes all objects created by v1.0.0 migration
-- WARNING: This will delete all data in the inventory management schema

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS migration_history CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_stock_levels ON inventory_movements;
DROP TRIGGER IF EXISTS trigger_reorder_settings_updated_at ON reorder_settings;
DROP TRIGGER IF EXISTS trigger_product_suppliers_updated_at ON product_suppliers;
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;

-- Drop functions
DROP FUNCTION IF EXISTS update_stock_levels() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_current_schema_version() CASCADE;
DROP FUNCTION IF EXISTS record_migration(VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS record_rollback(VARCHAR, TEXT) CASCADE;

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS reorder_settings CASCADE;
DROP TABLE IF EXISTS movement_types CASCADE;
DROP TABLE IF EXISTS product_suppliers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Record the rollback
DO $
BEGIN
    PERFORM record_rollback(
        '1.0.0',
        'Rolled back initial schema - all tables and data removed'
    );
    
    RAISE NOTICE 'Rollback of v1.0.0 completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not record rollback in schema_version table (may have been dropped)';
END;
$;

COMMIT;
