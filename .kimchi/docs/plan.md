# Implementation Plan: Remaining POS Frontend Work

## Context
This is an Angular 17+ POS frontend for an inventory management system. It connects to a Go REST API. The build currently compiles, but many admin components are stubs and the report service is missing.

## Missing Pieces

### Chunk 1: Report Service + Models
Create `src/app/core/services/report.service.ts` and add report interfaces to `src/app/core/models/`.

**ReportService methods:**
- `getSummary()` → GET `/api/v1/reports/stock/summary` → `ProductStockSummary[]` (paginated)
- `getStock(productId?, locationId?, page?, pageSize?)` → GET `/api/v1/reports/stock` → `StockLevel[]` (paginated)
- `getAlerts()` → GET `/api/v1/reports/stock/alerts` → `LowStockAlert[]`
- `getValuation(method?, productId?, locationId?)` → GET `/api/v1/reports/valuation` → `ValuationRecord[]`
- `getTurnover(startDate?, endDate?, productId?, locationId?)` → GET `/api/v1/reports/turnover` → `TurnoverItem[]`
- `getSupplierPerformance()` → GET `/api/v1/reports/suppliers/performance` → `SupplierPerformance[]`
- `getRecentMovements(page?, pageSize?)` → GET `/api/v1/reports/movements/recent` → `InventoryMovement[]` (paginated)
- `getAging()` → GET `/api/v1/reports/stock/aging` → `AgingRecord[]`

**Models to add** (in a new `reports.ts` or extend existing):
```typescript
interface StockSummary { total_products: number; total_value: number; low_stock_count: number; }
interface StockLevel { product_id: number; product_name: string; sku: string; location_name: string; quantity_available: number; quantity_on_hand: number; quantity_reserved: number; location_code: string; }
interface StockAlert { product_id: number; product_name: string; sku: string; location_code: string; quantity_available: number; reorder_point: number; units_below_reorder: number; stock_status: string; }
interface ValuationRecord { product_id: number; location_id: number; quantity_on_hand: number; value?: number; average_unit_cost?: number; }
interface TurnoverItem { product_id: number; product_name: string; movement_count: number; }
interface SupplierPerformance { supplier_id: number; supplier_name: string; products_supplied: number; avg_delivery_days?: number; on_time_rate?: number; avg_quality?: number; }
interface AgingRecord { product_id: number; sku: string; product_name: string; location_code: string; quantity_on_hand: number; days_in_stock: number; aging_bucket: string; }
```

**Acceptance criteria:**
- Service compiles and is injectable
- All endpoints use `catchError` for safe error handling
- Paginated endpoints return `{ data, total, page, page_size }`

### Chunk 2: Inventory Movement Components
Implement the stub components in `src/app/features/admin/inventory/`.

**InventoryListComponent**: Table showing recent movements from `InventoryService.getMovements()`, with links to receive/ship/transfer/adjust forms.

**ReceiveFormComponent**: Reactive form with `product_id`, `location_id`, `quantity`, `supplier_id` (all required). POST to `InventoryService.receive()`. Display success/error.

**ShipFormComponent**: Reactive form with `product_id`, `location_id`, `quantity` (all required). POST to `InventoryService.ship()`.

**TransferFormComponent**: Reactive form with `product_id`, `source_location_id`, `destination_location_id`, `quantity` (all required). POST to `InventoryService.transfer()`.

**AdjustFormComponent**: Reactive form with `product_id`, `location_id`, `quantity_delta`, `reason` (all required). POST to `InventoryService.adjust()`.

Common patterns:
- Use `FormBuilder` + `Validators.required`
- Disable submit when form invalid
- Show loading spinner during submit
- Show success banner then navigate back to `/admin/inventory`
- Show error banner on API failure
- Follow Tailwind styling used in existing forms (product-form, category-form)

**Acceptance criteria:**
- All 5 components compile
- Forms validate required fields
- Invalid forms do not dispatch HTTP requests
- Valid forms dispatch correct endpoints

### Chunk 3: Report Components
Implement all stub report components.

**ReportsDashboardComponent** (`/admin/reports`):
- Call `ReportService.getSummary()` on init
- Show summary cards: total products, total value, low stock count
- Provide navigation links to all sub-reports

**StockReportComponent** (`/admin/reports/stock`):
- Call `ReportService.getStock()` on init
- Display paginated table of stock levels

**AlertsReportComponent** (`/admin/reports/alerts`):
- Call `ReportService.getAlerts()` on init
- Display table; highlight low-stock rows in red/yellow

**ValuationReportComponent** (`/admin/reports/valuation`):
- Call `ReportService.getValuation()` on init
- Display valuation records in table

**TurnoverReportComponent** (`/admin/reports/turnover`):
- Call `ReportService.getTurnover()` on init
- Display turnover items in table

**SupplierPerformanceComponent** (`/admin/reports/suppliers`):
- Call `ReportService.getSupplierPerformance()` on init
- Display supplier metrics in table

**RecentMovementsComponent** (`/admin/reports/movements`):
- Call `ReportService.getRecentMovements()` on init
- Display recent movements in table (time-ordered)

**AgingReportComponent** (`/admin/reports/aging`):
- Call `ReportService.getAging()` on init
- Display aging records in table

**Acceptance criteria:**
- All 8 components compile
- Each triggers exactly one GET to the correct endpoint on init
- Loading and error states handled
- Consistent Tailwind table styling

### Chunk 4: Docker + Nginx Configuration
Create `frontend/Dockerfile` and `frontend/nginx.conf`.

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
ARG API_BASE_URL=http://localhost:8080
COPY package*.json ./
RUN npm ci
COPY . .
RUN sed -i "s|__API_BASE_URL__|${API_BASE_URL}|g" src/environments/environment.prod.ts
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/pos-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**nginx.conf**:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://api:8080;
  }
}
```

**Acceptance criteria:**
- `docker build` succeeds
- SPA routing works (try_files)
- `/api/` proxies to backend

## Dependencies
- Chunk 1 (Report Service) must be done before Chunk 3 (Report Components)
- Chunk 2 (Inventory) is independent of Chunk 1
- Chunk 4 (Docker) is independent of everything else

## Parallelization
- Run Chunk 1 + Chunk 2 + Chunk 4 in parallel
- Run Chunk 3 after Chunk 1 completes
