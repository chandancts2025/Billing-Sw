import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { ProductSearchResultDto } from '../billing.models';

@Component({
  selector: 'be-product-search-input',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <section>
      <label><mat-icon>{{ barcodeMode() ? 'barcode_scanner' : 'search' }}</mat-icon><input [(ngModel)]="term" (ngModelChange)="search($event)" (keydown)="keys($event)" placeholder="Search product, code, or barcode" autocomplete="off"></label>
      @if (matches().length) {
        <div>
          @for (product of matches(); track product.productId + product.sku) {
            <button type="button" [class.active]="$index === active()" (click)="select(product)"><strong>{{ product.name }}</strong><span>{{ product.category }} | {{ product.stockQuantity }} {{ product.unit }} | Rs. {{ product.sellingPrice }}</span></button>
          }
        </div>
      }
    </section>
  `,
  styles: [`section{position:relative}label{height:46px;display:flex;align-items:center;gap:8px;border:1px solid #cfd6e1;border-radius:6px;background:#fff;padding:0 12px}input{border:0;outline:0;width:100%;min-width:0}div{position:absolute;z-index:10;top:50px;left:0;right:0;background:#fff;border:1px solid #dfe5ec;border-radius:6px;box-shadow:0 12px 28px rgba(16,24,40,.14);padding:6px}button{width:100%;border:0;background:transparent;display:flex;justify-content:space-between;gap:12px;padding:8px;border-radius:5px;text-align:left;cursor:pointer}button.active,button:hover{background:#eef7f6}span{color:#667085;font-size:12px}`]
})
export class ProductSearchInputComponent {
  private readonly api = inject(BillingApiService);
  private readonly auth = inject(AuthService);
  readonly selected = output<ProductSearchResultDto>();
  readonly matches = signal<ProductSearchResultDto[]>([]);
  readonly active = signal(0);
  readonly barcodeMode = signal(false);
  readonly shopId = computed(() => this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001');
  term = '';
  private timer?: number;
  private barcode = '';
  private lastKey = 0;

  search(value: string): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (value.trim().length < 2) { this.matches.set([]); return; }
      this.api.searchProducts(this.shopId(), value.trim()).subscribe(rows => this.matches.set(rows.slice(0, 10)));
    }, 300);
  }

  keys(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') { event.preventDefault(); this.active.update(i => Math.min(i + 1, this.matches().length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); this.active.update(i => Math.max(i - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); const match = this.matches()[this.active()]; if (match) this.select(match); }
    const now = Date.now();
    if (now - this.lastKey > 80) this.barcode = '';
    this.lastKey = now;
    if (event.key.length === 1) this.barcode += event.key;
    if (event.key === 'Enter' && this.barcode.length >= 4) this.barcodeMode.set(true);
  }

  select(product: ProductSearchResultDto): void {
    this.selected.emit(product);
    this.term = '';
    this.matches.set([]);
    this.active.set(0);
  }
}
