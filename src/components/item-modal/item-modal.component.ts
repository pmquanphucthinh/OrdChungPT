import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect, WritableSignal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, Customization, CustomizationOption, CartItem } from '../../models/menu.model';

interface SelectedOptions {
  [customizationName: string]: string | string[];
}

@Component({
  selector: 'app-item-modal',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemModalComponent {
  item = input<MenuItem | null>();
  closeModal = output<void>();
  addToCart = output<Omit<CartItem, 'quantity'>>();

  selectedOptions: WritableSignal<SelectedOptions> = signal({});

  totalPrice = computed(() => {
    const currentItem = this.item();
    if (!currentItem) return 0;
    
    let extraCost = 0;
    const options = this.selectedOptions();
    
    for (const cust of currentItem.customizations || []) {
      const selection = options[cust.name];
      if (selection) {
        const ids = Array.isArray(selection) ? selection : [selection];
        for (const id of ids) {
          const option = cust.options.find(o => o.id === id);
          if (option) {
            extraCost += option.ta_price;
          }
        }
      }
    }
    return currentItem.ta_price + extraCost;
  });

  constructor() {
    effect(() => {
      const currentItem = this.item();
      if (currentItem) {
        const defaultOptions: SelectedOptions = {};
        for (const cust of currentItem.customizations || []) {
            if (cust.max_permitted > 1) {
                defaultOptions[cust.name] = [];
            } else {
                 defaultOptions[cust.name] = ''; // For radio buttons
            }
        }
        this.selectedOptions.set(defaultOptions);
      }
    });
  }

  onClose() {
    this.closeModal.emit();
  }

  onAddToCart() {
    const currentItem = this.item();
    if (!currentItem) return;

    const optionsSummary: { group: string, option: string, price: number }[] = [];
    const options = this.selectedOptions();
    for (const cust of currentItem.customizations || []) {
        const selection = options[cust.name];
         if (selection && selection.length > 0) {
            const ids = Array.isArray(selection) ? selection : [selection];
            for (const id of ids) {
                const optionDetails = cust.options.find(o => o.id === id);
                if (optionDetails) {
                    optionsSummary.push({
                        group: cust.name,
                        option: optionDetails.name,
                        price: optionDetails.ta_price
                    });
                }
            }
        }
    }

    const cartItem: Omit<CartItem, 'quantity'> = {
      id: currentItem.id,
      name: currentItem.name,
      basePrice: currentItem.ta_price,
      finalPrice: this.totalPrice(),
      image_url: currentItem.image_url,
      options: optionsSummary
    };

    this.addToCart.emit(cartItem);
  }

  onRadioChange(custName: string, optionId: string) {
    this.selectedOptions.update(options => ({
      ...options,
      [custName]: optionId,
    }));
  }

  onCheckboxChange(custName: string, optionId: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedOptions.update(options => {
        const currentSelection = (options[custName] as string[] | undefined) || [];
        if (isChecked) {
            return { ...options, [custName]: [...currentSelection, optionId] };
        } else {
            return { ...options, [custName]: currentSelection.filter(id => id !== optionId) };
        }
    });
  }
}
