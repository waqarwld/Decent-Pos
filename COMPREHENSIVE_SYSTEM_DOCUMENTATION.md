# Inventory Management System - Comprehensive Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Entity Relationship Diagrams](#entity-relationship-diagrams)
3. [Database Schema Reference](#database-schema-reference)
4. [Stored Procedures API](#stored-procedures-api)
5. [Reporting Views and Functions](#reporting-views-and-functions)
6. [Usage Examples](#usage-examples)
7. [Best Practices Guide](#best-practices-guide)

---

## System Overview

The Inventory Management System is a comprehensive PostgreSQL database solution designed to track products, stock levels, locations, suppliers, and inventory movements. The system supports multi-location inventory tracking, automated reordering, supplier performance management, and complete audit trails.

### Key Features

- **Multi-location inventory tracking** with hierarchical location organization
- **Real-time stock level management** with reserved quantity tracking
- **Automated reorder point monitoring** with supplier integration
- **Complete audit trail** of all inventory movements
- **Supplier performance tracking** with quality and delivery metrics
- **Comprehensive reporting** including valuation, aging, and turnover analysis
- **Atomic transaction handling** with error management
- **Performance optimized** with strategic indexing

### Technology Stack

- **Database**: PostgreSQL 12+
- **Extensions**: uuid-ossp
- **Language**: PL/pgSQL for stored procedures and triggers

---

## Entity Relationship Diagrams

### Core Entity Relationships

```
┌─────────────────┐
│   Categories    │
│  (Hierarchical) │
└────────┬────────┘
         │ 1
         │
         │ M
┌────────▼────────┐         ┌─────────────────┐
│    Products     │◄───M:M──┤Product_Suppliers│
└────────┬────────┘         └────────┬────────┘
         │ 1                         │ M
         │                           │
         │ M                         │ 1
┌────────▼────────┐         ┌────────▼────────┐
│  Stock_Levels   │         │    Suppliers    │
└────────┬────────┘         └─────────────────┘
         │ M:1
         │
         │ 1:M
┌────────▼────────┐
│   Locations     │
│  (Hierarchical) │
└────────┬────────┘
         │ 1
         │
         │ M
┌────────▼────────┐         ┌─────────────────┐
│Inventory_       │◄───M:1──┤ Movement_Types  │
│Movements        │         └─────────────────┘
└─────────────────┘
```

### Detailed Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CATEGORIES                                 │
├──────────────────────────────────────────────────────────────────┤
│ PK │ category_id         SERIAL                                  │
│    │ name                VARCHAR(100)                             │
│    │ description         TEXT                                     │
│ FK │ parent_category_id  INTEGER → categories(category_id)       │
│    │ is_active           BOOLEAN                                  │
│    │ created_at          TIMESTAMP                                │
│    │ updated_at          TIMESTAMP                                │
└──────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:M
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         PRODUCTS                                  │
├──────────────────────────────────────────────────────────────────┤
│ PK │ product_id          SERIAL                                  │
│ UK │ sku                 VARCHAR(50)                              │
│    │ name                VARCHAR(200)                             │
│    │ description         TEXT                                     │
│ FK │ category_id         INTEGER → categories(category_id)       │
│    │ unit_of_measure     VARCHAR(20)                              │
│    │ weight_kg           DECIMAL(10,3)                            │
│    │ length_cm           DECIMAL(8,2)                             │
│    │ width_cm            DECIMAL(8,2)                             │
│    │ height_cm           DECIMAL(8,2)                             │
│    │ cost_price          DECIMAL(12,2)                            │
│    │ selling_price       DECIMAL(12,2)                            │
│    │ status              VARCHAR(20)                              │
│    │ created_at          TIMESTAMP                                │
│    │ updated_at          TIMESTAMP                                │
└──────────────────────────────────────────────────────────────────┘
         │                                    │
         │ 1:M                                │ M:M
         ▼                                    ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│     STOCK_LEVELS        │    │    PRODUCT_SUPPLIERS             │
├─────────────────────────┤    ├──────────────────────────────────┤
│ PK │ stock_level_id     │    │ PK │ product_supplier_id       │
│ FK │ product_id         │    │ FK │ product_id                │
│ FK │ location_id        │    │ FK │ supplier_id               │
│    │ quantity_on_hand   │    │    │ supplier_sku              │
│    │ quantity_reserved  │    │    │ lead_time_days            │
│    │ quantity_available │    │    │ minimum_order_qty         │
│    │ last_counted_at    │    │    │ cost_price                │
│    │ last_movement_at   │    │    │ is_preferred              │
└─────────────────────────┘    │    │ is_active                 │
         │                      │    │ average_delivery_days     │
         │ M:1                  │    │ on_time_delivery_rate     │
         ▼                      │    │ quality_rating            │
┌─────────────────────────┐    │    │ total_orders              │
│      LOCATIONS          │    │    │ total_delivered           │
├─────────────────────────┤    │    │ last_order_date           │
│ PK │ location_id        │    │    │ last_delivery_date        │
│ UK │ code               │    │    │ created_at                │
│    │ name               │    │    │ updated_at                │
│    │ location_type      │    └──────────────────────────────────┘
│ FK │ parent_location_id │                   │
│    │ capacity           │                   │ M:1
│    │ is_active          │                   ▼
│    │ created_at         │    ┌──────────────────────────────────┐
└─────────────────────────┘    │         SUPPLIERS                │
         │                      ├──────────────────────────────────┤
         │ 1:M                  │ PK │ supplier_id               │
         ▼                      │ UK │ code                      │
┌─────────────────────────┐    │    │ name                      │
│  INVENTORY_MOVEMENTS    │    │    │ contact_person            │
├─────────────────────────┤    │    │ email                     │
│ PK │ movement_id        │    │    │ phone                     │
│ FK │ product_id         │    │    │ address                   │
│ FK │ location_id        │    │    │ payment_terms             │
│ FK │ movement_type_id   │    │    │ is_active                 │
│    │ quantity           │    │    │ created_at                │
│    │ unit_cost          │    └──────────────────────────────────┘
│    │ reference_document │
│    │ notes              │
│    │ created_by         │
│    │ created_at         │
└─────────────────────────┘
         │ M:1
         ▼
┌─────────────────────────┐
│    MOVEMENT_TYPES       │
├─────────────────────────┤
│ PK │ movement_type_id   │
│ UK │ code               │
│    │ name               │
│    │ description        │
│    │ affects_quantity   │
└─────────────────────────┘

┌─────────────────────────┐
│   REORDER_SETTINGS      │
├─────────────────────────┤
│ PK │ reorder_setting_id │
│ FK │ product_id         │
│ FK │ location_id        │
│    │ reorder_point      │
│    │ reorder_quantity   │
│    │ maximum_stock      │
│    │ is_active          │
│    │ created_at         │
│    │ updated_at         │
└─────────────────────────┘
```

### Relationship Cardinalities

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| Categories → Categories | 1:M | Hierarchical category structure |
| Categories → Products | 1:M | Each product belongs to one category |
| Products → Stock_Levels | 1:M | Product can have stock at multiple locations |
| Locations → Stock_Levels | 1:M | Location can store multiple products |
| Products → Product_Suppliers | 1:M | Product can have multiple suppliers |
| Suppliers → Product_Suppliers | 1:M | Supplier can supply multiple products |
| Products → Inventory_Movements | 1:M | Product can have many movements |
| Locations → Inventory_Movements | 1:M | Location can have many movements |
| Movement_Types → Inventory_Movements | 1:M | Movement type classifies movements |
| Products → Reorder_Settings | 1:M | Product can have reorder settings per location |
| Locations → Reorder_Settings | 1:M | Location can have reorder settings per product |

---

## Database Schema Reference

### Core Tables

#### 1. Categories

Stores product categories with hierarchical structure support.

**Table Name**: `categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| category_id | SERIAL | PRIMARY KEY | Unique category identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| description | TEXT | | Category description |
| parent_category_id | INTEGER | FK → categories(category_id) | Parent category for hierarchy |
| is_active | BOOLEAN | DEFAULT true | Active status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- `categories_name_not_empty`: Name must not be empty
- Self-referencing foreign key for hierarchical structure

**Indexes**:
- `idx_categories_parent`: On parent_category_id
- `idx_categories_active`: On is_active (filtered)
- `idx_categories_name`: On name

**Triggers**:
- `trigger_categories_updated_at`: Auto-updates updated_at on modification

---

#### 2. Products

Master product catalog with detailed attributes and pricing.

**Table Name**: `products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| product_id | SERIAL | PRIMARY KEY | Unique product identifier |
| sku | VARCHAR(50) | UNIQUE NOT NULL | Stock Keeping Unit |
| name | VARCHAR(200) | NOT NULL | Product name |
| description | TEXT | | Product description |
| category_id | INTEGER | FK → categories(category_id) | Product category |
| unit_of_measure | VARCHAR(20) | NOT NULL | Unit of measure (ea, kg, m, etc.) |
| weight_kg | DECIMAL(10,3) | | Product weight in kilograms |
| length_cm | DECIMAL(8,2) | | Product length in centimeters |
| width_cm | DECIMAL(8,2) | | Product width in centimeters |
| height_cm | DECIMAL(8,2) | | Product height in centimeters |
| cost_price | DECIMAL(12,2) | | Cost price per unit |
| selling_price | DECIMAL(12,2) | | Selling price per unit |
| status | VARCHAR(20) | DEFAULT 'active' | Product status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- `products_sku_not_empty`: SKU must not be empty
- `products_name_not_empty`: Name must not be empty
- `products_uom_not_empty`: Unit of measure must not be empty
- `products_status_valid`: Status must be 'active', 'discontinued', or 'pending'
- `products_weight_positive`: Weight must be non-negative
- `products_dimensions_positive`: Dimensions must be non-negative
- `products_prices_positive`: Prices must be non-negative

**Indexes**:
- `idx_products_sku`: On sku
- `idx_products_category`: On category_id
- `idx_products_status`: On status
- `idx_products_name`: On name
- `idx_products_active`: On status (filtered for active)

**Triggers**:
- `trigger_products_updated_at`: Auto-updates updated_at on modification

---

#### 3. Locations

Storage locations with hierarchical organization (warehouse → zone → aisle → bin).

**Table Name**: `locations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| location_id | SERIAL | PRIMARY KEY | Unique location identifier |
| code | VARCHAR(50) | UNIQUE NOT NULL | Location code |
| name | VARCHAR(100) | NOT NULL | Location name |
| location_type | VARCHAR(30) | NOT NULL | Type (warehouse, zone, aisle, bin) |
| parent_location_id | INTEGER | FK → locations(location_id) | Parent location for hierarchy |
| capacity | INTEGER | | Storage capacity |
| is_active | BOOLEAN | DEFAULT true | Active status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Constraints**:
- `locations_code_not_empty`: Code must not be empty
- `locations_name_not_empty`: Name must not be empty
- `locations_type_not_empty`: Type must not be empty
- `locations_capacity_positive`: Capacity must be positive
- Self-referencing foreign key for hierarchical structure

**Indexes**:
- `idx_locations_code`: On code
- `idx_locations_parent`: On parent_location_id
- `idx_locations_type`: On location_type
- `idx_locations_active`: On is_active (filtered)

---

#### 4. Suppliers

Vendor information and contact details for procurement.

**Table Name**: `suppliers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| supplier_id | SERIAL | PRIMARY KEY | Unique supplier identifier |
| code | VARCHAR(50) | UNIQUE NOT NULL | Supplier code |
| name | VARCHAR(200) | NOT NULL | Supplier name |
| contact_person | VARCHAR(100) | | Contact person name |
| email | VARCHAR(100) | | Email address |
| phone | VARCHAR(30) | | Phone number |
| address | TEXT | | Physical address |
| payment_terms | VARCHAR(50) | | Payment terms and conditions |
| is_active | BOOLEAN | DEFAULT true | Active status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Constraints**:
- `suppliers_code_not_empty`: Code must not be empty
- `suppliers_name_not_empty`: Name must not be empty
- `suppliers_email_format`: Email must be valid format

**Indexes**:
- `idx_suppliers_code`: On code
- `idx_suppliers_name`: On name
- `idx_suppliers_active`: On is_active (filtered)

---

### Stock Management Tables

#### 5. Stock_Levels

Current stock quantities by product and location with generated available quantity.

**Table Name**: `stock_levels`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| stock_level_id | SERIAL | PRIMARY KEY | Unique stock level identifier |
| product_id | INTEGER | NOT NULL, FK → products(product_id) | Product reference |
| location_id | INTEGER | NOT NULL, FK → locations(location_id) | Location reference |
| quantity_on_hand | INTEGER | NOT NULL DEFAULT 0 | Total quantity in stock |
| quantity_reserved | INTEGER | NOT NULL DEFAULT 0 | Quantity allocated but not shipped |
| quantity_available | INTEGER | GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED | Available quantity (computed) |
| last_counted_at | TIMESTAMP | | Last physical count timestamp |
| last_movement_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last movement timestamp |

**Constraints**:
- `stock_levels_unique_product_location`: Unique combination of product_id and location_id
- `stock_levels_positive_quantities`: All quantities must be non-negative, reserved ≤ on_hand

**Indexes**:
- `idx_stock_levels_product`: On product_id
- `idx_stock_levels_location`: On location_id
- `idx_stock_levels_available`: On quantity_available (filtered for > 0)

**Notes**:
- `quantity_available` is a generated column automatically calculated as `quantity_on_hand - quantity_reserved`
- Updated automatically by triggers when inventory movements are recorded

---

#### 6. Movement_Types

Lookup table for different types of inventory movements.

**Table Name**: `movement_types`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| movement_type_id | SERIAL | PRIMARY KEY | Unique movement type identifier |
| code | VARCHAR(20) | UNIQUE NOT NULL | Movement type code |
| name | VARCHAR(50) | NOT NULL | Movement type name |
| description | TEXT | | Movement type description |
| affects_quantity | INTEGER | NOT NULL | Quantity multiplier: 1 (increase) or -1 (decrease) |

**Constraints**:
- `movement_types_code_not_empty`: Code must not be empty
- `movement_types_name_not_empty`: Name must not be empty
- `movement_types_affects_quantity_valid`: Must be 1 or -1

**Standard Movement Types**:
- `RECEIPT` (affects_quantity: 1): Receiving inventory from supplier
- `SALE` (affects_quantity: -1): Selling/shipping inventory to customer
- `TRANSFER_OUT` (affects_quantity: -1): Transferring out of location
- `TRANSFER_IN` (affects_quantity: 1): Transferring into location
- `ADJUSTMENT_POS` (affects_quantity: 1): Positive adjustment (count correction)
- `ADJUSTMENT_NEG` (affects_quantity: -1): Negative adjustment (damage, loss)

---

#### 7. Inventory_Movements

Complete audit trail of all inventory transactions.

**Table Name**: `inventory_movements`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| movement_id | SERIAL | PRIMARY KEY | Unique movement identifier |
| product_id | INTEGER | NOT NULL, FK → products(product_id) | Product reference |
| location_id | INTEGER | NOT NULL, FK → locations(location_id) | Location reference |
| movement_type_id | INTEGER | NOT NULL, FK → movement_types(movement_type_id) | Movement type reference |
| quantity | INTEGER | NOT NULL | Quantity moved (always positive) |
| unit_cost | DECIMAL(12,2) | | Cost per unit |
| reference_document | VARCHAR(100) | | Reference to source document (PO, SO, etc.) |
| notes | TEXT | | Additional notes |
| created_by | VARCHAR(100) | NOT NULL | User who created the movement |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Movement timestamp |

**Constraints**:
- `inventory_movements_quantity_not_zero`: Quantity must not be zero
- `inventory_movements_created_by_not_empty`: Created by must not be empty
- `inventory_movements_unit_cost_positive`: Unit cost must be non-negative

**Indexes**:
- `idx_inventory_movements_product_date`: On product_id, created_at
- `idx_inventory_movements_location_date`: On location_id, created_at
- `idx_inventory_movements_type`: On movement_type_id
- `idx_inventory_movements_created_at`: On created_at DESC

**Triggers**:
- `trigger_update_stock_levels`: Automatically updates stock_levels table after insert

---

#### 8. Reorder_Settings

Automated reordering configuration by product and location.

**Table Name**: `reorder_settings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| reorder_setting_id | SERIAL | PRIMARY KEY | Unique reorder setting identifier |
| product_id | INTEGER | NOT NULL, FK → products(product_id) | Product reference |
| location_id | INTEGER | NOT NULL, FK → locations(location_id) | Location reference |
| reorder_point | INTEGER | NOT NULL | Stock level that triggers reorder |
| reorder_quantity | INTEGER | NOT NULL | Quantity to order when triggered |
| maximum_stock | INTEGER | | Maximum stock level to maintain |
| is_active | BOOLEAN | DEFAULT true | Active status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- `reorder_settings_unique_product_location`: Unique combination of product_id and location_id
- `reorder_settings_positive_values`: All values must be non-negative, maximum ≥ reorder_point

**Indexes**:
- `idx_reorder_settings_product`: On product_id
- `idx_reorder_settings_location`: On location_id
- `idx_reorder_settings_active`: On is_active (filtered)

**Triggers**:
- `trigger_reorder_settings_updated_at`: Auto-updates updated_at on modification

---

### Supplier Relationship Tables

#### 9. Product_Suppliers

Product-supplier relationships with terms and performance tracking.

**Table Name**: `product_suppliers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| product_supplier_id | SERIAL | PRIMARY KEY | Unique relationship identifier |
| product_id | INTEGER | NOT NULL, FK → products(product_id) | Product reference |
| supplier_id | INTEGER | NOT NULL, FK → suppliers(supplier_id) | Supplier reference |
| supplier_sku | VARCHAR(100) | | Supplier's internal SKU/part number |
| lead_time_days | INTEGER | | Expected lead time in days |
| minimum_order_qty | INTEGER | | Minimum order quantity |
| cost_price | DECIMAL(12,2) | | Cost price from this supplier |
| is_preferred | BOOLEAN | DEFAULT false | Preferred supplier flag |
| is_active | BOOLEAN | DEFAULT true | Active relationship flag |
| average_delivery_days | DECIMAL(5,2) | | Average actual delivery time |
| on_time_delivery_rate | DECIMAL(5,4) | | On-time delivery rate (0.0-1.0) |
| quality_rating | DECIMAL(3,2) | | Quality rating (0.0-5.0) |
| total_orders | INTEGER | DEFAULT 0 | Total orders placed |
| total_delivered | INTEGER | DEFAULT 0 | Total orders delivered |
| last_order_date | DATE | | Last order date |
| last_delivery_date | DATE | | Last delivery date |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- `product_suppliers_unique_product_supplier`: Unique combination of product_id and supplier_id
- `product_suppliers_lead_time_positive`: Lead time must be non-negative
- `product_suppliers_min_order_positive`: Minimum order quantity must be positive
- `product_suppliers_cost_positive`: Cost price must be non-negative
- `product_suppliers_delivery_days_positive`: Average delivery days must be non-negative
- `product_suppliers_delivery_rate_valid`: Delivery rate must be between 0 and 1
- `product_suppliers_quality_rating_valid`: Quality rating must be between 0 and 5
- `product_suppliers_order_counts_valid`: Delivered ≤ total orders

**Indexes**:
- `idx_product_suppliers_product`: On product_id
- `idx_product_suppliers_supplier`: On supplier_id
- `idx_product_suppliers_preferred`: On product_id, is_preferred (filtered)
- `idx_product_suppliers_active`: On is_active (filtered)
- `idx_product_suppliers_supplier_sku`: On supplier_id, supplier_sku
- `idx_product_suppliers_performance`: On quality_rating DESC, on_time_delivery_rate DESC (filtered)

**Triggers**:
- `trigger_product_suppliers_updated_at`: Auto-updates updated_at on modification

---


## Stored Procedures API

The system provides four main stored procedures for inventory operations, along with helper functions for validation and queries.

### Helper Functions

#### validate_product(p_product_id INTEGER)

Validates that a product exists and is active.

**Parameters**:
- `p_product_id` (INTEGER): Product ID to validate

**Returns**: BOOLEAN
- `true` if product exists and status is 'active'
- `false` otherwise

**Example**:
```sql
SELECT validate_product(1);
-- Returns: true or false
```

---

#### validate_location(p_location_id INTEGER)

Validates that a location exists and is active.

**Parameters**:
- `p_location_id` (INTEGER): Location ID to validate

**Returns**: BOOLEAN
- `true` if location exists and is_active is true
- `false` otherwise

**Example**:
```sql
SELECT validate_location(1);
-- Returns: true or false
```

---

#### get_stock_quantity(p_product_id INTEGER, p_location_id INTEGER)

Retrieves the current stock quantity for a product at a location.

**Parameters**:
- `p_product_id` (INTEGER): Product ID
- `p_location_id` (INTEGER): Location ID

**Returns**: INTEGER
- Current quantity_on_hand
- 0 if no stock record exists

**Example**:
```sql
SELECT get_stock_quantity(1, 1);
-- Returns: 100
```

---

### Main Inventory Procedures

#### 1. receive_inventory()

Records inventory receipt from supplier with validation and error handling.

**Function Signature**:
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

**Parameters**:
- `p_product_id` (INTEGER, required): Product being received
- `p_location_id` (INTEGER, required): Location where inventory is received
- `p_quantity` (INTEGER, required): Quantity received (must be positive)
- `p_unit_cost` (DECIMAL, required): Cost per unit (must be non-negative)
- `p_reference_document` (VARCHAR, optional): Reference to purchase order or receipt document
- `p_notes` (TEXT, optional): Additional notes about the receipt
- `p_created_by` (VARCHAR, required): Username of person recording the receipt

**Returns**: TABLE
- `success` (BOOLEAN): true if successful, false if error
- `message` (TEXT): Success or error message
- `movement_id` (INTEGER): ID of created inventory movement (NULL on error)
- `new_stock_level` (INTEGER): New stock quantity after receipt (NULL on error)

**Validations**:
- Quantity must be positive
- Unit cost must be non-negative
- Created by user is required
- Product must exist and be active
- Location must exist and be active
- RECEIPT movement type must exist

**Example**:
```sql
SELECT * FROM receive_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_quantity := 100,
    p_unit_cost := 25.50,
    p_reference_document := 'PO-2024-001',
    p_notes := 'Received from Acme Supplies',
    p_created_by := 'john.doe'
);

-- Returns:
-- success | message                           | movement_id | new_stock_level
-- --------|-----------------------------------|-------------|----------------
-- true    | Inventory received successfully   | 1           | 100
```

**Error Handling**:
- Returns success=false with descriptive error message
- Transaction is rolled back on error
- No partial updates occur

---

#### 2. ship_inventory()

Records inventory shipment to customer with stock validation.

**Function Signature**:
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

**Parameters**:
- `p_product_id` (INTEGER, required): Product being shipped
- `p_location_id` (INTEGER, required): Location from which inventory is shipped
- `p_quantity` (INTEGER, required): Quantity shipped (must be positive)
- `p_unit_cost` (DECIMAL, required): Cost per unit (must be non-negative)
- `p_reference_document` (VARCHAR, optional): Reference to sales order or shipment document
- `p_notes` (TEXT, optional): Additional notes about the shipment
- `p_created_by` (VARCHAR, required): Username of person recording the shipment

**Returns**: TABLE
- `success` (BOOLEAN): true if successful, false if error
- `message` (TEXT): Success or error message
- `movement_id` (INTEGER): ID of created inventory movement (NULL on error)
- `new_stock_level` (INTEGER): New stock quantity after shipment (NULL on error)

**Validations**:
- Quantity must be positive
- Unit cost must be non-negative
- Created by user is required
- Product must exist and be active
- Location must exist and be active
- Sufficient stock must be available
- SALE movement type must exist

**Example**:
```sql
SELECT * FROM ship_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_quantity := 25,
    p_unit_cost := 25.50,
    p_reference_document := 'SO-2024-001',
    p_notes := 'Shipped to Customer ABC',
    p_created_by := 'jane.smith'
);

-- Returns:
-- success | message                          | movement_id | new_stock_level
-- --------|----------------------------------|-------------|----------------
-- true    | Inventory shipped successfully   | 2           | 75
```

**Error Handling**:
- Returns success=false if insufficient stock
- Provides available vs requested quantities in error message
- Transaction is rolled back on error

---

#### 3. transfer_inventory()

Transfers inventory between locations atomically.

**Function Signature**:
```sql
transfer_inventory(
    p_product_id INTEGER,
    p_from_location_id INTEGER,
    p_to_location_id INTEGER,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(12,2),
    p_reference_document VARCHAR(100),
    p_notes TEXT,
    p_created_by VARCHAR(100)
)
```

**Parameters**:
- `p_product_id` (INTEGER, required): Product being transferred
- `p_from_location_id` (INTEGER, required): Source location
- `p_to_location_id` (INTEGER, required): Destination location
- `p_quantity` (INTEGER, required): Quantity to transfer (must be positive)
- `p_unit_cost` (DECIMAL, required): Cost per unit (must be non-negative)
- `p_reference_document` (VARCHAR, optional): Reference to transfer document
- `p_notes` (TEXT, optional): Additional notes about the transfer
- `p_created_by` (VARCHAR, required): Username of person recording the transfer

**Returns**: TABLE
- `success` (BOOLEAN): true if successful, false if error
- `message` (TEXT): Success or error message
- `movement_out_id` (INTEGER): ID of transfer out movement (NULL on error)
- `movement_in_id` (INTEGER): ID of transfer in movement (NULL on error)
- `from_stock_level` (INTEGER): New stock at source location (NULL on error)
- `to_stock_level` (INTEGER): New stock at destination location (NULL on error)

**Validations**:
- Quantity must be positive
- Unit cost must be non-negative
- Created by user is required
- Source and destination locations must be different
- Product must exist and be active
- Both locations must exist and be active
- Sufficient stock must be available at source location
- TRANSFER_OUT and TRANSFER_IN movement types must exist

**Example**:
```sql
SELECT * FROM transfer_inventory(
    p_product_id := 1,
    p_from_location_id := 1,
    p_to_location_id := 2,
    p_quantity := 50,
    p_unit_cost := 25.50,
    p_reference_document := 'TRF-2024-001',
    p_notes := 'Transfer to secondary warehouse',
    p_created_by := 'john.doe'
);

-- Returns:
-- success | message                             | movement_out_id | movement_in_id | from_stock_level | to_stock_level
-- --------|-------------------------------------|-----------------|----------------|------------------|---------------
-- true    | Inventory transferred successfully  | 3               | 4              | 25               | 50
```

**Error Handling**:
- Returns success=false if insufficient stock at source
- Validates both locations before processing
- Creates both movements atomically (both succeed or both fail)
- Transaction is rolled back on error

---

#### 4. adjust_inventory()

Adjusts inventory levels for counts, damage, or corrections.

**Function Signature**:
```sql
adjust_inventory(
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_adjustment_quantity INTEGER,
    p_reason TEXT,
    p_reference_document VARCHAR(100),
    p_created_by VARCHAR(100)
)
```

**Parameters**:
- `p_product_id` (INTEGER, required): Product being adjusted
- `p_location_id` (INTEGER, required): Location where adjustment occurs
- `p_adjustment_quantity` (INTEGER, required): Adjustment amount (positive or negative, cannot be zero)
- `p_reason` (TEXT, required): Reason for adjustment (required for audit trail)
- `p_reference_document` (VARCHAR, optional): Reference to count sheet or adjustment document
- `p_created_by` (VARCHAR, required): Username of person recording the adjustment

**Returns**: TABLE
- `success` (BOOLEAN): true if successful, false if error
- `message` (TEXT): Success or error message
- `movement_id` (INTEGER): ID of created inventory movement (NULL on error)
- `new_stock_level` (INTEGER): New stock quantity after adjustment (NULL on error)

**Validations**:
- Adjustment quantity cannot be zero
- Created by user is required
- Reason is required (for audit trail)
- Product must exist and be active
- Location must exist and be active
- For negative adjustments: sufficient stock must be available
- ADJUSTMENT_POS or ADJUSTMENT_NEG movement type must exist

**Example - Positive Adjustment**:
```sql
SELECT * FROM adjust_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_adjustment_quantity := 10,
    p_reason := 'Physical count found 10 additional units',
    p_reference_document := 'COUNT-2024-001',
    p_created_by := 'jane.smith'
);

-- Returns:
-- success | message                           | movement_id | new_stock_level
-- --------|-----------------------------------|-------------|----------------
-- true    | Inventory adjusted successfully   | 5           | 35
```

**Example - Negative Adjustment**:
```sql
SELECT * FROM adjust_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_adjustment_quantity := -5,
    p_reason := 'Damaged units removed from inventory',
    p_reference_document := 'DAMAGE-2024-001',
    p_created_by := 'john.doe'
);

-- Returns:
-- success | message                           | movement_id | new_stock_level
-- --------|-----------------------------------|-------------|----------------
-- true    | Inventory adjusted successfully   | 6           | 30
```

**Error Handling**:
- Returns success=false if insufficient stock for negative adjustment
- Provides available vs adjustment quantities in error message
- Transaction is rolled back on error

---

## Reporting Views and Functions

The system provides comprehensive reporting capabilities through views and functions.

### Stock Level Views

#### v_current_stock_levels

Current stock levels with product and location details, including inventory valuation.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`, `location_name`, `location_type`
- `quantity_on_hand`, `quantity_reserved`, `quantity_available`
- `last_counted_at`, `last_movement_at`
- `cost_price`, `selling_price`
- `inventory_value_cost`, `inventory_value_selling`

**Filters**: Only active products and locations

**Example**:
```sql
SELECT * FROM v_current_stock_levels
WHERE product_name LIKE '%Widget%'
ORDER BY quantity_available DESC;
```

---

#### v_product_stock_summary

Aggregated stock levels by product across all locations.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `unit_of_measure`, `cost_price`, `selling_price`, `status`
- `total_quantity_on_hand`, `total_quantity_reserved`, `total_quantity_available`
- `locations_count`
- `total_inventory_value_cost`, `total_inventory_value_selling`

**Example**:
```sql
SELECT * FROM v_product_stock_summary
WHERE total_quantity_available > 0
ORDER BY total_inventory_value_cost DESC;
```

---

### Low Stock Alert Views

#### v_low_stock_alerts

Products below reorder point with supplier information and stock status.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`, `location_name`
- `quantity_available`, `reorder_point`, `reorder_quantity`, `maximum_stock`
- `units_below_reorder`
- `supplier_id`, `preferred_supplier_name`, `lead_time_days`, `minimum_order_qty`, `supplier_cost_price`
- `stock_status`: 'OUT_OF_STOCK', 'CRITICAL', 'LOW', 'NORMAL'

**Stock Status Logic**:
- `OUT_OF_STOCK`: quantity_available ≤ 0
- `CRITICAL`: quantity_available ≤ (reorder_point * 0.5)
- `LOW`: quantity_available ≤ reorder_point
- `NORMAL`: quantity_available > reorder_point

**Example**:
```sql
SELECT * FROM v_low_stock_alerts
WHERE stock_status IN ('OUT_OF_STOCK', 'CRITICAL')
ORDER BY stock_status, units_below_reorder DESC;
```

---

### Inventory Valuation Functions

#### calculate_inventory_value_avg()

Calculate inventory valuation using weighted average cost method.

**Function Signature**:
```sql
calculate_inventory_value_avg(
    p_product_id INTEGER DEFAULT NULL,
    p_location_id INTEGER DEFAULT NULL
)
```

**Parameters**:
- `p_product_id` (INTEGER, optional): Filter by specific product (NULL for all)
- `p_location_id` (INTEGER, optional): Filter by specific location (NULL for all)

**Returns**: TABLE
- `product_id` (INTEGER): Product ID
- `location_id` (INTEGER): Location ID
- `quantity_on_hand` (INTEGER): Current quantity
- `average_cost` (DECIMAL): Average cost per unit
- `total_value` (DECIMAL): Total inventory value

**Example**:
```sql
-- All products and locations
SELECT * FROM calculate_inventory_value_avg();

-- Specific product
SELECT * FROM calculate_inventory_value_avg(p_product_id := 1);

-- Specific location
SELECT * FROM calculate_inventory_value_avg(p_location_id := 1);

-- Specific product at specific location
SELECT * FROM calculate_inventory_value_avg(p_product_id := 1, p_location_id := 1);
```

---

### Inventory Aging Views

#### v_inventory_aging

Inventory aging analysis showing how long items have been in stock.

**Columns**:
- `product_id`, `sku`, `product_name`, `category_name`
- `location_id`, `location_code`, `location_name`
- `quantity_on_hand`, `quantity_available`
- `last_receipt_date`, `days_in_stock`
- `aging_category`: '0-30 days', '31-60 days', '61-90 days', '91-180 days', '181-365 days', 'Over 1 year'
- `inventory_value_cost`, `cost_price`, `selling_price`

**Example**:
```sql
SELECT 
    aging_category,
    COUNT(*) AS product_count,
    SUM(quantity_on_hand) AS total_units,
    SUM(inventory_value_cost) AS total_value
FROM v_inventory_aging
GROUP BY aging_category
ORDER BY 
    CASE aging_category
        WHEN '0-30 days' THEN 1
        WHEN '31-60 days' THEN 2
        WHEN '61-90 days' THEN 3
        WHEN '91-180 days' THEN 4
        WHEN '181-365 days' THEN 5
        ELSE 6
    END;
```

---

### Inventory Turnover Analysis

#### calculate_inventory_turnover()

Calculate inventory turnover ratio and days to sell for products.

**Function Signature**:
```sql
calculate_inventory_turnover(
    p_product_id INTEGER DEFAULT NULL,
    p_location_id INTEGER DEFAULT NULL,
    p_period_days INTEGER DEFAULT 365
)
```

**Parameters**:
- `p_product_id` (INTEGER, optional): Filter by specific product (NULL for all)
- `p_location_id` (INTEGER, optional): Filter by specific location (NULL for all)
- `p_period_days` (INTEGER, optional): Analysis period in days (default: 365)

**Returns**: TABLE
- `product_id` (INTEGER): Product ID
- `product_sku` (VARCHAR): Product SKU
- `product_name` (VARCHAR): Product name
- `location_id` (INTEGER): Location ID
- `location_code` (VARCHAR): Location code
- `total_quantity_sold` (INTEGER): Total units sold in period
- `average_inventory` (DECIMAL): Average inventory level
- `turnover_ratio` (DECIMAL): Turnover ratio (sales / average inventory)
- `days_to_sell` (DECIMAL): Average days to sell inventory

**Example**:
```sql
-- Turnover for last 365 days
SELECT * FROM calculate_inventory_turnover()
WHERE turnover_ratio > 0
ORDER BY turnover_ratio DESC;

-- Turnover for last 90 days
SELECT * FROM calculate_inventory_turnover(NULL, NULL, 90)
ORDER BY days_to_sell;

-- Turnover for specific product
SELECT * FROM calculate_inventory_turnover(p_product_id := 1);
```

---

#### v_inventory_turnover_summary

Pre-calculated inventory turnover analysis for all products over the last 365 days.

**Columns**: Same as `calculate_inventory_turnover()` function

**Example**:
```sql
SELECT * FROM v_inventory_turnover_summary
WHERE turnover_ratio < 2
ORDER BY turnover_ratio;
```

---

### Movement Analysis Views

#### v_recent_movements

Recent 1000 inventory movements with full details.

**Columns**:
- `movement_id`, `created_at`, `created_by`
- `sku`, `product_name`, `category_name`
- `location_code`, `location_name`
- `movement_type`, `affects_quantity`
- `quantity`, `unit_cost`, `total_cost`
- `reference_document`, `notes`

**Example**:
```sql
SELECT * FROM v_recent_movements
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### Supplier Performance Views

#### v_supplier_performance

Supplier performance metrics including delivery rates and quality ratings.

**Columns**:
- `supplier_id`, `supplier_code`, `supplier_name`
- `contact_person`, `email`, `payment_terms`
- `products_supplied`, `preferred_products_count`
- `avg_lead_time_days`, `avg_actual_delivery_days`
- `avg_on_time_delivery_rate`, `avg_quality_rating`
- `total_orders`, `total_delivered`, `overall_delivery_rate`
- `is_active`

**Example**:
```sql
SELECT * FROM v_supplier_performance
WHERE is_active = true
  AND avg_quality_rating >= 4.0
ORDER BY avg_quality_rating DESC, avg_on_time_delivery_rate DESC;
```

---


## Usage Examples

This section provides practical examples for common inventory management scenarios.

### Example 1: Setting Up a New Product

```sql
-- Step 1: Create or verify category exists
INSERT INTO categories (name, description)
VALUES ('Electronics', 'Electronic devices and components')
ON CONFLICT DO NOTHING
RETURNING category_id;

-- Step 2: Create the product
INSERT INTO products (
    sku, name, description, category_id,
    unit_of_measure, weight_kg, cost_price, selling_price, status
)
VALUES (
    'WIDGET-001',
    'Premium Widget',
    'High-quality widget with advanced features',
    1,  -- category_id from step 1
    'ea',
    0.5,
    25.50,
    49.99,
    'active'
)
RETURNING product_id;

-- Step 3: Set up reorder settings for main warehouse
INSERT INTO reorder_settings (
    product_id, location_id, reorder_point, reorder_quantity, maximum_stock
)
VALUES (
    1,  -- product_id from step 2
    1,  -- main warehouse location_id
    50,
    200,
    500
);

-- Step 4: Add preferred supplier
INSERT INTO product_suppliers (
    product_id, supplier_id, supplier_sku,
    lead_time_days, minimum_order_qty, cost_price, is_preferred
)
VALUES (
    1,  -- product_id
    1,  -- supplier_id
    'ACME-WIDGET-001',
    14,
    100,
    25.50,
    true
);
```

---

### Example 2: Receiving Inventory from Supplier

```sql
-- Receive 200 units of product at $25.50 each
SELECT * FROM receive_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_quantity := 200,
    p_unit_cost := 25.50,
    p_reference_document := 'PO-2024-001',
    p_notes := 'Received from Acme Supplies - Invoice #12345',
    p_created_by := 'receiving.clerk'
);

-- Verify the stock level
SELECT * FROM v_current_stock_levels
WHERE product_id = 1 AND location_id = 1;
```

---

### Example 3: Processing a Customer Order

```sql
-- Check available stock before shipping
SELECT 
    product_id, sku, product_name,
    quantity_available, location_name
FROM v_current_stock_levels
WHERE product_id = 1
ORDER BY quantity_available DESC;

-- Ship 25 units to customer
SELECT * FROM ship_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_quantity := 25,
    p_unit_cost := 25.50,
    p_reference_document := 'SO-2024-001',
    p_notes := 'Shipped to Customer ABC - Order #5678',
    p_created_by := 'shipping.clerk'
);

-- Verify updated stock level
SELECT * FROM v_current_stock_levels
WHERE product_id = 1 AND location_id = 1;
```

---

### Example 4: Transferring Inventory Between Locations

```sql
-- Transfer 50 units from main warehouse to retail store
SELECT * FROM transfer_inventory(
    p_product_id := 1,
    p_from_location_id := 1,  -- Main warehouse
    p_to_location_id := 2,     -- Retail store
    p_quantity := 50,
    p_unit_cost := 25.50,
    p_reference_document := 'TRF-2024-001',
    p_notes := 'Stock replenishment for retail location',
    p_created_by := 'warehouse.manager'
);

-- View stock at both locations
SELECT 
    product_name, location_name,
    quantity_on_hand, quantity_available
FROM v_current_stock_levels
WHERE product_id = 1
  AND location_id IN (1, 2);
```

---

### Example 5: Physical Inventory Count and Adjustment

```sql
-- Current system shows 175 units
SELECT quantity_on_hand FROM stock_levels
WHERE product_id = 1 AND location_id = 1;

-- Physical count found 180 units (5 more than system)
SELECT * FROM adjust_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_adjustment_quantity := 5,
    p_reason := 'Physical count adjustment - Count sheet #2024-Q1-001',
    p_reference_document := 'COUNT-2024-001',
    p_created_by := 'inventory.manager'
);

-- Verify adjustment
SELECT * FROM v_current_stock_levels
WHERE product_id = 1 AND location_id = 1;
```

---

### Example 6: Handling Damaged Inventory

```sql
-- Remove 3 damaged units from inventory
SELECT * FROM adjust_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_adjustment_quantity := -3,
    p_reason := 'Damaged units removed - water damage from roof leak',
    p_reference_document := 'DAMAGE-2024-001',
    p_created_by := 'warehouse.supervisor'
);

-- View the adjustment in movement history
SELECT * FROM v_recent_movements
WHERE product_id = 1
  AND movement_type LIKE '%ADJUSTMENT%'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Example 7: Monitoring Low Stock Alerts

```sql
-- View all products below reorder point
SELECT 
    sku, product_name, location_name,
    quantity_available, reorder_point,
    units_below_reorder, stock_status,
    preferred_supplier_name, lead_time_days
FROM v_low_stock_alerts
ORDER BY 
    CASE stock_status
        WHEN 'OUT_OF_STOCK' THEN 1
        WHEN 'CRITICAL' THEN 2
        WHEN 'LOW' THEN 3
    END,
    units_below_reorder DESC;

-- Generate purchase order recommendations
SELECT 
    sku, product_name,
    preferred_supplier_name,
    reorder_quantity AS recommended_order_qty,
    minimum_order_qty AS supplier_minimum,
    GREATEST(reorder_quantity, minimum_order_qty) AS actual_order_qty,
    supplier_cost_price,
    GREATEST(reorder_quantity, minimum_order_qty) * supplier_cost_price AS estimated_cost
FROM v_low_stock_alerts
WHERE stock_status IN ('OUT_OF_STOCK', 'CRITICAL')
  AND preferred_supplier_name IS NOT NULL;
```

---

### Example 8: Inventory Valuation Report

```sql
-- Total inventory value by category
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT p.product_id) AS product_count,
    SUM(sl.quantity_on_hand) AS total_units,
    SUM(sl.quantity_on_hand * p.cost_price) AS total_cost_value,
    SUM(sl.quantity_on_hand * p.selling_price) AS total_selling_value,
    SUM(sl.quantity_on_hand * (p.selling_price - p.cost_price)) AS potential_profit
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE sl.quantity_on_hand > 0
  AND p.status = 'active'
