# Requirements Document

## Introduction

This document defines the requirements for the Inventory API — a RESTful HTTP service written in Go that exposes the existing PostgreSQL inventory management database to frontend clients and external integrations. The API provides full CRUD access to core domain entities (products, categories, locations, suppliers), wraps existing stored procedures for inventory mutations (receive, ship, transfer, adjust), and surfaces reporting views. It is structured with a layered architecture (handlers → services → repositories → PostgreSQL), uses JWT authentication, and returns consistent JSON responses.

## Glossary

- **API**: The Go HTTP service described in this document, running under `/api/v1`
- **Router**: The Chi HTTP router that dispatches requests to handlers
- **Auth_Middleware**: The JWT validation middleware applied to all routes except `/health`
- **Handler**: An HTTP handler function responsible for decoding requests and encoding responses
- **ProductService**: The service layer component managing product business logic
- **InventoryService**: The service layer component managing inventory mutation operations
- **ReportService**: The service layer component managing reporting queries
- **ProductRepository**: The repository layer component executing product SQL queries
- **InventoryRepository**: The repository layer component calling inventory stored procedures
- **ReportRepository**: The repository layer component querying reporting views and functions
- **Validator**: The request validation component using `go-playground/validator`
- **DB**: The PostgreSQL database instance containing the inventory schema
- **JWT**: JSON Web Token used for stateless authentication
- **SKU**: Stock Keeping Unit — a unique alphanumeric identifier for a product
- **Movement**: A record of a stock change event (receipt, shipment, transfer, adjustment)
- **OperationResult**: The structured result returned by inventory stored procedures
- **PaginatedResponse**: The response envelope for list endpoints containing data, total, page, page_size, and total_pages

## Requirements

### Requirement 1: Product CRUD

**User Story:** As an inventory manager, I want to create, read, update, and delete products, so that I can maintain an accurate product catalog.

#### Acceptance Criteria

1. THE API SHALL expose `GET /api/v1/products` returning a paginated list of products filterable by status and category_id
2. THE API SHALL expose `GET /api/v1/products/{id}` returning a single product by its integer ID
3. THE API SHALL expose `GET /api/v1/products/sku/{sku}` returning a single product by its SKU
4. WHEN a valid `CreateProductRequest` is submitted to `POST /api/v1/products`, THE API SHALL create the product and return `201 Created` with the created product in the response body
5. WHEN a valid `UpdateProductRequest` is submitted to `PUT /api/v1/products/{id}`, THE API SHALL update the product and return `200 OK` with the updated product
6. WHEN `DELETE /api/v1/products/{id}` is called, THE API SHALL set the product status to `discontinued` and return `200 OK` (soft delete)
7. WHEN a `CreateProductRequest` contains a SKU that already exists in the DB, THE API SHALL return `409 Conflict` with `{"error": "SKU already exists"}`
8. THE ProductRepository SHALL enforce that all returned products satisfy any applied filter predicates

---

### Requirement 2: Category, Location, and Supplier CRUD

**User Story:** As an inventory manager, I want to manage categories, locations, and suppliers, so that I can organize products and track supply chain relationships.

#### Acceptance Criteria

1. THE API SHALL expose `GET`, `POST`, and `PUT` endpoints for categories under `/api/v1/categories`
2. THE API SHALL expose `GET`, `POST`, and `PUT` endpoints for locations under `/api/v1/locations`, with list filtering by type and active status
3. THE API SHALL expose `GET`, `POST`, and `PUT` endpoints for suppliers under `/api/v1/suppliers`
4. WHEN a resource is requested by ID and no matching record exists in the DB, THE API SHALL return `404 Not Found`
5. WHEN a valid create request is submitted for any entity, THE API SHALL return `201 Created` with the created entity in the response body

---

### Requirement 3: Inventory Operations

**User Story:** As a warehouse operator, I want to receive, ship, transfer, and adjust inventory, so that stock levels accurately reflect physical inventory.

#### Acceptance Criteria

1. WHEN a valid `ReceiveRequest` is submitted to `POST /api/v1/inventory/receive`, THE InventoryService SHALL call the `receive_inventory` stored procedure and return `200 OK` with the `OperationResult`
2. WHEN a valid `ShipRequest` is submitted to `POST /api/v1/inventory/ship`, THE InventoryService SHALL call the `ship_inventory` stored procedure and return `200 OK` with the `OperationResult`
3. WHEN a valid `TransferRequest` is submitted to `POST /api/v1/inventory/transfer`, THE InventoryService SHALL call the `transfer_inventory` stored procedure and return `200 OK` with the `TransferResult`
4. WHEN a valid `AdjustRequest` is submitted to `POST /api/v1/inventory/adjust`, THE InventoryService SHALL call the `adjust_inventory` stored procedure and return `200 OK` with the `OperationResult`
5. WHEN any inventory stored procedure returns `success=false`, THE API SHALL return `400 Bad Request` with the error message from the DB
6. WHEN a `TransferRequest` has `from_location_id` equal to `to_location_id`, THE InventoryService SHALL return `400 Bad Request` without calling the stored procedure
7. FOR ALL valid `TransferRequest` executions, the total stock quantity for the product across all locations SHALL remain unchanged after the transfer completes
8. WHEN a receive operation succeeds, the `new_stock_level` in the `OperationResult` SHALL be greater than or equal to the quantity received
9. THE API SHALL expose `GET /api/v1/inventory/movements` returning a paginated, filterable list of movement records
10. THE API SHALL expose `GET /api/v1/inventory/movements/{id}` returning a single movement record by ID

---

### Requirement 4: Request Validation

