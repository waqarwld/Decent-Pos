# Data Migration Utilities

This directory contains utilities for migrating data from legacy systems into the inventory management database.

## Available Migration Scripts

### 1. import_legacy_products.sql
Imports product data from a legacy system.

**Usage:**
```sql
-- 1. Load your data into the staging table
COPY staging_products(legacy_id, legacy_sku, product_name, product_description, 
                      category_name, uom, weight, length, width, height, 
                      cost, price, product_status)
FROM '/path/to/products.csv' 
WITH CSV HEADER;

-- 2. Run the import function
SELECT * FROM import_legacy_products();

-- 3. Check the results
SELECT * FROM import_log ORDER BY imported_at DESC;
```

**CSV Format:**
```csv
legacy_id,legacy_sku,product_name,product_description,category_name,uom,weight,length,width,height,cost,price,product_status
PROD001,SKU-001,Product Name,Description,Electronics,each,1.5,10,5,3,50.00,75.00,active
```

### 2. import_legacy_inventory.sql
Imports inventory levels from a legacy system.

**Usage:**
```sql
-- 1. Load your data into the staging table
COPY staging_inventory(legacy_product_id, product_sku, location_code, 
                       quantity, reserved_qty, last_count_date)
FROM '/path/to/inventory.csv' 
WITH CSV HEADER;

-- 2. Run the import function
SELECT * FROM import_legacy_inventory();

-- 3. Create opening balance movements
SELECT create_opening_balances('MIGRATION_USER');

-- 4. Check the results
SELECT * FROM inventory_import_log ORDER BY imported_at DESC;
```

**CSV Format:**
```csv
legacy_product_id,product_sku,location_code,quantity,reserved_qty,last_count_date
PROD001,SKU-001,WH001,100,10,2024-01-15
```

## Creating Custom Migration Scripts

When creating custom migration scripts, follow this template:

```sql
-- Data Migration: [Description]
-- Description: [Detailed description]
-- Prerequisites: [List prerequisites]

-- 1. Create staging table
CREATE TEMP TABLE IF NOT EXISTS staging_[entity] (
    -- Define columns matching your source data
);

-- 2. Create import function
CREATE OR REPLACE FUNCTION import_[entity]()
RETURNS TABLE(...) AS $
DECLARE
    -- Declare variables
BEGIN
    -- Create log table
    CREATE TEMP TABLE IF NOT EXISTS [entity]_import_log (...);
    
    -- Process records
    FOR rec IN SELECT * FROM staging_[entity] LOOP
        BEGIN
            -- Import logic here
            
        EXCEPTION WHEN OTHERS THEN
            -- Error handling
        END;
    END LOOP;
    
    RETURN QUERY SELECT ...;
END;
$ LANGUAGE plpgsql;

-- 3. Document usage
-- COPY staging_[entity] FROM '/path/to/file.csv' WITH CSV HEADER;
-- SELECT * FROM import_[entity]();
```

## Best Practices

1. **Always use staging tables**: Never import directly into production tables
2. **Create import logs**: Track what was imported, skipped, or failed
3. **Handle duplicates**: Check for existing records before inserting
4. **Validate data**: Verify foreign key relationships exist
5. **Use transactions**: Wrap imports in transactions for rollback capability
6. **Test first**: Always test on a copy of production data
7. **Document mappings**: Clearly document how legacy fields map to new schema
8. **Preserve legacy IDs**: Store legacy IDs in description or notes fields

## Troubleshooting

### Common Issues

**Issue: Foreign key violations**
- Ensure referenced records (categories, locations, suppliers) exist first
- Import in correct order: categories → products → inventory

**Issue: Duplicate key violations**
- Check for existing records before importing
- Use `ON CONFLICT` clauses to handle duplicates

**Issue: Data type mismatches**
- Cast data types in staging table or import function
- Clean data before loading into staging tables

**Issue: Character encoding problems**
- Specify encoding in COPY command: `ENCODING 'UTF8'`
- Clean special characters in source data

## Migration Checklist

- [ ] Back up production database
- [ ] Create staging tables
- [ ] Load data into staging tables
- [ ] Validate staging data
- [ ] Run import functions
- [ ] Review import logs
- [ ] Verify imported data
- [ ] Create opening balance movements (for inventory)
- [ ] Run validation queries
- [ ] Document any issues or data quality problems
