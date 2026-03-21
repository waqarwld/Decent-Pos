# Database Functions Unit Test Suite

## Overview

This test suite provides comprehensive unit testing for the inventory management database functions, triggers, constraints, and stored procedures.

## Test Coverage

### Section 1: Trigger Function Tests (5 tests)
- Test trigger creates new stock level on first movement
- Test trigger updates existing stock level
- Test trigger handles negative movements (sales)
- Test trigger handles transfers correctly
- Test trigger updates last_movement_at timestamp

### Section 2: Constraint Enforcement Tests (10 tests)
- Positive quantity constraint on stock_levels
- Reserved quantity cannot exceed on_hand
- Unique constraint on product-location combination
- SKU uniqueness constraint
- Foreign key constraint on product_id
- Foreign key constraint on location_id
- Movement quantity cannot be zero
- Product status validation
- Positive price constraints
- Reorder settings validation

### Section 3: Stored Procedure Tests (15 tests)
- receive_inventory - Success case
- receive_inventory - Negative quantity
- receive_inventory - Inactive product
- ship_inventory - Success case
- ship_inventory - Insufficient stock
- transfer_inventory - Success case
- transfer_inventory - Same source and destination
- transfer_inventory - Insufficient stock
- adjust_inventory - Positive adjustment
- adjust_inventory - Negative adjustment
- adjust_inventory - Zero adjustment
- adjust_inventory - Insufficient stock for negative adjustment
- Helper function - validate_product
- Helper function - validate_location
- Helper function - get_stock_quantity

### Section 4: Edge Cases and Complex Scenarios (10 tests)
- Multiple concurrent movements
- Transfer chain across multiple locations
- Stock level with reserved quantity
- Reorder point detection
- Movement audit trail
- Product-supplier relationship with performance metrics
- Error handling in procedures
- Timestamp tracking
- Transaction atomicity
- Large quantity handling

### Section 5: Data Integrity Validation (5 tests)
- Stock level consistency with movements
- Referential integrity cascade
- Unique constraint enforcement
- Check constraint validation
- Generated column accuracy

## Requirements Validated

- **Requirement 2.5**: Prevent negative stock levels through validation constraints
- **Requirement 4.4**: Ensure inventory movements update stock levels atomically
- **Data Integrity**: Comprehensive validation across all database operations

## Running the Tests

### Prerequisites

1. PostgreSQL database with the inventory schema installed
2. Database initialized with `init_database.sql`
3. psql command-line tool

### Execution

Run the complete test suite:

```bash
psql -U your_username -d inventory_db -f test_database_functions.sql
```

Or with connection string:

```bash
psql postgresql://username:password@localhost:5432/inventory_db -f test_database_functions.sql
```

### Test Output

The test suite provides detailed output for each test:
- **PASS**: Test succeeded
- **FAIL**: Test failed with error details
- **NOTICE**: Informational messages

All tests use transactions with ROLLBACK, so they don't affect the database state.

## Test Fixtures

The test suite includes built-in fixtures:

### setup_test_data()
Creates test data including:
- Test category (TEST-CATEGORY)
- Test products (TEST-PROD-001, TEST-PROD-002, TEST-PROD-003)
- Test locations (TEST-LOC-001, TEST-LOC-002, TEST-LOC-003)
- Test suppliers (TEST-SUP-001, TEST-SUP-002)

### cleanup_test_data()
Removes all test data to ensure clean state.

## Test Isolation

Each test:
1. Begins a transaction
2. Calls setup_test_data() to create fixtures
3. Executes the test logic
4. Validates results
5. Rolls back the transaction

This ensures:
- No side effects between tests
- Database remains unchanged after test execution
- Tests can be run repeatedly

## Interpreting Results

### Success
All tests should output "PASS" messages. The final summary shows:
- Total tests executed: 45
- Test coverage by section
- Requirements validated

### Failure
If a test fails:
1. Review the error message for details
2. Check the specific test case that failed
3. Verify database schema matches expected structure
4. Ensure all required functions and triggers are installed

## Integration with CI/CD

To integrate with continuous integration:

```bash
#!/bin/bash
# Run tests and capture exit code
psql -U postgres -d inventory_db -f test_database_functions.sql > test_results.log 2>&1

# Check for failures
if grep -q "FAIL:" test_results.log; then
    echo "Tests failed!"
    cat test_results.log
    exit 1
else
    echo "All tests passed!"
    exit 0
fi
```

## Maintenance

When adding new database functions:
1. Add corresponding unit tests to the appropriate section
2. Update the test count in the summary
3. Document any new test fixtures required
4. Ensure tests follow the transaction/rollback pattern

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "relation does not exist"
- **Solution**: Ensure schema.sql has been executed first

**Issue**: Tests fail with "function does not exist"
- **Solution**: Ensure inventory_procedures.sql has been executed

**Issue**: Permission denied errors
- **Solution**: Ensure database user has appropriate permissions

**Issue**: Tests timeout
- **Solution**: Check for long-running queries or locks on tables

## Contact

For issues or questions about the test suite, refer to the main project documentation or contact the database team.
