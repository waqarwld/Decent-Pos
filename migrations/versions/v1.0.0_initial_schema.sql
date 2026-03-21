-- Migration: v1.0.0 - Initial Schema
-- Description: Creates the complete inventory management schema
-- Date: 2024
-- Author: Inventory System Team

-- This migration creates all core tables, indexes, triggers, and initial data

BEGIN;

-- Record migration start time
DO $
DECLARE
    start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- Execute the main schema creation
    \i ../../schema.sql
    
    -- Insert initial movement types
    INSERT INTO movement_types (code, name, description, affects_quantity) VALUES 
        ('RECEIPT', 'Receipt', 'Goods received from supplier', 1),
        ('SALE', 'Sale', 'Goods sold to customer', -1),
        ('TRANSFER_IN', 'Transfer In', 'Goods transferred into location', 1),
        ('TRANSFER_OUT', 'Transfer Out', 'Goods transferred out of location', -1),
        ('ADJUSTMENT_POS', 'Positive Adjustment', 'Inventory count adjustment - increase', 1),
        ('ADJUSTMENT_NEG', 'Negative Adjustment', 'Inventory count adjustment - decrease', -1),
        ('RETURN', 'Return', 'Goods returned from customer', 1),
        ('DAMAGE', 'Damage', 'Goods damaged or written off', -1)
    ON CONFLICT (code) DO NOTHING;
    
    -- Record the migration
    PERFORM record_migration(
        '1.0.0',
        'Initial schema with all core tables, indexes, and triggers',
        'v1.0.0_initial_schema.sql',
        EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER,
        md5(pg_read_file('v1.0.0_initial_schema.sql')),
        'v1.0.0_rollback.sql'
    );
    
    RAISE NOTICE 'Migration v1.0.0 completed successfully';
END;
$;

COMMIT;