GROUP BY c.name
ORDER BY total_cost_value DESC;

-- Inventory value by location
SELECT 
    l.name AS location_name,
    l.location_type,
    COUNT(DISTINCT sl.product_id) AS product_count,
    SUM(sl.quantity_on_hand) AS total_units,
    SUM(sl.quantity_on_hand * p.cost_price) AS total_value
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
INNER JOIN locations l ON sl.location_id = l.location_id
WHERE sl.quantity_on_hand > 0
GROUP BY l.location_id, l.name, l.location_type
ORDER BY total_value DESC;
```

---

### Example 9: Inventory Aging Analysis

```sql
-- Aging summary by category
SELECT 
    aging_category,
    COUNT(*) AS item_count,
    SUM(quantity_on_hand) AS total_units,
    SUM(inventory_value_cost) AS total_value,
    ROUND(AVG(days_in_stock), 0) AS avg_days_in_stock
FROM v_inventory_aging
GROUP BY aging_category
ORDER BY 
    CASE aging_category
        WHEN '0-30 days' THEN 1
        WHEN '31-60 days' THEN 2
        WHEN '61-90 days' THEN 3
        WHEN '91-180 days' THEN 4
        WHEN '181-365 days' THEN 5
        ELSE 6
    END;

-- Identify slow-moving inventory (over 180 days)
SELECT 
    sku, product_name, location_name,
    quantity_on_hand, days_in_stock,
    inventory_value_cost,
    cost_price, selling_price
