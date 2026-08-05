import { Injectable, computed, signal } from '@angular/core';
import { CustomerSearchResultDto, DiscountValueType, ProductSearchResultDto } from '../../features/billing/billing.models';

export interface BillStoreItem {
  id: string;
  product: ProductSearchResultDto;
  quantity: number;
  unitPrice: number;
  discountType: DiscountValueType | null;
  discountValue: number;
}

@Injectable({ providedIn: 'root' })
export class BillStore {
  private readonly itemsSignal = signal<BillStoreItem[]>([]);
  private readonly customerSignal = signal<CustomerSearchResultDto | null>(null);

  readonly items = this.itemsSignal.asReadonly();
  readonly customer = this.customerSignal.asReadonly();
  readonly subTotal = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  readonly itemDiscount = computed(() => this.itemsSignal().reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    return sum + (item.discountType === 'Percentage' ? gross * item.discountValue / 100 : item.discountValue || 0);
  }, 0));
  readonly total = computed(() => Math.max(0, this.subTotal() - this.itemDiscount()));

  add(product: ProductSearchResultDto): void {
    this.itemsSignal.update(items => [...items, { id: crypto.randomUUID(), product, quantity: 1, unitPrice: product.sellingPrice, discountType: null, discountValue: 0 }]);
  }

  update(id: string, patch: Partial<BillStoreItem>): void {
    this.itemsSignal.update(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  remove(id: string): void {
    this.itemsSignal.update(items => items.filter(item => item.id !== id));
  }

  setCustomer(customer: CustomerSearchResultDto | null): void {
    this.customerSignal.set(customer);
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.customerSignal.set(null);
  }
}
