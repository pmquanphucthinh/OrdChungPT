import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type CheckoutStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutModalComponent {
  isOpen = input<boolean>(false);
  status = input<CheckoutStatus>('idle');
  closeModal = output<void>();
  confirmOrder = output<string>();

  customerName = signal('');

  onClose() {
    // Prevent closing while loading
    if (this.status() !== 'loading') {
      this.closeModal.emit();
    }
  }

  onConfirm() {
    if (this.customerName().trim() && this.status() !== 'loading') {
      // If retrying from an error state, call confirm directly
      if (this.status() === 'error') {
        this.confirmOrder.emit(this.customerName().trim());
      } else {
        this.confirmOrder.emit(this.customerName().trim());
      }
    }
  }
}