FROM v_inventory_aging
WHERE days_in_stock > 180
ORDER BY inventory_value_cost DESC;
```

---

### Example 10: Inventory Turnover Analysis

```sql
-- Products with low turnover (potential overstock)
SELECT 
    product_sku, product_name,
    total_quantity_sold,
    average_inventory,
    turnover_ratio,
    days_to_sell
FROM v_inventory_turnover_summary
WHERE turnover_ratio < 2
  AND average_inventory > 0
ORDER BY turnover_ratio;

-- Products with high turnover (potential understock)
SELECT 
    product_sku, product_name,
    total_quantity_sold,
    average_inventory,
    turnover_ratio,
    days_to_sell
FROM v_inventory_turnover_summary
WHERE turnover_ratio > 10
ORDER BY turnover_ratio DESC;

-- Turnover by category
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT t.product_id) AS product_count,
    SUM(t.total_quantity_sold) AS total_sold,
    ROUND(AVG(t.turnover_ratio), 2) AS avg_turnover_ratio,
    ROUND(AVG(t.days_to_sell), 0) AS avg_days_to_sell
FROM v_inventory_turnover_summary t
INNER JOIN products p ON t.product_id = p.product_id
LEFT JOIN categories c ON p.category_id = c.category_id
GROUP BY c.name
ORDER BY avg_turnover_ratio DESC;
```

---

### Example 11: Supplier Performance Analysis

```sql
-- Top performing suppliers
SELECT 
    supplier_name,
    products_supplied,
    avg_quality_rating,
    avg_on_time_delivery_rate * 100 AS on_time_pct,
    avg_lead_time_days,
    avg_actual_delivery_days,
    total_orders,
    overall_delivery_rate * 100 AS overall_delivery_pct
