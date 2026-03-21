# Inventory Management Database Schema

This directory contains the PostgreSQL database schema for a comprehensive inventory management system.

## Files

### Core Schema Files
- `schema.sql` - Main database schema with all table definitions, constraints, and indexes
- `inventory_procedures.sql` - Stored procedures for inventory operations (receive, ship, transfer, adjust)
- `inventory_reporting.sql` - Reporting views and functions for business intelligence
- `init_database.sql` - Database initialization script with sample data
- `validate_schema.sql` - Validation script to verify schema creation

### Testing Files
- `test_inventory_procedures.sql` - Comprehensive test suite for inventory procedures
- `test_inventory_reporting.sql` - Comprehensive test suite for reporting views and functions

### Sample Data Files
- `sample_data.sql` - Sample products, categories, locations, and suppliers
- `sample_data_movements.sql` - Sample inventory movements for testing
- `load_sample_data.sql` - Script to load all sample data

### Migration and Deployment
- `migrations/` - Database migration and deployment system
  - `migrate.sh` - Migration runner script
  - `rollback.sh` - Rollback script
  - `deploy.sh` - Automated deployment script
  - `health_check.sh` - Database health check utility
  - `versions/` - Versioned migration scripts
  - `data/` - Data migration utilities
  - `config/` - Environment configurations

### Documentation
- `README.md` - This documentation file
- `MIGRATION_GUIDE.md` - Comprehensive migration and deployment guide
- `REPORTING_DOCUMENTATION.md` - Complete documentation for all reporting views and functions
- `PROCEDURES_DOCUMENTATION.md` - Documentation for stored procedures
- `SAMPLE_DATA_DOCUMENTATION.md` - Documentation for sample data

## Database Setup

### Prerequisites

- PostgreSQL 12 or higher
- Database user with CREATE privileges
- Bash shell (for migration scripts)

### Quick Start - Automated Deployment

The easiest way to set up the database is using the automated deployment system:

```bash
# Make scripts executable
cd migrations
chmod +x *.sh

# Deploy to development environment
./deploy.sh development
```

This will automatically:
- Create the database
- Apply all migrations
- Load sample data
- Run validation checks

For detailed deployment options, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) or [migrations/QUICKSTART.md](migrations/QUICKSTART.md).

### Manual Installation Steps

If you prefer manual installation:

1. **Create the database** (as superuser):
   ```sql
   CREATE DATABASE inventory_management;
   ```

2. **Run the initialization script**:
   ```bash
   psql -d inventory_management -f init_database.sql
   ```

   Or connect to the database and run:
   ```sql
   \i init_database.sql
   ```

3. **Install reporting views and functions**:
   ```bash
   psql -d inventory_management -f inventory_reporting.sql
   ```

   Or from within psql:
   ```sql
   \i inventory_reporting.sql
   ```

4. **Validate the installation**:
   ```bash
   psql -d inventory_management -f validate_schema.sql
   ```

### Migration and Deployment

For production deployments, schema versioning, and data migration from legacy systems, use the migration system:

```bash
# Deploy to production (with backup and confirmation)
cd migrations
./deploy.sh production

# Apply specific migration
./migrate.sh v1.0.0

# Rollback if needed
./rollback.sh v1.0.0

# Check database health
./health_check.sh production
```

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for comprehensive documentation on:
- Schema versioning and migrations
- Rollback procedures
- Data migration from legacy systems
- Environment-specific deployments
- Best practices and troubleshooting

## Schema Overview

### Core Tables

1. **categories** - Product categories with hierarchical structure
2. **products** - Master product catalog with detailed attributes
3. **locations** - Storage locations with hierarchical organization
4. **suppliers** - Vendor information and contact details
5. **stock_levels** - Current inventory quantities by product and location
6. **inventory_movements** - Complete audit trail of all inventory transactions
7. **movement_types** - Lookup table for transaction types
8. **reorder_settings** - Automated reordering configuration
9. **product_suppliers** - Product-supplier relationships with performance tracking

### Stored Procedures

1. **receive_inventory()** - Record inventory receipts from suppliers
2. **ship_inventory()** - Record inventory shipments to customers
3. **transfer_inventory()** - Transfer inventory between locations atomically
4. **adjust_inventory()** - Adjust inventory levels for counts, damage, or corrections

### Key Features

- **Hierarchical Categories**: Support for nested product categories
- **Hierarchical Locations**: Multi-level location structure (warehouse → zone → aisle → bin)
- **Inventory Movements**: Complete audit trail with atomic stock updates
- **Stored Procedures**: Safe, validated operations for common inventory tasks
- **Transaction Safety**: Atomic operations with automatic rollback on errors
- **Data Integrity**: Comprehensive constraints and validation rules
- **Performance Optimized**: Strategic indexes for common query patterns
- **Audit Trail**: Automatic timestamp tracking with triggers
- **Referential Integrity**: Foreign key relationships maintain data consistency

### Constraints and Validation

