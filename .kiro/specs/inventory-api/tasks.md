# Implementation Plan: Inventory API

## Overview

Build a Go REST API in `backend/` using a layered architecture (handlers → services → repositories → PostgreSQL). Tasks are ordered to establish the project skeleton first, then build each layer incrementally, wiring everything together at the end.

## Tasks

- [x] 1. Initialize Go module and project structure
  - Run `go mod init` in `backend/` and add all required dependencies to `go.mod`
  - Create the directory tree: `cmd/api/`, `internal/config/`, `internal/server/`, `internal/handlers/`, `internal/services/`, `internal/repository/`, `internal/models/`, `internal/middleware/`
  - Create stub `main.go` in `cmd/api/` that compiles and exits cleanly
  - _Requirements: 10.2_

- [x] 2. Implement configuration and domain models
  - [x] 2.1 Implement `internal/config/config.go`
    - Define `Config` struct with fields for `DatabaseURL`, `Port`, `JWTSecret`, `AllowedOrigin` loaded via `envconfig`
    - _Requirements: 10.2_

  - [x] 2.2 Implement `internal/models/domain.go`
    - Define all domain structs: `Product`, `Category`, `Location`, `Supplier`, `Movement`, `StockLevel`, `LowStockAlert`, `OperationResult`, `TransferResult`, and all reporting structs (`ProductStockSummary`, `AgingRecord`, `SupplierPerformance`, `ValuationRecord`)
    - _Requirements: 1.1, 3.9, 7.1_

  - [x] 2.3 Implement `internal/models/requests.go` and `internal/models/responses.go`
    - Define all request structs with `validate` tags: `CreateProductRequest`, `UpdateProductRequest`, `CreateCategoryRequest`, `CreateLocationRequest`, `CreateSupplierRequest`, `ReceiveRequest`, `ShipRequest`, `TransferRequest`, `AdjustRequest`
    - Define `Response`, `PaginatedResponse`, and filter structs (`ProductFilter`, `StockFilter`, `MovementFilter`)
    - _Requirements: 4.1–4.7, 6.1–6.5, 8.1–8.3_

- [x] 3. Implement middleware
  - [x] 3.1 Implement `internal/middleware/auth.go`
    - Parse and validate JWT from `Authorization: Bearer <token>` header using `golang-jwt/jwt/v5`
    - Store the parsed claims (including `sub`) in request context
    - Return `401 Unauthorized` for missing, invalid, or expired tokens
    - Skip auth for `/health`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Implement `internal/middleware/logger.go` and `internal/middleware/cors.go`
    - Request/response logging with zerolog (method, path, status, latency)
    - CORS middleware restricting to `AllowedOrigin` from config
    - _Requirements: 10.3_

  - [ ]* 3.3 Write property test for JWT middleware (Property 5)
    - **Property 5: Protected endpoints require valid JWT**
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. Implement handler helpers and server bootstrap
  - [x] 4.1 Implement `internal/handlers/helpers.go`
    - `respondJSON(w, status, data)` — sets `Content-Type: application/json` and writes envelope `{"data": ...}`
    - `respondError(w, status, msg)` — writes envelope `{"error": "..."}`
    - `decodeJSON(r, dst)` — decodes request body, returns `400` on failure
    - `parsePagination(r)` — extracts and clamps `page`/`page_size` query params (cap at 200)
    - _Requirements: 8.1, 8.2, 8.3, 6.1, 6.2_

  - [ ]* 4.2 Write property test for response envelope (Property 9)
    - **Property 9: All responses use the JSON envelope**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 4.3 Implement `internal/server/server.go`
    - Initialize `pgxpool.Pool` from config, wire Chi router with middleware chain (RequestID → Logger → Recoverer → CORS → Auth)
    - Mount `/health` without auth; mount `/api/v1` group with auth
    - Implement graceful shutdown on `SIGINT`/`SIGTERM`
    - _Requirements: 5.3, 9.1, 9.2, 9.3_

  - [x] 4.4 Wire `main.go` to load config and start server
    - _Requirements: 10.2_