FROM v_supplier_performance
WHERE is_active = true
  AND total_orders > 0
ORDER BY avg_quality_rating DESC, avg_on_time_delivery_rate DESC
LIMIT 10;

-- Suppliers needing attention (poor performance)
SELECT 
    supplier_name,
    products_supplied,
    avg_quality_rating,
    avg_on_time_delivery_rate * 100 AS on_time_pct,
    avg_actual_delivery_days - avg_lead_time_days AS avg_delay_days,
    total_orders
FROM v_supplier_performance
WHERE is_active = true
  AND total_orders >= 5
  AND (avg_quality_rating < 3.5 OR avg_on_time_delivery_rate < 0.85)
ORDER BY avg_quality_rating, avg_on_time_delivery_rate;
```

---

### Example 12: Movement History and Audit Trail

```sql
-- View all movements for a specific product
SELECT 
    created_at,
    movement_type,
    location_name,
    quantity,
    CASE 
        WHEN affects_quantity = 1 THEN quantity
        ELSE -quantity
    END AS quantity_change,
    unit_cost,
    total_cost,
    reference_document,
    created_by,
    notes
FROM v_recent_movements
WHERE sku = 'WIDGET-001'
ORDER BY created_at DESC;

-- Daily movement summary
SELECT 
    DATE(created_at) AS movement_date,
    movement_type,
    COUNT(*) AS transaction_count,
    SUM(quantity) AS total_quantity,
    SUM(total_cost) AS total_value
