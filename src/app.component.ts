import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, WritableSignal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ApiService } from './services/api.service';
import { MenuData, MenuItem, ItemType, CartItem } from './models/menu.model';
import { ItemModalComponent } from './components/item-modal/item-modal.component';
import { CheckoutModalComponent, CheckoutStatus } from './components/checkout-modal/checkout-modal.component';

interface GroupedItems {
  category: ItemType;
  items: MenuItem[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, ItemModalComponent, CheckoutModalComponent],
})
export class AppComponent implements OnInit {
  private apiService = inject(ApiService);

  menuData: WritableSignal<MenuData | null> = signal(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  selectedItem = signal<MenuItem | null>(null);
  cart = signal<CartItem[]>([]);

  isCheckoutModalOpen = signal(false);
  checkoutStatus = signal<CheckoutStatus>('idle');

  groupedItems = computed<GroupedItems[]>(() => {
    const data = this.menuData();
    if (!data) return [];
    
    const activeItemTypes = data.item_types
        .filter(it => it.active && it.name !== 'Uncategory' && it.name !== 'Topping DD' && it.name !== 'TOPPING')
        .sort((a,b) => a.sort - b.sort);

    return activeItemTypes.map(category => {
      const items = data.items.filter(item => item.type_id === category.text_id && item.status === 'ACTIVE' && item.ta_price > 0);
      return { category, items };
    }).filter(group => group.items.length > 0);
  });

  cartTotal = computed(() => {
    return this.cart().reduce((total, item) => total + item.finalPrice * item.quantity, 0);
  });

  cartCount = computed(() => {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  });
  
  ngOnInit(): void {
    this.apiService.getMenu().subscribe(response => {
      if (response.error === 0 && response.data) {
        this.menuData.set(response.data);
      } else {
        this.error.set(response.message || 'Đã xảy ra lỗi không xác định.');
      }
      this.loading.set(false);
    });
  }

  getCartItemIdentifier(item: { id: number; options?: { group: string; option: string; price: number }[] }): string {
    if (!item.options || item.options.length === 0) {
      return `${item.id}`;
    }
    // Sort options by option name to ensure a consistent identifier regardless of selection order
    const sortedOptions = item.options.slice().sort((a, b) => a.option.localeCompare(b.option));
    return `${item.id}-${JSON.stringify(sortedOptions)}`;
  }

  handleAddToCart(newItem: Omit<CartItem, 'quantity'>): void {
    this.cart.update(currentCart => {
      const newItemIdentifier = this.getCartItemIdentifier(newItem);
      const existingItemIndex = currentCart.findIndex(
        item => this.getCartItemIdentifier(item) === newItemIdentifier
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1
        };
        return updatedCart;
      } else {
        return [...currentCart, { ...newItem, quantity: 1 }];
      }
    });
    this.closeItemModal();
  }
  
  updateQuantity(cartItemToUpdate: CartItem, delta: number): void {
    this.cart.update(currentCart => {
      const itemIdentifier = this.getCartItemIdentifier(cartItemToUpdate);
      const itemIndex = currentCart.findIndex(
        item => this.getCartItemIdentifier(item) === itemIdentifier
      );

      if (itemIndex > -1) {
        const updatedCart = [...currentCart];
        const newQuantity = updatedCart[itemIndex].quantity + delta;
        if (newQuantity > 0) {
          updatedCart[itemIndex] = { ...updatedCart[itemIndex], quantity: newQuantity };
        } else {
          updatedCart.splice(itemIndex, 1);
        }
        return updatedCart;
      }
      return currentCart;
    });
  }

  openItemModal(item: MenuItem): void {
    this.selectedItem.set(item);
  }

  closeItemModal(): void {
    this.selectedItem.set(null);
  }

  scrollToCategory(categoryId: string) {
    document.getElementById(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openCheckoutModal(): void {
    if (this.cart().length > 0) {
      this.isCheckoutModalOpen.set(true);
    }
  }

  closeCheckoutModal(): void {
    this.isCheckoutModalOpen.set(false);
    if (this.checkoutStatus() !== 'loading') {
      this.checkoutStatus.set('idle');
    }
  }

  handleConfirmOrder(name: string): void {
    this.checkoutStatus.set('loading');
    
    const payload = {
      orders: this.cart().map(cartItem => {
        const orderItem: { [key: string]: string | number } = {
          Nguoi_Dat: name,
          TenSP: cartItem.name,
          So_Luong: cartItem.quantity,
          Don_Gia: cartItem.finalPrice,
          Thanh_Tien: cartItem.finalPrice * cartItem.quantity
        };
        cartItem.options.forEach((opt, index) => {
          orderItem[`Option${index + 1}`] = opt.option;
        });
        return orderItem;
      })
    };

    this.apiService.submitOrder(payload).subscribe(response => {
      if (response && (response.result === 'success' || response.success)) {
        this.checkoutStatus.set('success');
        setTimeout(() => {
          this.cart.set([]);
          this.closeCheckoutModal();
        }, 2000); // Show success message for 2 seconds
      } else {
        this.checkoutStatus.set('error');
        console.error('Order submission failed:', response);
      }
    });
  }
}