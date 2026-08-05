import { Component, computed, input } from '@angular/core';
import { BillStoreItem } from '../../../core/stores/bill.store';

@Component({
  selector: 'be-bill-totals',
  standalone: true,
  template: `
    <section>
      <div><span>Sub Total</span><strong>Rs. {{ subTotal().toFixed(2) }}</strong></div>
      <div><span>Item Discount</span><strong>Rs. {{ discount().toFixed(2) }}</strong></div>
      <div><span>Tax</span><strong>Rs. {{ tax().toFixed(2) }}</strong></div>
      <div class="grand"><span>Grand Total</span><strong>Rs. {{ grandTotal().toFixed(2) }}</strong></div>
    </section>
  `,
  styles: [`section{display:grid;gap:8px}div{display:flex;justify-content:space-between;align-items:center;transition:background .18s ease}.grand{font-size:22px;border-top:1px solid #dfe5ec;padding-top:10px}.grand strong{color:var(--brand-color,#0f766e)}`]
})
export class BillTotalsComponent {
  readonly items = input<BillStoreItem[]>([]);
  readonly subTotal = computed(() => this.items().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  readonly discount = computed(() => this.items().reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    return sum + (item.discountType === 'Percentage' ? gross * item.discountValue / 100 : item.discountValue || 0);
  }, 0));
  readonly tax = computed(() => this.items().reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = item.discountType === 'Percentage' ? gross * item.discountValue / 100 : item.discountValue || 0;
    return sum + Math.max(0, gross - discount) * item.product.taxRate / 100;
  }, 0));
  readonly grandTotal = computed(() => Math.round(this.subTotal() - this.discount() + this.tax()));
}
