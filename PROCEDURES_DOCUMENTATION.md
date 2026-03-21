# Inventory Movement Procedures Documentation

## Overview

This document describes the stored procedures implemented for common inventory operations in the PostgreSQL inventory management system. All procedures implement atomic transaction handling with comprehensive error management.

## Requirements Satisfied

These procedures satisfy the following requirements:

- **4.1**: Record all inventory transactions with timestamp, user, and reason
- **4.2**: Support movement types including receipts, sales, transfers, and adjustments
- **4.3**: Maintain transaction references to source documents
- **4.4**: Ensure inventory movements update stock levels atomically

## Procedures

### 1. receive_inventory()

Records inventory receipt from suppliers with validation and error handling.

**Signature:**
```sql
receive_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
```

**Parameters:**
- `p_product_id`: ID of the product being received
- `p_location_id`: ID of the location where stock is received
- `p_quantity`: Quantity received (must be positive)
- `p_unit_cost`: Cost per unit (must be non-negative)
- `p_reference_document`: Reference to source document (e.g., PO number)
- `p_notes`: Additional notes about the receipt
- `p_created_by`: Username of the person recording the receipt

**Returns:**
- `success`: Boolean indicating success or failure
- `message`: Descriptive message about the operation
- `movement_id`: ID of the created inventory movement record
- `new_stock_level`: Updated stock quantity after receipt

**Validations:**
- Quantity must be positive
- Unit cost cannot be negative
- Product must exist and be active
- Location must exist and be active
- Created by user is required

**Example Usage:**
```sql
SELECT * FROM receive_inventory(
    1,              -- product_id
    1,              -- location_id
    50,             -- quantity
    800.00,         -- unit_cost
    'PO-2024-001',  -- reference_document
    'Initial stock receipt',
    'john_doe'      -- created_by
);
```

**Example Output:**
```
success | message                           | movement_id | new_stock_level
--------|-----------------------------------|-------------|----------------
true    | Inventory received successfully   | 123         | 50
```

---

### 2. ship_inventory()

Records inventory shipment to customers with stock validation.

**Signature:**
```sql
ship_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
```

**Parameters:**
- `p_product_id`: ID of the product being shipped
- `p_location_id`: ID of the location from which stock is shipped
- `p_quantity`: Quantity shipped (must be positive)
- `p_unit_cost`: Cost per unit (must be non-negative)
- `p_reference_document`: Reference to source document (e.g., SO number)
- `p_notes`: Additional notes about the shipment
- `p_created_by`: Username of the person recording the shipment

**Returns:**
- `success`: Boolean indicating success or failure
- `message`: Descriptive message about the operation
- `movement_id`: ID of the created inventory movement record
- `new_stock_level`: Updated stock quantity after shipment

**Validations:**
- Quantity must be positive
- Unit cost cannot be negative
- Product must exist and be active
- Location must exist and be active