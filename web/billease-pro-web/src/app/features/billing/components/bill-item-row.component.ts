import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillStoreItem } from '../../../core/stores/bill.store';
import { DiscountValueType } from '../billing.models';

@Component({
  selector: 'be-bill-item-row',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  template: `
    @if (item(); as row) {
      <div class="line" tabindex="0" (keydown.delete)="remove.emit(row.id)">
        <span><strong>{{ row.product.name }}</strong><small>{{ row.product.sku }}</small></span>
        <span>{{ row.product.unit }}</span>
        <input type="number" min="0.01" step="0.01" [ngModel]="row.quantity" (ngModelChange)="patch.emit({ quantity: number($event) })">
        <input type="number" min="0" step="0.01" [ngModel]="row.unitPrice" (ngModelChange)="patch.emit({ unitPrice: number($event) })">
        <select [ngModel]="row.discountType ?? 'Percentage'" (ngModelChange)="patch.emit({ discountType: $event })">
          <option value="Percentage">%</option>
          <option value="FlatAmount">Rs</option>
        </select>
        <input type="number" min="0" step="0.01" [ngModel]="row.discountValue" (ngModelChange)="patch.emit({ discountValue: number($event) })">
        <strong>Rs. {{ total(row).toFixed(2) }}</strong>
        <button mat-icon-button type="button" (click)="remove.emit(row.id)" aria-label="Delete row"><mat-icon>delete</mat-icon></button>
      </div>
    }
  `,
  styles: [`.line{display:grid;grid-template-columns:minmax(220px,1fr) 70px 78px 92px 62px 78px 100px 40px;gap:8px;align-items:center;border:1px solid #e4e8ef;border-radius:6px;padding:8px;background:#fff}span:first-child{display:grid;gap:2px}small{color:#667085}input,select{min-height:34px;border:1px solid #cfd6e1;border-radius:5px;padding:0 8px;min-width:0}@media(max-width:980px){.line{grid-template-columns:1fr 60px 72px 84px 58px 72px 90px 36px}}`]
})
export class BillItemRowComponent {
  readonly item = input<BillStoreItem | null>(null);
  readonly patch = output<Partial<BillStoreItem>>();
  readonly remove = output<string>();

  number(value: string | number): number {
    return Number(value) || 0;
  }

  total(row: BillStoreItem): number {
    const gross = row.quantity * row.unitPrice;
    const discount = row.discountType === 'Percentage' ? gross * row.discountValue / 100 : row.discountValue;
    return Math.max(0, gross - discount) * (1 + row.product.taxRate / 100);
  }
}
