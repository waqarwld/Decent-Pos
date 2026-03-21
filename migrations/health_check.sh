#!/bin/bash
# Database Health Check Script
# Usage: ./health_check.sh [environment]

set -e

# Configuration
DB_NAME="${DB_NAME:-inventory_management}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Load environment if specified
if [ $# -gt 0 ]; then
    ENV_FILE="config/$1.env"
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        print_info "Loaded configuration from $ENV_FILE"
    fi
fi

print_header "Database Health Check"
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Check 1: Database Connection
print_header "Connection Test"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    print_pass "Database connection successful"
else
    print_fail "Cannot connect to database"
    exit 1
fi
echo ""

# Check 2: Schema Version
print_header "Schema Version"
VERSION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT get_current_schema_version()" 2>/dev/null || echo "N/A")
if [ "$VERSION" != "N/A" ]; then
    print_pass "Current schema version: $VERSION"
else
    print_warn "Schema version tracking not initialized"
fi
echo ""

# Check 3: Table Counts
print_header "Table Statistics"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
" 2>/dev/null || print_warn "Could not retrieve table statistics"
echo ""

# Check 4: Record Counts
print_header "Record Counts"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'Categories' as entity, COUNT(*) as count FROM categories
UNION ALL SELECT 'Products', COUNT(*) FROM products
UNION ALL SELECT 'Locations', COUNT(*) FROM locations
UNION ALL SELECT 'Suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'Stock Levels', COUNT(*) FROM stock_levels
UNION ALL SELECT 'Inventory Movements', COUNT(*) FROM inventory_movements
UNION ALL SELECT 'Product Suppliers', COUNT(*) FROM product_suppliers
UNION ALL SELECT 'Reorder Settings', COUNT(*) FROM reorder_settings
ORDER BY entity;
" 2>/dev/null || print_warn "Could not retrieve record counts"
echo ""

# Check 5: Data Integrity
print_header "Data Integrity Checks"

# Check for orphaned records
ORPHANED=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM stock_levels sl
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.product_id = sl.product_id)
   OR NOT EXISTS (SELECT 1 FROM locations l WHERE l.location_id = sl.location_id);
" 2>/dev/null || echo "0")

if [ "$ORPHANED" -eq 0 ]; then
    print_pass "No orphaned stock level records"
else
    print_fail "Found $ORPHANED orphaned stock level records"
fi

# Check for negative stock
NEGATIVE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM stock_levels WHERE quantity_on_hand < 0;
" 2>/dev/null || echo "0")

if [ "$NEGATIVE" -eq 0 ]; then
    print_pass "No negative stock quantities"
else
    print_fail "Found $NEGATIVE locations with negative stock"
fi

# Check for duplicate SKUs
DUPLICATES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM (
    SELECT sku FROM products GROUP BY sku HAVING COUNT(*) > 1
) dups;
" 2>/dev/null || echo "0")

if [ "$DUPLICATES" -eq 0 ]; then
    print_pass "No duplicate SKUs found"
else
    print_fail "Found $DUPLICATES duplicate SKUs"
fi

echo ""

# Check 6: Index Health
print_header "Index Health"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;
" 2>/dev/null || print_warn "Could not retrieve index information"
echo ""

# Check 7: Recent Activity
print_header "Recent Activity"
RECENT_MOVEMENTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM inventory_movements 
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
" 2>/dev/null || echo "0")

print_info "Inventory movements in last 24 hours: $RECENT_MOVEMENTS"

LAST_MOVEMENT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT MAX(created_at) FROM inventory_movements;
" 2>/dev/null || echo "N/A")

print_info "Last inventory movement: $LAST_MOVEMENT"
echo ""

# Check 8: Database Size
print_header "Database Size"
DB_SIZE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
" 2>/dev/null || echo "N/A")

print_info "Total database size: $DB_SIZE"
echo ""

# Check 9: Active Connections
print_header "Active Connections"
CONNECTIONS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';
" 2>/dev/null || echo "N/A")

print_info "Active connections: $CONNECTIONS"
echo ""

# Summary
print_header "Health Check Summary"
print_pass "Health check completed"
echo ""
echo "For detailed validation, run:"
echo "  psql -d $DB_NAME -f data/validate_migration.sql"
