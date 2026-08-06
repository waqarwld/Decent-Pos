import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal -->
      <div class="bg-pos-surface border border-pos-surface-light rounded-2xl shadow-2xl w-full max-w-sm p-6" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="text-center mb-6">
          <p class="text-sm text-pos-text-muted mb-1">{{ title }}</p>
          <p class="text-4xl font-bold text-pos-text tracking-tight">{{ displayValue }}</p>
        </div>

        <!-- Numpad Grid -->
        <div class="grid grid-cols-3 gap-3">
          @for (key of keys; track key) {
            <button
              type="button"
              (click)="onKeyPress(key)"
              class="h-16 rounded-xl text-xl font-bold transition select-none active:scale-95"
              [class]="keyClass(key)"
            >
              {{ keyLabel(key) }}
            </button>
          }
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-4">
          <button
            type="button"
            (click)="onCancel()"
            class="flex-1 h-12 rounded-xl bg-pos-surface-light text-pos-text font-semibold hover:bg-pos-surface-light/80 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onConfirm()"
            class="flex-1 h-12 rounded-xl bg-pos-accent text-pos-bg font-bold hover:bg-pos-accent-hover transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NumpadComponent {
  @Input() title = 'Quantity';
  @Input() initialValue = 1;
  @Input() minValue = 1;
  @Input() allowZero = false;

  @Output() confirm = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  readonly currentValue = signal<string>('');

  readonly keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '✓'];

  get displayValue(): number {
    const val = parseInt(this.currentValue(), 10);
    return isNaN(val) ? this.initialValue : val;
  }

  ngOnInit(): void {
    this.currentValue.set(String(this.initialValue));
  }

  keyClass(key: string): string {
    switch (key) {
      case 'C':
        return 'bg-pos-danger/10 text-pos-danger hover:bg-pos-danger/20';
      case '✓':
        return 'bg-pos-accent text-pos-bg hover:bg-pos-accent-hover';
      default:
        return 'bg-pos-surface-light text-pos-text hover:bg-pos-surface-light/80';
    }
  }

  keyLabel(key: string): string {
    return key;
  }

  onKeyPress(key: string): void {
    if (key === 'C') {
      this.currentValue.set('');
      return;
    }
    if (key === '✓') {
      this.onConfirm();
      return;
    }
    const current = this.currentValue();
    if (current === '0' && key !== '0') {
      this.currentValue.set(key);
    } else {
      this.currentValue.set(current + key);
    }
  }

  onConfirm(): void {
    const val = this.displayValue;
    if (!this.allowZero && val < this.minValue) {
      return;
    }
    this.confirm.emit(val);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    this.cancel.emit();
  }
}