- [x] 5. Implement Product repository, service, and handlers
  - [x] 5.1 Implement `internal/repository/product_repo.go`
    - `List` — paginated query with optional `status` and `category_id` filters, returns `([]Product, int, error)`
    - `GetByID`, `GetBySKU` — single-row queries returning `404` sentinel on `pgx.ErrNoRows`
    - `Create`, `Update` — INSERT/UPDATE returning the full row
    - `Delete` — UPDATE setting `status = 'discontinued'`
    - Handle `23505` unique violation → return typed `ErrDuplicateSKU`
    - _Requirements: 1.1–1.8_

  - [ ]* 5.2 Write property test for paginated product list (Property 7)
    - **Property 7: Paginated results never exceed page_size**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 5.3 Write property test for pagination total consistency (Property 8)
    - **Property 8: Pagination total is filter-consistent**
    - **Validates: Requirements 6.4, 6.5**

  - [x] 5.4 Implement `internal/services/product_service.go`
    - Implement `ProductService` interface delegating to `ProductRepository`
    - Map `ErrDuplicateSKU` → `409 Conflict` signal
    - _Requirements: 1.4, 1.7_

  - [x] 5.5 Implement `internal/handlers/products.go`
    - `List`, `Get`, `GetBySKU`, `Create`, `Update`, `Delete` handlers
    - Use `decodeJSON`, `validate`, `respondJSON`/`respondError`
    - Return `201` on create, `200` on update/delete, `404` on not found, `409` on duplicate SKU
    - _Requirements: 1.1–1.8, 4.1–4.7, 8.4, 8.5_

  - [ ]* 5.6 Write property test for CRUD round-trip consistency (Property 1)
    - **Property 1: CRUD round-trip consistency**
    - **Validates: Requirements 1.4, 1.5, 2.5**

- [x] 6. Checkpoint — ensure project compiles and product endpoints work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Category, Location, and Supplier repositories, services, and handlers
  - [x] 7.1 Implement `internal/repository/category_repo.go`
    - `List`, `GetByID`, `Create`, `Update`
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 7.2 Implement `internal/repository/location_repo.go`
    - `List` with optional `type` and `is_active` filters, `GetByID`, `Create`, `Update`
    - _Requirements: 2.2, 2.4, 2.5_

  - [x] 7.3 Implement `internal/repository/supplier_repo.go`
    - `List`, `GetByID`, `Create`, `Update`
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 7.4 Implement services for category, location, and supplier (thin delegation to repos)
    - _Requirements: 2.1–2.5_

  - [x] 7.5 Implement `internal/handlers/categories.go`, `locations.go`, `suppliers.go`
    - Standard CRUD handlers following the same pattern as products
    - Return `404` when resource not found, `201` on create
    - _Requirements: 2.1–2.5, 8.4, 8.5_