FROM v_recent_movements
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), movement_type
ORDER BY movement_date DESC, movement_type;

-- Audit trail for specific user
SELECT 
    created_at,
    sku,
    product_name,
    movement_type,
    location_name,
    quantity,
    reference_document,
    notes
FROM v_recent_movements
WHERE created_by = 'john.doe'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### Example 13: Reserved Quantity Management

```sql
-- Reserve inventory for a sales order
UPDATE stock_levels
SET quantity_reserved = quantity_reserved + 25
WHERE product_id = 1 AND location_id = 1
  AND quantity_available >= 25;

-- View reserved vs available stock
SELECT 
    sku, product_name, location_name,
    quantity_on_hand,
    quantity_reserved,
    quantity_available
FROM v_current_stock_levels
WHERE quantity_reserved > 0
ORDER BY quantity_available;

-- Release reserved inventory (order cancelled)
UPDATE stock_levels
SET quantity_reserved = quantity_reserved - 25
WHERE product_id = 1 AND location_id = 1
  AND quantity_reserved >= 25;
```

---

### Example 14: Multi-Location Stock Query

```sql
-- Find all locations with available stock for a product
SELECT 
    l.code AS location_code,
    l.name AS location_name,
    l.location_type,
    sl.quantity_available,
    l.capacity,
    CASE 
        WHEN l.capacity IS NOT NULL 
        THEN ROUND((sl.quantity_on_hand::DECIMAL / l.capacity) * 100, 1)
        ELSE NULL
    END AS capacity_utilization_pct
FROM stock_levels sl
INNER JOIN locations l ON sl.location_id = l.location_id
WHERE sl.product_id = 1
  AND sl.quantity_available > 0
  AND l.is_active = true
ORDER BY sl.quantity_available DESC;

-- Total stock across all locations for multiple products
SELECT 
    p.sku,
    p.name AS product_name,
    SUM(sl.quantity_on_hand) AS total_on_hand,
    SUM(sl.quantity_reserved) AS total_reserved,
    SUM(sl.quantity_available) AS total_available,
    COUNT(DISTINCT sl.location_id) AS location_count
FROM products p
LEFT JOIN stock_levels sl ON p.product_id = sl.product_id
WHERE p.status = 'active'
GROUP BY p.product_id, p.sku, p.name
HAVING SUM(sl.quantity_available) > 0
ORDER BY total_available DESC;
```

