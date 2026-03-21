#!/bin/bash

# Database Functions Unit Test Runner
# This script runs the comprehensive unit test suite for database functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_management}"
DB_USER="${DB_USER:-inventory_user}"
DB_PASSWORD="${DB_PASSWORD:-inventory_pass}"

echo "========================================="
echo "Database Functions Unit Test Suite"
echo "========================================="
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if PostgreSQL is accessible
echo "Checking database connection..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to database${NC}"
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database credentials are correct"
    echo "  3. Database '$DB_NAME' exists"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Run the test suite
echo "Running unit tests..."
echo "========================================="
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f test_database_functions.sql > test_results.log 2>&1

# Check for failures
if grep -q "FAIL:" test_results.log; then
    echo -e "${RED}✗ TESTS FAILED${NC}"
    echo ""
    echo "Failed tests:"
    grep "FAIL:" test_results.log
    echo ""
    echo "Full test output saved to: test_results.log"
    exit 1
else
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    
    # Count passed tests
    PASS_COUNT=$(grep -c "PASS:" test_results.log || echo "0")
    echo "Tests passed: $PASS_COUNT"
    echo ""
    echo "Full test output saved to: test_results.log"
    exit 0
fi
