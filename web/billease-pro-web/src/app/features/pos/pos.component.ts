import { Component, HostListener, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

interface PosProduct {
  sku: string;
  name: string;
  price: number;
  taxRate: number;
}

interface CartLine extends PosProduct {
  quantity: number;
  discount: number;
}

@Component({
  selector: 'be-pos',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule],
  template: `
    <section class="pos">
      <div class="sale-panel">
        <div class="search-row">
          <mat-icon>barcode_scanner</mat-icon>
          <input matInput placeholder="Scan barcode or search product" [(ngModel)]="query" (keyup.enter)="addFirstMatch()">
          <button mat-flat-button color="primary" type="button" (click)="addFirstMatch()"><mat-icon>add_shopping_cart</mat-icon>Add</button>
        </div>
        <div class="shortcuts">
          <kbd>F2</kbd><span>Focus search</span>
          <kbd>F4</kbd><span>Discount</span>
          <kbd>F8</kbd><span>Pay</span>
          <kbd>Ctrl+P</kbd><span>Print</span>
        </div>
        <div class="product-grid">
          @for (product of filteredProducts(); track product.sku) {
            <button type="button" (click)="add(product)">
              <span>{{ product.name }}</span>
              <strong>₹{{ product.price }}</strong>
            </button>
          }
        </div>
      </div>

      <aside class="cart-panel">
        <div class="cart-head">
          <div>
            <strong>Current bill</strong>
            <span>{{ cart().length }} items</span>
          </div>
          <button mat-icon-button type="button" aria-label="Clear bill" (click)="clear()"><mat-icon>delete_sweep</mat-icon></button>
        </div>
        <div class="cart-lines">
          @for (line of cart(); track line.sku) {
            <div class="line">
              <div>
                <strong>{{ line.name }}</strong>
                <span>₹{{ line.price }} · GST {{ line.taxRate }}%</span>
              </div>
              <div class="qty">
                <button type="button" (click)="decrement(line.sku)">−</button>
                <span>{{ line.quantity }}</span>
                <button type="button" (click)="increment(line.sku)">+</button>
              </div>
              <b>₹{{ lineTotal(line) }}</b>
            </div>
          } @empty {
            <p class="empty">Start by scanning or choosing a product.</p>
          }
        </div>
        <div class="totals">
          <span>Subtotal</span><strong>₹{{ subtotal() }}</strong>
          <span>Tax</span><strong>₹{{ taxTotal() }}</strong>
          <span>Discount</span><strong>₹{{ discountTotal() }}</strong>
          <span class="grand">Total</span><strong class="grand">₹{{ grandTotal() }}</strong>
        </div>
        <div class="cart-actions">
          <button mat-stroked-button type="button" (click)="print('thermal-80')"><mat-icon>receipt</mat-icon>Thermal</button>
          <button mat-flat-button color="primary" type="button" (click)="pay()"><mat-icon>payments</mat-icon>Pay</button>
        </div>
      </aside>

      <article id="print-bill" class="print-bill" [class.thermal-58]="printMode() === 'thermal-58'" [class.thermal-80]="printMode() === 'thermal-80'">
        <header>
          <h2>BillEase Demo Store</h2>
          <p>Main Market Road, Bengaluru</p>
          <p>GSTIN 29ABCDE1234F1Z5</p>
        </header>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
          <tbody>
            @for (line of cart(); track line.sku) {
              <tr><td>{{ line.name }}</td><td>{{ line.quantity }}</td><td>₹{{ lineTotal(line) }}</td></tr>
            }
          </tbody>
        </table>
        <footer>
          <div><span>Tax</span><strong>₹{{ taxTotal() }}</strong></div>
          <div><span>Total</span><strong>₹{{ grandTotal() }}</strong></div>
          <p>Thank you for shopping with us.</p>
        </footer>
      </article>
    </section>
  `,
  styleUrl: './pos.component.css'
})
export class PosComponent {
  query = '';
  readonly printMode = signal<'a4' | 'thermal-58' | 'thermal-80'>('a4');
  readonly products = signal<PosProduct[]>([
    { sku: 'MED-PAR-500', name: 'Paracetamol 500mg', price: 12, taxRate: 12 },
    { sku: 'MED-VIT-C', name: 'Vitamin C Tablets', price: 110, taxRate: 12 },
    { sku: 'GRO-RICE', name: 'Premium Rice', price: 62, taxRate: 5 },
    { sku: 'GRO-OIL', name: 'Sunflower Oil 1L', price: 135, taxRate: 18 },
    { sku: 'FAS-TSHIRT', name: 'Cotton T-Shirt', price: 349, taxRate: 5 }
  ]);
  readonly cart = signal<CartLine[]>([]);
  readonly filteredProducts = computed(() => {
    const text = this.query.toLowerCase();
    return this.products().filter(product => `${product.sku} ${product.name}`.toLowerCase().includes(text));
  });
  readonly subtotal = computed(() => this.cart().reduce((sum, line) => sum + line.price * line.quantity, 0));
  readonly discountTotal = computed(() => this.cart().reduce((sum, line) => sum + line.discount, 0));
  readonly taxTotal = computed(() => Math.round(this.cart().reduce((sum, line) => sum + ((line.price * line.quantity - line.discount) * line.taxRate / 100), 0)));
  readonly grandTotal = computed(() => this.subtotal() - this.discountTotal() + this.taxTotal());

  @HostListener('window:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.search-row input')?.focus();
    }
    if (event.key === 'F4') {
      event.preventDefault();
      this.applyQuickDiscount();
    }
    if (event.key === 'F8') {
      event.preventDefault();
      this.pay();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.print('a4');
    }
  }

  addFirstMatch(): void {
    const product = this.filteredProducts()[0];
    if (product) this.add(product);
  }

  add(product: PosProduct): void {
    const existing = this.cart().find(line => line.sku === product.sku);
    if (existing) {
      this.increment(product.sku);
      return;
    }
    this.cart.update(lines => [...lines, { ...product, quantity: 1, discount: 0 }]);
    this.query = '';
  }

  increment(sku: string): void {
    this.cart.update(lines => lines.map(line => line.sku === sku ? { ...line, quantity: line.quantity + 1 } : line));
  }

  decrement(sku: string): void {
    this.cart.update(lines => lines.flatMap(line => {
      if (line.sku !== sku) return [line];
      return line.quantity <= 1 ? [] : [{ ...line, quantity: line.quantity - 1 }];
    }));
  }

  lineTotal(line: CartLine): number {
    return Math.round(line.price * line.quantity - line.discount + ((line.price * line.quantity - line.discount) * line.taxRate / 100));
  }

  applyQuickDiscount(): void {
    this.cart.update(lines => lines.map((line, index) => index === lines.length - 1 ? { ...line, discount: Math.round(line.price * line.quantity * 0.05) } : line));
  }

  clear(): void {
    this.cart.set([]);
  }

  pay(): void {
    this.print('thermal-80');
  }

  print(mode: 'a4' | 'thermal-58' | 'thermal-80'): void {
    this.printMode.set(mode);
    setTimeout(() => window.print());
  }
}
