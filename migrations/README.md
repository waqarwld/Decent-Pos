# Database Migration System

This directory contains database migration scripts for the inventory management system.

## Overview

The migration system provides:
- **Schema versioning**: Track and apply database schema changes incrementally
- **Rollback procedures**: Safely revert changes if needed
- **Data migration**: Transform and migrate data from existing systems
- **Deployment automation**: Automated deployment scripts for different environments

## Directory Structure

```
migrations/
├── versions/           # Versioned migration scripts
│   ├── v1.0.0_initial_schema.sql
│   ├── v1.0.0_rollback.sql
│   └── ...
├── data/              # Data migration utilities
│   ├── import_legacy_products.sql
│   └── ...
├── deploy.sh          # Main deployment script
├── rollback.sh        # Rollback script
├── migrate.sh         # Migration runner
└── schema_version.sql # Schema version tracking table
```

## Usage

### Initial Setup

```bash
# Create schema version tracking table
psql -d inventory_management -f schema_version.sql

# Run initial migration
./migrate.sh v1.0.0
```

### Applying Migrations

```bash
# Apply specific version
./migrate.sh v1.1.0

# Apply all pending migrations
./migrate.sh all
```

### Rolling Back

```bash
# Rollback to previous version
./rollback.sh

# Rollback to specific version
./rollback.sh v1.0.0
```

### Deployment

```bash
# Deploy to development
./deploy.sh development

# Deploy to production
./deploy.sh production
```

## Migration Script Naming Convention

- Forward migration: `vX.Y.Z_description.sql`
- Rollback script: `vX.Y.Z_rollback.sql`

## Best Practices

1. Always create both forward and rollback scripts
2. Test migrations on a copy of production data
3. Back up the database before applying migrations
4. Keep migrations small and focused
5. Document breaking changes in migration comments
