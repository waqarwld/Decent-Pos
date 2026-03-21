# Database Migration and Deployment Guide

This guide provides comprehensive documentation for the inventory management database migration and deployment system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Migration System](#migration-system)
5. [Deployment Process](#deployment-process)
6. [Data Migration](#data-migration)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The migration system provides a robust framework for:

- **Schema Versioning**: Track and apply database schema changes incrementally
- **Rollback Capability**: Safely revert changes if issues arise
- **Data Migration**: Import data from legacy systems
- **Automated Deployment**: Deploy to multiple environments consistently
- **Validation**: Verify data integrity after migrations

## Architecture

### Directory Structure

```
migrations/
├── README.md                    # Migration system overview
├── QUICKSTART.md               # Quick start guide
├── schema_version.sql          # Version tracking table
├── migrate.sh                  # Migration runner script
├── rollback.sh                 # Rollback script
├── deploy.sh                   # Deployment automation
├── health_check.sh             # Database health check
├── config/                     # Environment configurations
│   ├── development.env
│   ├── staging.env
│   └── production.env
├── versions/                   # Versioned migration scripts
│   ├── v1.0.0_initial_schema.sql
│   ├── v1.0.0_rollback.sql
│   └── ...
├── data/                       # Data migration utilities
│   ├── README.md
│   ├── import_legacy_products.sql
│   ├── import_legacy_inventory.sql
│   └── validate_migration.sql
└── backups/                    # Automatic backups (created at runtime)
```

### Components

#### 1. Schema Version Tracking

The `schema_version` table tracks all applied migrations:

```sql
CREATE TABLE schema_version (
    version_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    script_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'applied',
    rollback_script VARCHAR(255),
    notes TEXT
);
```

#### 2. Migration Scripts

Each migration consists of two files:
- **Forward migration**: `vX.Y.Z_description.sql` - Applies changes
- **Rollback script**: `vX.Y.Z_rollback.sql` - Reverts changes

#### 3. Automation Scripts

- **migrate.sh**: Applies migrations
- **rollback.sh**: Reverts migrations
- **deploy.sh**: Full deployment automation
- **health_check.sh**: Validates database health

## Getting Started

### Prerequisites

- PostgreSQL 12 or higher
- Bash shell (Linux, macOS, or WSL)
- Database credentials with CREATE/ALTER permissions

### Initial Setup

1. **Make scripts executable**:
   ```bash
   cd migrations
   chmod +x *.sh
   ```

2. **Configure environment**:
   ```bash
   # Edit configuration for your environment
   nano config/development.env
   ```

3. **Set database password** (choose one method):
   
   **Option A: Environment variable**
   ```bash
   export PGPASSWORD="your_password"
   ```
   
   **Option B: .pgpass file** (recommended)
   ```bash
   echo "localhost:5432:inventory_management:postgres:password" >> ~/.pgpass
   chmod 600 ~/.pgpass
   ```

4. **Test connection**:
   ```bash
   psql -h localhost -U postgres -d postgres -c "SELECT version();"
   ```

### First Deployment

```bash
# Deploy to development environment
./deploy.sh development
```

This will:
1. Create the database if it doesn't exist
2. Initialize schema version tracking
3. Apply all migrations
4. Load sample data (development only)
5. Run validation checks

## Migration System

### Creating a New Migration

1. **Create forward migration file**:
   ```bash
   nano versions/v1.1.0_add_product_images.sql
   ```

   ```sql
   -- Migration: v1.1.0 - Add Product Images
   -- Description: Adds image storage for products
   
   BEGIN;
   
   -- Add image columns to products table
   ALTER TABLE products 
   ADD COLUMN image_url VARCHAR(500),
   ADD COLUMN thumbnail_url VARCHAR(500);
   
   -- Create index for image lookups
   CREATE INDEX idx_products_image ON products(image_url) 
   WHERE image_url IS NOT NULL;
   
   -- Record migration
   SELECT record_migration(
       '1.1.0',
       'Add product image support',
       'v1.1.0_add_product_images.sql',
       0,
       '',
       'v1.1.0_rollback.sql'
   );
   
   COMMIT;
   ```

2. **Create rollback script**:
   ```bash
   nano versions/v1.1.0_rollback.sql
   ```

   ```sql
   -- Rollback: v1.1.0 - Add Product Images
   
   BEGIN;
   
   -- Drop index
   DROP INDEX IF EXISTS idx_products_image;
   
   -- Remove columns
   ALTER TABLE products 
   DROP COLUMN IF EXISTS image_url,
   DROP COLUMN IF EXISTS thumbnail_url;
   
   -- Record rollback
   SELECT record_rollback('1.1.0', 'Removed product image columns');
   
   COMMIT;
   ```

3. **Test migration**:
   ```bash
   # Apply migration
   ./migrate.sh v1.1.0
   
   # Verify
   psql -d inventory_management -c "\d products"
   
   # Test rollback
   ./rollback.sh v1.1.0
   ```

### Applying Migrations

```bash
# Apply specific version
./migrate.sh v1.0.0

# Apply all pending migrations
./migrate.sh all

# List available migrations
./migrate.sh list
```

### Checking Migration Status

```bash
# Get current version
psql -d inventory_management -c "SELECT get_current_schema_version();"

# View migration history
psql -d inventory_management -c "SELECT * FROM migration_history;"

# Check specific migration
psql -d inventory_management -c "
SELECT version, status, applied_at, execution_time_ms 
FROM schema_version 
WHERE version = '1.0.0';
"
```

## Deployment Process

### Environment-Specific Deployment

```bash
# Development (with sample data)
./deploy.sh development

# Staging (with sample data, creates backup)
./deploy.sh staging

# Production (no sample data, requires confirmation, creates backup)
./deploy.sh production
```

### Deployment Steps

The deployment script performs these steps:

1. **Pre-deployment checks**
   - Verify prerequisites (psql, pg_dump)
   - Test database connection
   - Load environment configuration

2. **Database preparation**
   - Create database if needed
   - Create backup (staging/production)

3. **Schema deployment**
   - Initialize schema version tracking
   - Apply all pending migrations

4. **Data loading**
   - Load sample data (development/staging only)

5. **Validation**
   - Run validation scripts
   - Display deployment summary

### Custom Deployment Workflow

For custom deployment needs:

```bash
# 1. Create backup manually
pg_dump -d inventory_management -f backup_$(date +%Y%m%d).sql

# 2. Apply specific migrations
./migrate.sh v1.0.0
./migrate.sh v1.1.0

# 3. Run validation
psql -d inventory_management -f data/validate_migration.sql

# 4. Run health check
./health_check.sh
```

## Data Migration

### Importing Legacy Products

1. **Prepare CSV file** (`products.csv`):
   ```csv
   legacy_id,legacy_sku,product_name,product_description,category_name,uom,weight,length,width,height,cost,price,product_status
   PROD001,SKU-001,Laptop Computer,Business laptop,Electronics,each,2.5,35,25,2,800.00,1200.00,active
   ```

2. **Run import**:
   ```bash
   psql -d inventory_management << EOF
   \i data/import_legacy_products.sql
   COPY staging_products FROM '/path/to/products.csv' WITH CSV HEADER;
   SELECT * FROM import_legacy_products();
   SELECT * FROM import_log;
   EOF
   ```

### Importing Legacy Inventory

1. **Prepare CSV file** (`inventory.csv`):
   ```csv
   legacy_product_id,product_sku,location_code,quantity,reserved_qty,last_count_date
   PROD001,SKU-001,WH001,100,10,2024-01-15
   ```

2. **Run import**:
   ```bash
   psql -d inventory_management << EOF
   \i data/import_legacy_inventory.sql
   COPY staging_inventory FROM '/path/to/inventory.csv' WITH CSV HEADER;
   SELECT * FROM import_legacy_inventory();
   SELECT create_opening_balances('MIGRATION_USER');
   SELECT * FROM inventory_import_log;
   EOF
   ```

### Validating Migrated Data

```bash
# Run comprehensive validation
psql -d inventory_management -f data/validate_migration.sql

# Check specific issues
psql -d inventory_management -c "
SELECT * FROM products WHERE category_id IS NULL;
SELECT * FROM stock_levels WHERE quantity_on_hand < 0;
"
```

## Rollback Procedures

### Standard Rollback

```bash
# Rollback specific version
./rollback.sh v1.0.0
```

The rollback script will:
1. Prompt for confirmation
2. Create a backup
3. Execute the rollback script
4. Update schema_version table

### Emergency Rollback

If the rollback script fails:

```bash
# 1. Restore from backup
psql -d inventory_management -f backups/backup_YYYYMMDD_HHMMSS.sql

# 2. Verify restoration
psql -d inventory_management -c "SELECT get_current_schema_version();"

# 3. Update schema_version if needed
psql -d inventory_management -c "
UPDATE schema_version 
SET status = 'rolled_back' 
WHERE version = '1.1.0';
"
```

### Partial Rollback

To rollback specific changes without using the rollback script:

```sql
BEGIN;

-- Manually revert changes
ALTER TABLE products DROP COLUMN IF EXISTS new_column;

-- Update schema version
UPDATE schema_version 
SET status = 'rolled_back',
    notes = 'Manual partial rollback of column addition'
WHERE version = '1.1.0';

COMMIT;
```

## Best Practices

### Migration Development

1. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to test and rollback

2. **Always create rollback scripts**
   - Test rollback before deploying
   - Document any data loss in rollback

3. **Use transactions**
   - Wrap migrations in BEGIN/COMMIT
   - Ensures atomic application

4. **Test on copy of production data**
   ```bash
   # Create test database from production
   pg_dump -d inventory_management | psql -d inventory_management_test
   
   # Test migration
   DB_NAME=inventory_management_test ./migrate.sh v1.1.0
   ```

5. **Document breaking changes**
   - Add comments to migration scripts
   - Update application code before deploying

### Deployment

1. **Always backup before production deployment**
   ```bash
   pg_dump -d inventory_management -f backup_before_v1.1.0.sql
   ```

2. **Deploy during maintenance windows**
   - Schedule downtime for major changes
   - Notify users in advance

3. **Use staging environment**
   - Test full deployment process
   - Verify application compatibility

4. **Monitor after deployment**
   - Check application logs
   - Run health checks
   - Monitor database performance

5. **Keep backups for 30+ days**
   ```bash
   # Organize backups by date
   mkdir -p backups/2024/01
   mv backups/*.sql backups/2024/01/
   ```

### Data Migration

1. **Validate source data first**
   - Check for duplicates
   - Verify foreign key relationships
   - Clean data before import

2. **Use staging tables**
   - Never import directly to production tables
   - Allows validation before committing

3. **Create import logs**
   - Track what was imported
   - Record errors for investigation

4. **Test with subset first**
   - Import 100 records
   - Verify results
   - Then import full dataset

5. **Preserve legacy identifiers**
   - Store in description or notes
   - Helps with troubleshooting

## Troubleshooting

### Common Issues

#### Migration Already Applied

**Symptom**: "Migration v1.0.0 is already applied"

**Solution**:
```bash
# Check status
psql -d inventory_management -c "
SELECT version, status, applied_at 
FROM schema_version 
WHERE version = '1.0.0';
"

# If incorrectly marked, update status
psql -d inventory_management -c "
UPDATE schema_version 
SET status = 'rolled_back' 
WHERE version = '1.0.0';
"
```

#### Connection Refused

**Symptom**: "psql: could not connect to server"

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Start PostgreSQL
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS

# Check connection settings
psql -h localhost -p 5432 -U postgres -d postgres
```

#### Permission Denied

**Symptom**: "permission denied for table"

**Solution**:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE inventory_management TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### Rollback Failed

**Symptom**: Rollback script encounters errors

**Solution**:
```bash
# Restore from backup
psql -d inventory_management < backups/latest_backup.sql

# Verify restoration
./health_check.sh

# Investigate issue
psql -d inventory_management -c "
SELECT * FROM schema_version 
ORDER BY applied_at DESC 
LIMIT 5;
"
```

#### Data Import Errors

**Symptom**: Import function reports errors

**Solution**:
```sql
-- Check import log
SELECT * FROM import_log WHERE status = 'ERROR';

-- Common fixes:
-- 1. Missing foreign key references
SELECT DISTINCT category_name 
FROM staging_products 
WHERE category_name NOT IN (SELECT name FROM categories);

-- 2. Duplicate SKUs
SELECT sku, COUNT(*) 
FROM staging_products 
GROUP BY sku 
HAVING COUNT(*) > 1;

-- 3. Invalid data types
SELECT * FROM staging_products 
WHERE cost !~ '^[0-9.]+$';
```

### Health Check

Run regular health checks:

```bash
# Full health check
./health_check.sh production

# Quick checks
psql -d inventory_management -c "
SELECT 
    'Schema Version' as check,
    get_current_schema_version() as value
UNION ALL
SELECT 
    'Total Products',
    COUNT(*)::TEXT
FROM products
UNION ALL
SELECT 
    'Negative Stock',
    COUNT(*)::TEXT
FROM stock_levels 
WHERE quantity_on_hand < 0;
"
```

### Getting Help

1. **Check logs**:
   ```bash
   # PostgreSQL logs
   tail -f /var/log/postgresql/postgresql-*.log
   ```

2. **Review migration history**:
   ```bash
   psql -d inventory_management -c "SELECT * FROM migration_history;"
   ```

3. **Run validation**:
   ```bash
   psql -d inventory_management -f data/validate_migration.sql
   ```

4. **Check documentation**:
   - `migrations/README.md` - Migration system overview
   - `migrations/QUICKSTART.md` - Quick start guide
   - `migrations/data/README.md` - Data migration guide

## Appendix

### Useful SQL Queries

```sql
-- Current schema version
SELECT get_current_schema_version();

-- Migration history
SELECT * FROM migration_history;

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- Active connections
SELECT * FROM pg_stat_activity WHERE datname = current_database();

-- Recent inventory activity
SELECT 
    DATE(created_at) as date,
    COUNT(*) as movements
FROM inventory_movements
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Environment Variables

```bash
# Database connection
export DB_NAME="inventory_management"
export DB_USER="postgres"
export DB_HOST="localhost"
export DB_PORT="5432"
export PGPASSWORD="password"

# Deployment options
export LOAD_SAMPLE_DATA="true"
export RUN_VALIDATION="true"
export CREATE_BACKUP="true"
export LOG_LEVEL="INFO"
```

### Backup and Restore

```bash
# Create backup
pg_dump -d inventory_management -f backup.sql

# Create compressed backup
pg_dump -d inventory_management | gzip > backup.sql.gz

# Restore from backup
psql -d inventory_management -f backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -d inventory_management

# Custom format (faster, compressed)
pg_dump -Fc -d inventory_management -f backup.dump
pg_restore -d inventory_management backup.dump
```
