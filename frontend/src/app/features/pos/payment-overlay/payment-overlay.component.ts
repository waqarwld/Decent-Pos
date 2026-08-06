import { Component, inject, signal, input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/models/customer';

type PaymentMethod = 'cash' | 'card' | 'split' | 'other';

@Component({
  selector: 'app-payment-overlay',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <!-- Modal -->
      <div class="bg-pos-surface border border-pos-surface-light rounded-2xl shadow-2xl w-full max-w-lg p-6">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-pos-text">Payment</h2>
          <button
            (click)="onCancel()"
            class="text-pos-text-muted hover:text-pos-text text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <!-- Customer -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-pos-text-muted mb-2">
            Customer
          </label>
          <select
            [ngModel]="selectedCustomerId()"
            (ngModelChange)="onCustomerChange($event)"
            class="w-full px-4 py-3 bg-pos-surface-light border border-pos-surface-light rounded-xl text-pos-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pos-accent transition"
          >
            <option [ngValue]="null">Walk-in customer (no account)</option>
            @for (customer of customers(); track customer.id) {
              <option [ngValue]="customer.id">
                {{ customer.name }} — {{ customer.customer_type | titlecase }}
              </option>
            }
          </select>
          @if (customersError()) {
            <p class="mt-1 text-xs text-pos-danger">{{ customersError() }}</p>
          }
        </div>

        <!-- Amount Due -->
        <div class="text-center mb-6 p-6 bg-pos-bg rounded-xl border border-pos-surface-light">
          <p class="text-sm text-pos-text-muted mb-1">Amount Due</p>
          <p class="text-5xl font-bold text-pos-accent tracking-tight">{{ total() | currency }}</p>
        </div>

        <!-- Payment Method -->
        <div class="mb-6">
          <p class="text-sm font-medium text-pos-text-muted mb-3">Payment Method</p>
          <div class="grid grid-cols-4 gap-2">
            @for (method of paymentMethods; track method.id) {
              <button
                type="button"
                (click)="selectMethod(method.id)"
                class="py-3 rounded-xl text-sm font-semibold transition border select-none"
                [class.bg-pos-accent]="selectedMethod() === method.id"
                [class.text-pos-bg]="selectedMethod() === method.id"
                [class.border-pos-accent]="selectedMethod() === method.id"
                [class.bg-pos-surface-light]="selectedMethod() !== method.id"
                [class.text-pos-text]="selectedMethod() !== method.id"
                [class.border-pos-surface-light]="selectedMethod() !== method.id"
              >
                {{ method.label }}
              </button>
            }
          </div>
        </div>

        <!-- Tender Amount -->
        <div class="mb-6">
          <p class="text-sm font-medium text-pos-text-muted mb-2">Tender Amount</p>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-pos-text-muted text-lg font-semibold">$</span>
            <input
              type="number"
              [ngModel]="tenderAmount()"
              (ngModelChange)="tenderAmount.set($event)"
              step="0.01"
              min="0"
              class="w-full pl-10 pr-4 py-3.5 bg-pos-surface-light border border-pos-surface-light rounded-xl text-pos-text text-xl font-bold focus:outline-none focus:ring-2 focus:ring-pos-accent transition"
            />
          </div>
          <!-- Quick amounts -->
          <div class="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              (click)="setTenderExact()"
              class="px-3 py-1.5 rounded-lg bg-pos-surface-light text-xs text-pos-text-muted hover:text-pos-text transition"
            >
              Exact
            </button>
            <button
              type="button"
              (click)="roundTender(5)"
              class="px-3 py-1.5 rounded-lg bg-pos-surface-light text-xs text-pos-text-muted hover:text-pos-text transition"
            >
              Round $5
            </button>
            <button
              type="button"
              (click)="roundTender(10)"
              class="px-3 py-1.5 rounded-lg bg-pos-surface-light text-xs text-pos-text-muted hover:text-pos-text transition"
            >
              Round $10
            </button>
          </div>
        </div>

        <!-- Change Due -->
        @if (changeDue() > 0) {
          <div class="mb-6 p-4 bg-pos-success/10 border border-pos-success/30 rounded-xl flex items-center justify-between">
            <span class="text-sm text-pos-text-muted">Change Due</span>
            <span class="text-xl font-bold text-pos-success">{{ changeDue() | currency }}</span>
          </div>
        }

        @if (changeDue() < 0) {
          <div class="mb-6 p-4 bg-pos-warning/10 border border-pos-warning/30 rounded-xl flex items-center justify-between">
            <span class="text-sm text-pos-text-muted">Still Due</span>
            <span class="text-xl font-bold text-pos-warning">{{ changeDue() * -1 | currency }}</span>
          </div>
        }

        <!-- Transaction error -->
        @if (submitError()) {
          <div class="mb-4 p-3 bg-pos-danger/10 border border-pos-danger/30 rounded-xl text-sm text-pos-danger flex items-start gap-2">
            <span class="shrink-0 text-base">⚠</span>
            <span>{{ submitError() }}</span>
          </div>
        }

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            (click)="onCancel()"
            class="flex-1 h-14 rounded-xl bg-pos-surface-light text-pos-text font-semibold hover:bg-pos-surface-light/80 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onComplete()"
            [disabled]="!canComplete() || submitting()"
            class="flex-1 h-14 rounded-xl bg-pos-accent text-pos-bg font-bold hover:bg-pos-accent-hover disabled:bg-pos-accent/40 disabled:cursor-not-allowed transition"
          >
            @if (submitting()) {
              <span class="flex items-center justify-center gap-2">
                <span class="w-5 h-5 border-2 border-pos-bg/30 border-t-pos-bg rounded-full animate-spin"></span>
                Processing…
              </span>
            } @else {
              <span>Complete Payment</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PaymentOverlayComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly customerService = inject(CustomerService);

  readonly total = input(0);
  readonly locationId = input(1);

  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // ── Customer ──────────────────────────────────────────────────────────────────
  readonly customers = signal<Customer[]>([]);
  readonly customersError = signal<string | null>(null);
  readonly selectedCustomerId = signal<number | null>(null);

  // ── Payment state ─────────────────────────────────────────────────────────────
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly selectedMethod = signal<PaymentMethod>('cash');
  readonly tenderAmount = signal(0);

  readonly changeDue = () => Math.round((this.tenderAmount() - this.total()) * 100) / 100;

  readonly paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'split', label: 'Split' },
    { id: 'other', label: 'Other' },
  ];

  ngOnInit(): void {
    this.setTenderExact();
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (data) => this.customers.set(data),
      error: (err: Error) =>
        this.customersError.set(err.message ?? 'Failed to load customers.'),
    });
  }

  onCustomerChange(id: number | null): void {
    this.selectedCustomerId.set(id);
    const customer = id == null ? null : this.customers().find((c) => c.id === id) ?? null;
    this.transactionService.setCustomer(customer);
    // The total can change with wholesale pricing — reselect tender to match.
    this.setTenderExact();
  }

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
    if (method === 'card') {
      this.setTenderExact();
    } else if (method === 'cash') {
      this.roundTender(5);
    }
  }

  setTenderExact(): void {
    this.tenderAmount.set(Math.round(this.total() * 100) / 100);
  }

  roundTender(roundTo: number): void {
    const rounded = Math.ceil(this.total() / roundTo) * roundTo;
    this.tenderAmount.set(Math.round(rounded * 100) / 100);
  }

  canComplete(): boolean {
    return this.changeDue() >= 0 && this.tenderAmount() > 0 && !this.submitting();
  }

  onComplete(): void {
    if (!this.canComplete()) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.transactionService
      .submit({ locationId: this.locationId(), paymentMethod: this.selectedMethod() })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.completed.emit();
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.submitError.set(err.message ?? 'Payment failed. Please try again.');
        },
      });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}