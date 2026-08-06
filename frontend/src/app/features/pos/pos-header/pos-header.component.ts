import { Component, inject, signal, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-pos-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <header class="h-16 bg-pos-surface border-b border-pos-surface-light flex items-center justify-between px-4 shrink-0">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <span class="text-2xl">📦</span>
        <span class="text-lg font-bold text-pos-text tracking-tight hidden sm:block">POS</span>
      </div>

      <!-- Barcode / Search Input -->
      <div class="flex-1 max-w-xl mx-4">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted text-lg">📷</span>
          <input
            [formControl]="barcodeControl"
            type="text"
            placeholder="Scan barcode or type SKU..."
            class="w-full pl-10 pr-4 py-2.5 bg-pos-surface-light border border-pos-surface-light rounded-xl text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-accent transition"
          />
          @if (barcodeControl.value) {
            <button
              type="button"
              (click)="barcodeControl.setValue('')"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text"
            >
              ✕
            </button>
          }
        </div>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-4">
        <div class="text-right hidden sm:block">
          <div class="text-xs text-pos-text-muted">{{ currentTime() | date:'EEE, MMM d' }}</div>
          <div class="text-sm font-semibold text-pos-text">{{ currentTime() | date:'HH:mm:ss' }}</div>
        </div>
        <button
          (click)="authService.logout()"
          class="px-3 py-2 bg-pos-danger/10 hover:bg-pos-danger/20 text-pos-danger rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
    </header>
  `,
})
export class PosHeaderComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly destroy$ = new Subject<void>();

  @Output() productFound = new EventEmitter<any>();

  readonly barcodeControl = new FormControl('');
  readonly currentTime = signal(new Date());

  ngOnInit(): void {
    // Update clock every second
    const clock = setInterval(() => this.currentTime.set(new Date()), 1000);
    this.destroy$.subscribe({ next: () => clearInterval(clock) });

    // Barcode search
    this.barcodeControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const trimmed = (value ?? '').trim();
        if (!trimmed) return;
        this.productService.getBySku(trimmed).subscribe({
          next: (product) => {
            this.productFound.emit(product);
            this.barcodeControl.setValue('', { emitEvent: false });
          },
          error: () => {
            // SKU not found — ignore or could show toast
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
