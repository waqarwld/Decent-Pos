# Migration System Quick Start Guide

This guide will help you get started with the database migration and deployment system.

## Prerequisites

- PostgreSQL 12 or higher installed
- `psql` and `pg_dump` command-line tools available
- Bash shell (Linux, macOS, or WSL on Windows)
- Database credentials with appropriate permissions

## Initial Setup

### 1. Make Scripts Executable

```bash
cd migrations
chmod +x migrate.sh rollback.sh deploy.sh
```

### 2. Configure Environment

Edit the configuration files in `config/` directory:

```bash
# For development
nano config/development.env

# For production
nano config/production.env
```

Update the database connection settings:
- `DB_NAME`: Your database name
- `DB_USER`: Database user
- `DB_HOST`: Database host
- `DB_PORT`: Database port

### 3. Set Database Password (Optional)

You can set the password in several ways:

**Option A: Environment variable**
```bash
export PGPASSWORD="your_password"
```

**Option B: .pgpass file** (recommended for production)
```bash
echo "localhost:5432:inventory_management:postgres:your_password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

**Option C: Interactive prompt**
Just run the scripts and PostgreSQL will prompt for password.

## Common Tasks

### Deploy to Development

```bash
# Full deployment with sample data
./deploy.sh development
```

This will:
1. Check prerequisites
2. Test database connection
3. Create database if needed
4. Initialize schema version tracking
5. Run all migrations
6. Load sample data (development only)
7. Run validation

### Deploy to Production

```bash
# Production deployment (with confirmation prompt)
./deploy.sh production
```

This will:
1. Prompt for confirmation
2. Create backup before deployment
3. Run migrations
4. Skip sample data
5. Run validation

### Apply Specific Migration

```bash
# Apply a specific version
./migrate.sh v1.0.0

# Apply all pending migrations
./migrate.sh all

# List available migrations
./migrate.sh list
```

### Rollback Migration

```bash
# Rollback specific version
./rollback.sh v1.0.0

# List applied migrations
./rollback.sh list
```

**Warning**: Rollback will prompt for confirmation and create a backup first.

### Check Current Version

```bash
psql -d inventory_management -c "SELECT get_current_schema_version();"
```

### View Migration History

```bash
psql -d inventory_management -c "SELECT * FROM migration_history;"
```

## Data Migration

### Import Legacy Products

```bash
# 1. Connect to database
psql -d inventory_management

# 2. Load the import script
\i data/import_legacy_products.sql

# 3. Load your CSV data
COPY staging_products FROM '/path/to/products.csv' WITH CSV HEADER;

# 4. Run the import
SELECT * FROM import_legacy_products();

# 5. Check results
SELECT * FROM import_log;
```

### Import Legacy Inventory

```bash
# 1. Connect to database
psql -d inventory_management

# 2. Load the import script
\i data/import_legacy_inventory.sql

# 3. Load your CSV data
COPY staging_inventory FROM '/path/to/inventory.csv' WITH CSV HEADER;

# 4. Run the import
SELECT * FROM import_legacy_inventory();

# 5. Create opening balances
SELECT create_opening_balances('MIGRATION_USER');

# 6. Check results
SELECT * FROM inventory_import_log;
```

### Validate Migration

```bash
psql -d inventory_management -f data/validate_migration.sql
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to database

**Solution**:
```bash
# Test connection manually
psql -h localhost -p 5432 -U postgres -d postgres

# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### Permission Issues

**Problem**: Permission denied errors

**Solution**:
```bash
# Make scripts executable
chmod +x migrate.sh rollback.sh deploy.sh

# Check database user permissions
psql -d postgres -c "SELECT * FROM pg_roles WHERE rolname='your_user';"
```

### Migration Already Applied

**Problem**: Migration already applied message

**Solution**:
```bash
# Check migration status
psql -d inventory_management -c "SELECT * FROM schema_version ORDER BY applied_at DESC;"

# If needed, manually mark as rolled back
psql -d inventory_management -c "UPDATE schema_version SET status='rolled_back' WHERE version='1.0.0';"
```

### Rollback Failed

**Problem**: Rollback script fails

**Solution**:
```bash
# Restore from backup
psql -d inventory_management -f backups/production_inventory_management_YYYYMMDD_HHMMSS.sql

# Or restore using pg_restore if using custom format
pg_restore -d inventory_management backups/backup_file.dump
```

## Best Practices

1. **Always backup before production deployments**
   ```bash
   pg_dump -d inventory_management -f backup_before_deploy.sql
   ```

2. **Test migrations on staging first**
   ```bash
   ./deploy.sh staging
   # Verify everything works
   ./deploy.sh production
   ```

3. **Review migration scripts before applying**
   ```bash
   cat versions/v1.0.0_initial_schema.sql
   ```

4. **Keep backups for at least 30 days**
   ```bash
   # Backups are stored in migrations/backups/
   ls -lh backups/
   ```

5. **Monitor migration execution time**
   ```bash
   psql -d inventory_management -c "SELECT version, execution_time_ms FROM schema_version ORDER BY applied_at DESC;"
   ```

## Getting Help

- Check the main README: `cat README.md`
- View data migration guide: `cat data/README.md`
- Review migration history: `psql -d inventory_management -c "SELECT * FROM migration_history;"`
- Validate data: `psql -d inventory_management -f data/validate_migration.sql`

## Next Steps

After successful deployment:

1. Load your production data using data migration scripts
2. Run validation: `psql -d inventory_management -f data/validate_migration.sql`
3. Set up regular backups
4. Configure monitoring and alerts
5. Document any custom migrations you create

## Emergency Rollback Procedure

If something goes wrong in production:

```bash
# 1. Stop application access to database

# 2. Restore from backup
psql -d inventory_management -f backups/latest_backup.sql

# 3. Verify restoration
psql -d inventory_management -c "SELECT get_current_schema_version();"

# 4. Resume application access

# 5. Investigate issue before retrying deployment
```