- SKU uniqueness across all products
- Positive values for quantities, prices, and dimensions
- Valid status values for products ('active', 'discontinued', 'pending')
- Email format validation for suppliers
- Non-empty required fields

### Indexes

Performance indexes are created for:
- Primary lookups (SKU, codes, names)
- Foreign key relationships
- Status-based filtering
- Hierarchical queries

## Requirements Satisfied

This schema implementation satisfies the following requirements:

- **1.1**: Product identification with SKU, name, description, and category
- **1.4**: Unique SKU constraints and product status management
- **2.1**: Multi-location inventory support with hierarchical organization
- **2.2**: Location-based stock tracking foundation
- **3.1**: Supplier information storage and management
- **4.1**: Record all inventory transactions with timestamp, user, and reason
- **4.2**: Support movement types including receipts, sales, transfers, and adjustments
- **4.3**: Maintain transaction references to source documents
- **4.4**: Ensure inventory movements update stock levels atomically

## Next Steps

After setting up the database:

1. **Review the migration system**: See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for deployment and versioning
2. **Import legacy data**: Use utilities in `migrations/data/` to import from existing systems
3. **Set up monitoring**: Run `migrations/health_check.sh` regularly to monitor database health
4. **Configure backups**: Set up automated backups using the deployment scripts
5. **Performance testing**: Generate test data and run performance benchmarks
6. **Application integration**: Connect your application using the stored procedures and views

## Documentation

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Complete guide for migrations, deployments, and data migration
- **[migrations/QUICKSTART.md](migrations/QUICKSTART.md)** - Quick start guide for the migration system
- **[migrations/README.md](migrations/README.md)** - Migration system overview
- **[migrations/data/README.md](migrations/data/README.md)** - Data migration utilities guide
- **[REPORTING_DOCUMENTATION.md](REPORTING_DOCUMENTATION.md)** - Reporting views and functions
- **[PROCEDURES_DOCUMENTATION.md](PROCEDURES_DOCUMENTATION.md)** - Stored procedures documentation
- **[SAMPLE_DATA_DOCUMENTATION.md](SAMPLE_DATA_DOCUMENTATION.md)** - Sample data documentation

## Usage Examples

### Adding a new category:
```sql
INSERT INTO categories (name, description, parent_category_id) 
VALUES ('Laptops', 'Portable computers', 1);
```

### Adding a new product:
```sql
INSERT INTO products (sku, name, category_id, unit_of_measure, cost_price, selling_price)
VALUES ('LAP001', 'Business Laptop 15"', 5, 'each', 800.00, 1200.00);
```

### Adding a location:
```sql
INSERT INTO locations (code, name, location_type, parent_location_id)
VALUES ('A01-B02', 'Aisle A01 Bin B02', 'bin', 1);
```

### Adding a supplier:
```sql
INSERT INTO suppliers (code, name, contact_person, email, payment_terms)
VALUES ('TECH001', 'TechCorp Solutions', 'Jane Doe', 'jane@techcorp.com', 'Net 30');
```

## Inventory Operations

### Receiving inventory from supplier:
```sql
SELECT * FROM receive_inventory(
    1,              -- product_id
    1,              -- location_id
    50,             -- quantity
    800.00,         -- unit_cost
    'PO-2024-100',  -- reference_document
    'Initial stock receipt',  -- notes
    'john_doe'      -- created_by
);
```

### Shipping inventory to customer:
```sql
SELECT * FROM ship_inventory(
    1,              -- product_id
    1,              -- location_id
    10,             -- quantity
    800.00,         -- unit_cost
    'SO-2024-200',  -- reference_document
    'Customer order #12345',  -- notes
    'jane_smith'    -- created_by
);
```

### Transferring inventory between locations:
```sql
SELECT * FROM transfer_inventory(
    1,              -- product_id
    1,              -- from_location_id
    2,              -- to_location_id
    25,             -- quantity
    800.00,         -- unit_cost
    'TRF-2024-300', -- reference_document
    'Rebalancing stock',  -- notes
    'warehouse_mgr' -- created_by
);
```

### Adjusting inventory (cycle count, damage, etc.):
```sql
-- Positive adjustment (found extra items)
SELECT * FROM adjust_inventory(
    1,              -- product_id
    1,              -- location_id
    5,              -- adjustment_quantity (positive)
    'Physical count found 5 additional units',  -- reason
    'ADJ-2024-400', -- reference_document
    'inventory_clerk' -- created_by
);

-- Negative adjustment (damaged items)
SELECT * FROM adjust_inventory(
    1,              -- product_id
    1,              -- location_id
    -3,             -- adjustment_quantity (negative)
    'Damaged units found during inspection',  -- reason
    'ADJ-2024-401', -- reference_document
    'qa_inspector'  -- created_by
);
```

## Testing

Run the comprehensive test suite:
```bash
psql -d inventory_management -f test_inventory_procedures.sql
```

The test suite covers:
- Success cases for all operations
- Error handling and validation
- Insufficient stock scenarios
- Atomic transactions with multiple operations
- Concurrent operations simulation