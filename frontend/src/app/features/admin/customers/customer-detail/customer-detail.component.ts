import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { SaleService } from '../../../../core/services/sale.service';
import { Customer, PurchaseHistory, SaleItem } from '../../../../core/models/customer';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin/customers" class="text-gray-500 hover:text-gray-700 transition" aria-label="Back to customers">
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">Customer Purchase History</h1>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
          {{ error() }}
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading history…</span>
        </div>
      } @else if (purchases()) {
        <!-- Customer summary -->
        <div class="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div>
            <p class="text-lg font-bold text-gray-800">{{ purchases()!.customer_name }}</p>
            <p class="text-sm text-gray-500">Customer #{{ purchases()!.customer_id }}</p>
          </div>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            [class.bg-purple-100]="customerType() === 'wholesale'"
            [class.text-purple-700]="customerType() === 'wholesale'"
            [class.bg-green-100]="customerType() === 'retail'"
            [class.text-green-700]="customerType() === 'retail'"
          >
            {{ customerType() }}
          </span>
          <span class="ml-auto text-sm text-gray-500">{{ purchases()!.sales.length }} sale(s)</span>
        </div>

        @if (purchases()!.sales.length === 0) {
          <div class="px-4 py-8 text-center text-gray-400 bg-white rounded-lg border border-gray-200">
            No purchases yet for this customer.
          </div>
        }

        <!-- Sales -->
        @for (sale of purchases()!.sales; track sale.id) {
          <div class="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <span class="font-semibold text-gray-800">{{ sale.sale_number }}</span>
              <span class="text-xs text-gray-500">{{ sale.created_at | date: 'medium' }}</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                [class.bg-red-100]="sale.status === 'refunded'"
                [class.text-red-700]="sale.status === 'refunded'"
                [class.bg-yellow-100]="sale.status === 'partially_refunded'"
                [class.text-yellow-700]="sale.status === 'partially_refunded'"
                [class.bg-green-100]="sale.status === 'completed'"
                [class.text-green-700]="sale.status === 'completed'"
              >
                {{ sale.status.replace('_', ' ') }}
              </span>
              <span class="ml-auto font-bold text-gray-900">{{ sale.total | currency }}</span>
            </div>

            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Item</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Unit Price</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Line Total</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Returned</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                @for (item of sale.items ?? []; track item.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-800">{{ item.product_name || 'Product #' + item.product_id }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-right text-gray-600">{{ item.unit_price | currency }}</td>
                    <td class="px-4 py-3 text-right text-gray-800">{{ item.line_total | currency }}</td>
                    <td class="px-4 py-3 text-right text-gray-500">{{ item.returned_qty }}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      @if (item.quantity - item.returned_qty > 0) {
                        <button
                          type="button"
                          (click)="startReturn(sale.id, item)"
                          class="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
                        >
                          Return
                        </button>
                      } @else {
                        <span class="text-xs text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- Return modal -->
      @if (returnTarget()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-1">Return Item</h2>
            <p class="text-sm text-gray-500 mb-4">{{ returnTarget()!.item.product_name }}</p>

            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              [ngModel]="returnQty()"
              (ngModelChange)="returnQty.set($event)"
              min="1"
              [max]="returnRemaining"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            <p class="text-xs text-gray-400 -mt-3 mb-4">Max {{ returnRemaining }} — refund {{ returnRemaining * returnUnitPrice | currency }}</p>

            <label class="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input
              type="text"
              [ngModel]="returnReason()"
              (ngModelChange)="returnReason.set($event)"
              placeholder="Reason for return"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />

            @if (returnError()) {
              <div class="mb-4 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
                {{ returnError() }}
              </div>
            }

            <div class="flex gap-3">
              <button
                type="button"
                (click)="cancelReturn()"
                class="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmReturn()"
                [disabled]="submittingReturn() || returnQty() < 1 || returnQty() > returnRemaining"
                class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300 transition"
              >
                {{ submittingReturn() ? 'Processing…' : 'Confirm Return' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CustomerDetailComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly saleService = inject(SaleService);
  private readonly route = inject(ActivatedRoute);

  private customerId: number | null = null;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly purchases = signal<PurchaseHistory | null>(null);
  readonly customerType = signal<string>('retail');

  readonly returnTarget = signal<{ saleId: number; item: SaleItem } | null>(null);
  readonly returnQty = signal(1);
  readonly returnReason = signal('');
  readonly returnError = signal<string | null>(null);
  readonly submittingReturn = signal(false);

  get returnRemaining(): number {
    const target = this.returnTarget();
    return target ? target.item.quantity - target.item.returned_qty : 0;
  }

  get returnUnitPrice(): number {
    return this.returnTarget()?.item.unit_price ?? 0;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.customerId = id;
        this.loadPurchases(id);
      }
    }
  }

  private loadPurchases(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getById(id).subscribe({
      next: (customer) => {
        this.customerType.set(customer.customer_type);
        this.saleService.getPurchases(id).subscribe({
          next: (data) => {
            this.purchases.set(data);
            this.loading.set(false);
          },
          error: (err: Error) => {
            this.error.set(err.message ?? 'Failed to load purchase history.');
            this.loading.set(false);
          },
        });
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load customer.');
        this.loading.set(false);
      },
    });
  }

  startReturn(saleId: number, item: SaleItem): void {
    this.returnTarget.set({ saleId, item });
    this.returnQty.set(1);
    this.returnReason.set('');
    this.returnError.set(null);
  }

  cancelReturn(): void {
    this.returnTarget.set(null);
    this.returnError.set(null);
  }

  confirmReturn(): void {
    const target = this.returnTarget();
    if (!target || this.submittingReturn()) return;
    if (this.returnQty() < 1 || this.returnQty() > this.returnRemaining) return;

    this.submittingReturn.set(true);
    this.returnError.set(null);

    this.saleService.createReturn(target.saleId, {
      sale_item_id: target.item.id,
      quantity: this.returnQty(),
      reason: this.returnReason()?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.submittingReturn.set(false);
        this.cancelReturn();
        if (this.customerId !== null) {
          this.loadPurchases(this.customerId);
        }
      },
      error: (err: Error) => {
        this.submittingReturn.set(false);
        this.returnError.set(err.message ?? 'Failed to process return.');
      },
    });
  }
}