import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';

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

        <!-- Amount Due -->
        <div class="text-center mb-6 p-6 bg-pos-bg rounded-xl border border-pos-surface-light">
          <p class="text-sm text-pos-text-muted mb-1">Amount Due</p>
          <p class="text-5xl font-bold text-pos-accent tracking-tight">{{ total | currency }}</p>
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
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-pos-text-muted">Tender Amount</p>
          </div>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-pos-text-muted text-lg font-semibold">$</span>
            <input
              type="number"
              [(ngModel)]="tenderAmount"
              (input)="onTenderChange()"
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
export class PaymentOverlayComponent {
  private readonly transactionService = inject(TransactionService);

  @Input() total = 0;
  @Input() locationId = 1;

  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly selectedMethod = signal<PaymentMethod>('cash');
  readonly changeDue = signal(0);
  tenderAmount = 0;

  readonly paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'split', label: 'Split' },
    { id: 'other', label: 'Other' },
  ];

  ngOnInit(): void {
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
    this.tenderAmount = Math.round(this.total * 100) / 100;
    this.calculateChange();
  }

  roundTender(roundTo: number): void {
    const rounded = Math.ceil(this.total / roundTo) * roundTo;
    this.tenderAmount = Math.round(rounded * 100) / 100;
    this.calculateChange();
  }

  onTenderChange(): void {
    this.calculateChange();
  }

  calculateChange(): void {
    this.changeDue.set(Math.round((this.tenderAmount - this.total) * 100) / 100);
  }

  canComplete(): boolean {
    return this.changeDue() >= 0 && this.tenderAmount > 0;
  }

  onComplete(): void {
    if (!this.canComplete() || this.submitting()) return;

    this.submitting.set(true);
    this.transactionService.submit(this.locationId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.completed.emit();
      },
      error: () => {
        this.submitting.set(false);
        // Error is surfaced via transactionService.error
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
