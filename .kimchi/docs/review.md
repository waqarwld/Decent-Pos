# Review Findings

## Verdict
NEEDS_FIXES

## Build & Tests
- **Build**: PASS — Production build succeeded without errors or warnings. All lazy-loaded chunks for the 13 new components were generated correctly.
- **Tests**: PASS — All 71 tests passed across 8 test files (unit + property-based). No regressions introduced.

---

## Issues

### 1. File: `src/app/core/models/reports.ts`, Missing field in `AgingRecord` interface
The `AgingReportComponent` template displays `record.inventory_value` with the `currency` pipe:
```html
<td class="px-4 py-3 text-right text-gray-700">{{ record.quantity_on_hand | number }}</td>
```
However, the `AgingRecord` interface does not define an `inventory_value` field:
```typescript
export interface AgingRecord {
  product_id: number;
  sku: string;
  product_name: string;
  location_code: string;
  quantity_on_hand: number;
  days_in_stock: number;
  aging_bucket: string;
  inventory_value: number; // ← MISSING from interface
}
```
This will compile (TypeScript does not enforce template binding against interface fields at build time) but will render blank values at runtime.

**Suggested fix**: Add `inventory_value: number;` to the `AgingRecord` interface in `reports.ts`.

---

### 2. File: `src/app/features/admin/reports/reports-dashboard/reports-dashboard.component.ts`, `loadSummary()` — Incorrect low-stock threshold and over-aggressive pagination
```typescript
this.reportService.getSummary(1, 1).subscribe({
  next: (response) => {
    const data = response.data as unknown as ProductStockSummary[];
    // ...
    lowStock = data.filter(item => (item.total_quantity_available || 0) < 10).length;
    //                                                               ^^^^^ hardcoded threshold of 10
```
Two problems:

a. **Hardcoded threshold**: The low-stock detection uses a literal `10` instead of each product's configured reorder point. Per the API design, `LowStockAlert` has a `reorder_point` field — the dashboard should either call `getAlerts()` to get accurate data, or use the per-product `reorder_point`. Using a hardcoded constant is incorrect.

b. **Over-aggressive pagination**: `getSummary(1, 1)` requests page size 1. Even if the backend returns all summary records in a single paginated response, requesting only the first item means `totalProducts` will equal `response.total`, which is the total number of *location-level rows*, not the number of distinct products. The `totalProducts` card would show the number of location rows, not unique products as intended.

**Suggested fix**: Either (a) call `getSummary(1, 1000)` (or a page size that covers all data) and use `data.length` for total products, or (b) call `getSummary()` without pagination parameters if the backend supports that. For low-stock count, call `getAlerts()` and use `data.length` directly — this is both simpler and accurate.

---

### 3. File: `src/app/features/admin/inventory/transfer-form/transfer-form.component.ts`, Unused import
```typescript
import { Location } from '../../../../core/models/inventory';
```
`Location` is imported but never referenced in the component class. The form fields reference only primitive IDs (strings) and the template uses form controls directly. The same unused import appears in `receive-form.component.ts`, `ship-form.component.ts`, and `adjust-form.component.ts`.

**Suggested fix**: Remove the unused `Location` import from all four affected inventory form components.

---

### 4. File: `src/app/features/admin/inventory/adjust-form/adjust-form.component.ts`, Missing `Validators.min(1)` on quantity delta
The `quantity_delta` field is used for both positive (add stock) and negative (remove stock) adjustments, so `Validators.min(1)` is correctly omitted. However, the form group currently only requires `Validators.required`:
```typescript
quantity_delta: [null, [Validators.required]],
```
This means `0` is a valid submitted value, which is semantically meaningless for an adjustment. The backend would likely reject it, but the form should prevent it client-side.

**Suggested fix**: Replace `Validators.required` with a custom validator, or use `Validators.min(1)` combined with a note that negative deltas are also valid. Consider using two separate fields (adjustment direction and absolute quantity) to make intent clearer.

---

## Notes

- **Correct endpoint mapping**: All 7 report service methods call the correct API endpoints as specified in requirements 8.1–8.8 and the design document.
- **Routing**: All 13 routes (5 inventory + 8 report) are correctly registered in `app.routes.ts` and match the design document's routing table.
- **Lazy loading**: All new components are lazy-loaded via `loadComponent`, consistent with the existing architecture.
- **Standalone components**: All new components use the standalone component pattern (Angular 17+), consistent with existing components.
- **Reactive forms**: All inventory movement forms correctly use `ReactiveFormsModule` with proper field-level validation matching requirement 7.6.
- **Dockerfile/nginx.conf**: Both are correct and match the multi-stage build design, with the `__API_BASE_URL__` placeholder correctly injected at build time.
- **`StockLevel` trackBy**: `stock-report.component.ts` uses `track item.product_id + '-' + item.location_id`, which is correct since a product can appear at multiple locations.
- **Error handling**: All components handle API errors gracefully and display user-friendly messages without exposing raw error objects.
- **No tests for new components**: The 71 existing tests cover only previously-built components. There are no unit or property-based tests for the 5 inventory components or 8 report components. This is not blocking but is a gap worth noting.