- [x] 8. Implement Inventory repository, service, and handlers
  - [x] 8.1 Implement `internal/repository/inventory_repo.go`
    - `CallReceive` — `SELECT * FROM receive_inventory($1,$2,$3,$4,$5,$6)`
    - `CallShip` — `SELECT * FROM ship_inventory($1,$2,$3,$4,$5,$6)`
    - `CallTransfer` — `SELECT * FROM transfer_inventory($1,$2,$3,$4,$5,$6,$7)`
    - `CallAdjust` — `SELECT * FROM adjust_inventory($1,$2,$3,$4,$5)`
    - `ListMovements` — paginated query with filters (product_id, location_id, movement_type, from_date, to_date)
    - `GetMovementByID`
    - _Requirements: 3.1–3.5, 3.9, 3.10_

  - [x] 8.2 Implement `internal/services/inventory_service.go`
    - Implement `InventoryService` interface
    - Enforce `from_location_id != to_location_id` before calling transfer proc → `400` if equal
    - Extract `created_by` from JWT context claims and pass to repo params
    - Map `success=false` result → return typed error with DB message
    - _Requirements: 3.5, 3.6, 5.4_

  - [ ]* 8.3 Write property test for receive increases stock (Property 2)
    - **Property 2: Receive increases stock level**
    - **Validates: Requirements 3.1, 3.8**

  - [ ]* 8.4 Write property test for transfer conserves total stock (Property 3)
    - **Property 3: Transfer conserves total stock**
    - **Validates: Requirements 3.3, 3.7**

  - [x] 8.5 Implement `internal/handlers/inventory.go`
    - `Receive`, `Ship`, `Transfer`, `Adjust` handlers — decode, validate, call service, respond
    - `ListMovements`, `GetMovement` handlers with pagination
    - Return `400` when service returns operation failure or validation error
    - _Requirements: 3.1–3.10, 4.3, 4.4, 4.5_

  - [ ]* 8.6 Write property test for invalid requests rejected (Property 4)
    - **Property 4: Invalid requests are rejected**
    - **Validates: Requirements 4.1–4.7**

- [x] 9. Checkpoint — ensure inventory operation endpoints work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Report repository, service, and handlers
  - [x] 10.1 Implement `internal/repository/report_repo.go`
    - `CurrentStock` — query `v_current_stock_levels` with optional filters and pagination
    - `LowStockAlerts` — query `v_low_stock_alerts`
    - `ProductSummary` — query `v_product_stock_summary`
    - `InventoryAging` — query `v_inventory_aging`
    - `SupplierPerformance` — query `v_supplier_performance`
    - `RecentMovements` — query `v_recent_movements`
    - `ValuationAvg` — call valuation DB function with optional `product_id` and `location_id` params
    - `Turnover` — call `calculate_inventory_turnover()`
    - _Requirements: 7.1–7.9_

  - [ ]* 10.2 Write property test for valuation filter passthrough (Property 10)
    - **Property 10: Valuation filters are passed through to the DB**
    - **Validates: Requirements 7.5, 7.9**

  - [x] 10.3 Implement `internal/services/report_service.go`
    - Implement `ReportService` interface delegating to `ReportRepository`
    - _Requirements: 7.1–7.9_

  - [x] 10.4 Implement `internal/handlers/reports.go`
    - `CurrentStock`, `LowStockAlerts`, `ProductSummary`, `InventoryAging`, `Valuation`, `Turnover`, `SupplierPerformance`, `RecentMovements` handlers
    - Parse optional filter query params and pass to service
    - _Requirements: 7.1–7.9_

- [x] 11. Implement health check endpoint
  - Add `GET /health` handler that calls `db.Ping(ctx)` and returns `200 OK` or `503 Service Unavailable`
  - Register route outside the auth middleware group
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 12. Wire all routes in server and validate security
  - [x] 12.1 Register all handler groups in `server.go`
    - Mount products, categories, locations, suppliers, inventory, reports, and health routes
    - Confirm auth middleware is applied to all routes except `/health`
    - _Requirements: 5.1–5.3_

  - [ ]* 12.2 Write property test for created_by from JWT (Property 6)
    - **Property 6: created_by is always the JWT subject**
    - **Validates: Requirements 5.4_

  - [x] 12.3 Verify all queries use parameterized `$n` arguments (no string interpolation in SQL)
    - _Requirements: 10.1_

  - [x] 12.4 Verify error responses never expose DB connection strings, stack traces, or raw DB errors
    - _Requirements: 8.6, 8.7, 10.4_

- [x] 13. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests (Properties 1–10) map directly to the correctness properties in `design.md`
- All SQL must use positional `$n` parameters — no string interpolation
- `created_by` is always sourced from JWT context, never from the request body
- The `DELETE /products/{id}` endpoint is a soft delete (sets `status = 'discontinued'`)