**User Story:** As an API consumer, I want clear validation errors, so that I can correct malformed requests without guessing what went wrong.

#### Acceptance Criteria

1. WHEN a request body cannot be decoded as valid JSON, THE Validator SHALL return `400 Bad Request` with an error message
2. WHEN a required field is missing or violates a constraint, THE Validator SHALL return `400 Bad Request` with field-level error details
3. WHEN `quantity` in a `ReceiveRequest`, `ShipRequest`, or `TransferRequest` is less than or equal to zero, THE Validator SHALL reject the request with `400 Bad Request`
4. WHEN `adjustment_quantity` in an `AdjustRequest` is zero, THE Validator SHALL reject the request with `400 Bad Request`
5. WHEN `unit_cost` in any inventory request is negative, THE Validator SHALL reject the request with `400 Bad Request`
6. WHEN `status` in a product request is not one of `active`, `discontinued`, or `pending`, THE Validator SHALL reject the request with `400 Bad Request`
7. WHEN `sku` in a `CreateProductRequest` is empty or exceeds 50 characters, THE Validator SHALL reject the request with `400 Bad Request`

---

### Requirement 5: Authentication and Authorization

**User Story:** As a system administrator, I want all API endpoints protected by JWT authentication, so that only authorized clients can access or modify inventory data.

#### Acceptance Criteria

1. WHEN a request to any protected endpoint is received without a JWT token, THE Auth_Middleware SHALL return `401 Unauthorized`
2. WHEN a request to any protected endpoint is received with an invalid or expired JWT token, THE Auth_Middleware SHALL return `401 Unauthorized`
3. THE `/health` endpoint SHALL be accessible without a JWT token
4. WHEN an authenticated inventory operation creates a movement record, THE InventoryService SHALL populate the `created_by` field from the JWT subject claim, not from the request body

---

### Requirement 6: Pagination

**User Story:** As an API consumer, I want paginated list responses, so that I can efficiently retrieve large datasets without overloading the client or server.

#### Acceptance Criteria

1. THE API SHALL accept `page` (default 1) and `page_size` (default 50) query parameters on all list endpoints
2. WHEN `page_size` exceeds 200, THE API SHALL cap the effective page size at 200
3. FOR ALL paginated responses, the number of items in the `data` array SHALL be less than or equal to the effective `page_size`
4. THE `total` field in a `PaginatedResponse` SHALL equal the count of all rows matching the applied filters, regardless of the current page
5. THE `total_pages` field SHALL equal `ceil(total / page_size)`

---

### Requirement 7: Reporting Endpoints

**User Story:** As an inventory analyst, I want reporting endpoints that surface aggregated stock data, so that I can monitor inventory health and make informed decisions.

#### Acceptance Criteria

1. THE API SHALL expose `GET /api/v1/reports/stock` querying the `v_current_stock_levels` view
2. THE API SHALL expose `GET /api/v1/reports/stock/summary` querying the `v_product_stock_summary` view
3. THE API SHALL expose `GET /api/v1/reports/stock/alerts` querying the `v_low_stock_alerts` view
4. THE API SHALL expose `GET /api/v1/reports/stock/aging` querying the `v_inventory_aging` view
5. THE API SHALL expose `GET /api/v1/reports/valuation` querying the valuation DB function, accepting optional `product_id` and `location_id` query parameters
6. THE API SHALL expose `GET /api/v1/reports/turnover` querying the `calculate_inventory_turnover()` DB function
7. THE API SHALL expose `GET /api/v1/reports/suppliers/performance` querying the `v_supplier_performance` view
8. THE API SHALL expose `GET /api/v1/reports/movements/recent` querying the `v_recent_movements` view
9. WHEN `product_id` or `location_id` filters are provided to the valuation endpoint, THE ReportRepository SHALL pass those filters to the DB function to restrict results

---

### Requirement 8: Response Format and Error Handling

**User Story:** As an API consumer, I want consistent response envelopes and meaningful HTTP status codes, so that I can reliably parse responses and handle errors programmatically.

#### Acceptance Criteria

1. THE API SHALL wrap all successful responses in a JSON envelope with a `data` field
2. THE API SHALL wrap all error responses in a JSON envelope with an `error` field containing a human-readable message
3. ALL responses from the API SHALL include the `Content-Type: application/json` header
4. WHEN a resource is successfully created, THE API SHALL return HTTP status `201 Created`
5. WHEN a read or mutation operation succeeds, THE API SHALL return HTTP status `200 OK`
6. WHEN a DB connection cannot be acquired, THE API SHALL return `503 Service Unavailable` without exposing connection string details
7. WHEN an unexpected internal error occurs, THE API SHALL return `500 Internal Server Error` without exposing internal stack traces or DB error details

---

### Requirement 9: Health Check

**User Story:** As a platform operator, I want a health check endpoint, so that load balancers and monitoring systems can verify the API is operational.

#### Acceptance Criteria

1. THE API SHALL expose `GET /health` that performs a DB ping and returns `200 OK` when the database is reachable
2. WHEN the DB is unreachable, THE `/health` endpoint SHALL return a non-2xx status code indicating degraded health
3. THE `/health` endpoint SHALL be excluded from JWT authentication middleware

---

### Requirement 10: Security

**User Story:** As a security engineer, I want the API to follow secure coding practices, so that it is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE API SHALL use parameterized queries (`$n` positional arguments) for all database interactions to prevent SQL injection
2. THE API SHALL load database credentials and the JWT secret exclusively from environment variables
3. THE API SHALL configure CORS to allow only the known frontend origin
4. WHEN an error response is returned, THE API SHALL never include database connection strings, internal stack traces, or raw DB error messages in the response body