---

## Best Practices Guide

### Data Management Best Practices

#### 1. Product Management

**DO:**
- Use meaningful, consistent SKU naming conventions
- Keep product descriptions detailed and accurate
- Regularly review and update product status (active/discontinued)
- Maintain accurate cost and selling prices
- Use categories to organize products logically

**DON'T:**
- Reuse SKUs for different products
- Leave critical fields (unit_of_measure, cost_price) empty
- Delete products with transaction history
- Change SKUs after products are in use

**Example SKU Convention**:
```
[CATEGORY]-[SUBCATEGORY]-[SEQUENCE]
ELEC-WIDGET-001
ELEC-GADGET-002
FURN-CHAIR-001
```

---

#### 2. Location Management

**DO:**
- Use hierarchical location structure (Warehouse → Zone → Aisle → Bin)
- Use clear, consistent location codes
- Set realistic capacity limits
- Deactivate locations instead of deleting them
- Document location types consistently

**DON'T:**
- Create flat location structures without hierarchy
- Use ambiguous location codes
- Delete locations with stock or history
- Mix location types inconsistently

**Example Location Hierarchy**:
```
WH01 (Warehouse)
├── WH01-Z01 (Zone)
│   ├── WH01-Z01-A01 (Aisle)
│   │   ├── WH01-Z01-A01-B01 (Bin)
│   │   └── WH01-Z01-A01-B02 (Bin)
│   └── WH01-Z01-A02 (Aisle)
└── WH01-Z02 (Zone)
```

---

#### 3. Inventory Movement Recording

**DO:**
- Always use stored procedures for inventory movements
- Provide meaningful reference documents
- Include detailed notes for adjustments
- Record the actual user performing the operation
- Use appropriate movement types

**DON'T:**
- Manually update stock_levels table
- Skip reference documents for traceability
- Use generic user names (e.g., "admin")
- Create movements without proper validation
- Bypass the stored procedures

**Movement Type Selection Guide**:
- **RECEIPT**: Receiving from supplier (PO reference)
- **SALE**: Shipping to customer (SO reference)
- **TRANSFER_OUT/IN**: Moving between locations (Transfer reference)
- **ADJUSTMENT_POS**: Physical count found more (Count sheet reference)
- **ADJUSTMENT_NEG**: Damage, loss, shrinkage (Incident reference)

---

#### 4. Reorder Point Management

**DO:**
- Set reorder points based on lead time and demand
- Review and adjust reorder settings quarterly
- Consider seasonal variations
- Set maximum stock levels to prevent overstock
- Monitor low stock alerts daily

**DON'T:**
- Set arbitrary reorder points without analysis
- Ignore low stock alerts
- Set reorder quantities below supplier minimums
- Forget to update settings when demand changes

**Reorder Point Calculation**:
```
Reorder Point = (Average Daily Usage × Lead Time Days) + Safety Stock

Example:
- Average daily usage: 10 units
- Lead time: 14 days
- Safety stock: 30 units (3 days)
- Reorder point: (10 × 14) + 30 = 170 units
```

---

#### 5. Supplier Management

**DO:**
- Maintain accurate supplier contact information
- Track supplier performance metrics
- Update lead times based on actual performance
- Designate preferred suppliers for each product
- Review supplier performance quarterly

**DON'T:**
- Rely on outdated supplier information
- Ignore poor supplier performance
- Set unrealistic lead time expectations
- Have only one supplier per critical product

**Supplier Performance Monitoring**:
```sql
-- Monthly supplier performance review
SELECT 
    supplier_name,
    products_supplied,
    avg_quality_rating,
    avg_on_time_delivery_rate * 100 AS on_time_pct,
    total_orders AS orders_this_period
FROM v_supplier_performance
WHERE is_active = true
  AND total_orders > 0
ORDER BY avg_quality_rating DESC;
```

---

### Performance Optimization Best Practices

#### 1. Query Optimization

**DO:**
- Use the provided views for common queries
- Filter on indexed columns (product_id, location_id, created_at)
- Use appropriate date ranges for historical queries
- Leverage the reporting functions for complex calculations

**DON'T:**
- Scan entire tables without filters
- Use SELECT * when you only need specific columns
- Perform complex calculations in application code
- Ignore query execution plans

**Example - Efficient Query**:
```sql
-- Good: Uses indexes and filters
SELECT * FROM v_current_stock_levels
WHERE product_id = 1
  AND quantity_available > 0;

-- Bad: Full table scan
SELECT * FROM inventory_movements
WHERE notes LIKE '%damaged%';

-- Better: Use indexed columns
SELECT * FROM inventory_movements
WHERE movement_type_id = (SELECT movement_type_id FROM movement_types WHERE code = 'ADJUSTMENT_NEG')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

#### 2. Transaction Management

**DO:**
- Use stored procedures for atomic operations
- Keep transactions short and focused
- Handle errors appropriately
- Use appropriate isolation levels

**DON'T:**
- Leave transactions open
- Perform long-running operations in transactions
- Ignore transaction errors
- Mix DDL and DML in transactions

---

#### 3. Index Maintenance

**DO:**
- Monitor index usage and performance
- Rebuild indexes periodically
- Analyze query patterns
- Add indexes for frequently filtered columns

**DON'T:**
- Create indexes on every column
- Ignore unused indexes
- Forget to update statistics

---

### Security and Audit Best Practices

#### 1. Access Control

**DO:**
- Use database roles for access control
- Grant minimum necessary permissions
- Use application-level user tracking
- Log all inventory movements with user information

**DON'T:**
- Share database credentials
- Grant direct table access to end users
- Use generic user accounts
- Skip user authentication

---

#### 2. Audit Trail

**DO:**
- Always record who performed each operation
- Include reference documents for traceability
- Preserve historical data
- Regularly review audit logs

**DON'T:**
- Delete historical movements
- Allow anonymous operations
- Skip reference documentation
- Ignore audit trail gaps

**Audit Query Example**:
```sql
-- Review all adjustments in the last month
SELECT 
    created_at,
    created_by,
    sku,
    product_name,
    location_name,
    quantity,
    reference_document,
    notes
FROM v_recent_movements
WHERE movement_type LIKE '%ADJUSTMENT%'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

### Reporting Best Practices

#### 1. Regular Reports

**Daily Reports**:
- Low stock alerts
- Recent movements summary
- Stock discrepancies

**Weekly Reports**:
- Inventory valuation by category
- Movement analysis by type
- Supplier performance

**Monthly Reports**:
- Inventory aging analysis
- Turnover analysis
- Slow-moving inventory
- Supplier performance review

**Quarterly Reports**:
- Reorder point effectiveness
- Capacity utilization
- Category performance
- Annual inventory trends

---

#### 2. Dashboard Queries

**Key Metrics Dashboard**:
```sql
-- Total inventory value
SELECT SUM(quantity_on_hand * cost_price) AS total_inventory_value
FROM stock_levels sl
INNER JOIN products p ON sl.product_id = p.product_id
WHERE p.status = 'active';

-- Products below reorder point
SELECT COUNT(*) AS low_stock_count
FROM v_low_stock_alerts;

-- Out of stock products
SELECT COUNT(*) AS out_of_stock_count
FROM v_low_stock_alerts
WHERE stock_status = 'OUT_OF_STOCK';

-- Average inventory turnover
SELECT ROUND(AVG(turnover_ratio), 2) AS avg_turnover
FROM v_inventory_turnover_summary
WHERE turnover_ratio > 0;

-- Movements today
SELECT COUNT(*) AS movements_today
FROM inventory_movements
WHERE created_at >= CURRENT_DATE;
```

---

### Maintenance Best Practices

#### 1. Regular Maintenance Tasks

**Daily**:
- Monitor low stock alerts
- Review and process pending movements
- Verify critical stock levels

**Weekly**:
- Review movement patterns
- Check for data anomalies
- Update supplier performance metrics

**Monthly**:
- Physical inventory counts (cycle counting)
- Review and adjust reorder points
- Archive old movement data (if needed)
- Analyze slow-moving inventory

**Quarterly**:
- Full inventory valuation
- Supplier performance review
- Reorder point optimization
- Database performance tuning

---

#### 2. Data Quality

**DO:**
- Perform regular cycle counts
- Reconcile system vs physical inventory
- Investigate and resolve discrepancies promptly
- Maintain data consistency

**DON'T:**
- Ignore inventory discrepancies
- Skip physical counts
- Allow data quality to degrade
- Make adjustments without investigation

**Cycle Count Process**:
```sql
-- 1. Select products for cycle count
SELECT 
    product_id, sku, product_name,
    location_code, location_name,
    quantity_on_hand AS system_quantity
FROM v_current_stock_levels
WHERE location_id = 1
ORDER BY RANDOM()
LIMIT 20;

-- 2. After physical count, adjust if needed
SELECT * FROM adjust_inventory(
    p_product_id := 1,
    p_location_id := 1,
    p_adjustment_quantity := 2,  -- Difference found
    p_reason := 'Cycle count adjustment - Count sheet #2024-001',
    p_reference_document := 'CYCLE-2024-001',
    p_created_by := 'inventory.auditor'
);
```

---

### Troubleshooting Common Issues

#### Issue 1: Negative Stock Levels

**Symptom**: Stock level shows negative quantity

**Cause**: Direct table updates bypassing constraints

**Solution**:
```sql
-- Identify negative stock
SELECT * FROM stock_levels
WHERE quantity_on_hand < 0 OR quantity_reserved < 0;

-- Investigate movement history
SELECT * FROM v_recent_movements
WHERE product_id = [affected_product_id]
ORDER BY created_at DESC;

-- Correct with adjustment
SELECT * FROM adjust_inventory(
    p_product_id := [product_id],
    p_location_id := [location_id],
    p_adjustment_quantity := [correction_amount],
    p_reason := 'Correction for negative stock - Investigation #XXX',
    p_reference_document := 'CORRECTION-2024-XXX',
    p_created_by := 'system.admin'
);
```

---

#### Issue 2: Stock Discrepancies

**Symptom**: System stock doesn't match physical count

**Cause**: Missing movements, data entry errors, theft/loss

**Solution**:
```sql
-- Review recent movements
SELECT * FROM v_recent_movements
WHERE product_id = [product_id]
  AND location_id = [location_id]
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Check for unreserved quantities
SELECT 
    quantity_on_hand,
    quantity_reserved,
    quantity_available
FROM stock_levels
WHERE product_id = [product_id]
  AND location_id = [location_id];

-- Adjust to match physical count
SELECT * FROM adjust_inventory(
    p_product_id := [product_id],
    p_location_id := [location_id],
    p_adjustment_quantity := [physical_count - system_count],
    p_reason := 'Physical count adjustment - Discrepancy investigation #XXX',
    p_reference_document := 'COUNT-2024-XXX',
    p_created_by := 'inventory.manager'
);
```

---

#### Issue 3: Performance Degradation

**Symptom**: Queries running slowly

**Cause**: Missing indexes, outdated statistics, large data volume

**Solution**:
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Update statistics
ANALYZE inventory_movements;
ANALYZE stock_levels;

-- Check for missing indexes
SELECT * FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 1000
  AND idx_scan < seq_scan;

-- Consider partitioning for large tables
-- (inventory_movements table by date range)
```

---

## Conclusion

This comprehensive documentation provides everything needed to effectively use and maintain the Inventory Management System. For additional support or questions, refer to the SQL files in the project repository or consult with your database administrator.

### Quick Reference

**Key Files**:
- `schema.sql`: Complete database schema
- `inventory_procedures.sql`: Stored procedures for inventory operations
- `inventory_reporting.sql`: Reporting views and functions
- `sample_data.sql`: Sample data for testing

**Key Views**:
- `v_current_stock_levels`: Real-time stock information
- `v_low_stock_alerts`: Products needing reorder
- `v_inventory_aging`: Aging analysis
- `v_inventory_turnover_summary`: Turnover metrics
- `v_supplier_performance`: Supplier metrics

**Key Procedures**:
- `receive_inventory()`: Record receipts
- `ship_inventory()`: Record shipments
- `transfer_inventory()`: Transfer between locations
- `adjust_inventory()`: Adjust for counts/damage

---

*Document Version: 1.0*  
*Last Updated: 2024*  
*Database Version: PostgreSQL 12+*

