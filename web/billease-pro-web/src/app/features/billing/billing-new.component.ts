import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { BillingService } from './billing.service';
import { BillQuoteDto, CustomerSearchResultDto, DiscountValueType, PaymentMethod, ProductBatchOptionDto, ProductSearchResultDto, SaleInvoiceDetailDto } from './billing.models';

interface BillLine {
  key: string;
  product: ProductSearchResultDto;
  batch?: ProductBatchOptionDto | null;
  quantity: number;
  unitPrice: number;
  discountType: DiscountValueType;
  discountValue: number;
}

@Component({
  selector: 'be-billing-new',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="billing-workspace">
      <section class="entry-panel">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Search product, code, or barcode</mat-label>
            <input #productSearch matInput [(ngModel)]="productTerm" (ngModelChange)="searchProducts()" (keydown.enter)="addFirstProduct()" autocomplete="off">
          </mat-form-field>
          <button mat-icon-button type="button" title="Barcode mode" (click)="barcodeMode.set(!barcodeMode())"><mat-icon>barcode_scanner</mat-icon></button>
          <button mat-flat-button color="primary" type="button" (click)="addCustomItem()"><mat-icon>add</mat-icon>Custom</button>
        </div>

        @if (productMatches().length) {
          <div class="typeahead">
            @for (product of productMatches(); track product.productId + product.sku) {
              <button type="button" (click)="addProduct(product)">
                <strong>{{ product.name }}</strong>
                <span>{{ product.category }} | {{ product.stockQuantity }} {{ product.unit }} | Rs. {{ product.sellingPrice }}</span>
              </button>
            }
          </div>
        }

        <div class="shortcut-strip">
          <span><kbd>F2</kbd> Search</span>
          <span><kbd>F3</kbd> Barcode</span>
          <span><kbd>F4</kbd> Custom</span>
          <span><kbd>F5</kbd> Draft</span>
          <span><kbd>F6</kbd> Print</span>
          <span><kbd>F7</kbd> Confirm</span>
          <span><kbd>Esc</kbd> Cancel</span>
        </div>

        <div class="rows">
          <div class="row header">
            <span>Item</span><span>Unit</span><span>Qty</span><span>MRP</span><span>Price</span><span>Disc</span><span>Tax</span><span>Total</span><span></span>
          </div>
          @for (line of lines(); track line.key) {
            <div class="row" tabindex="0" (keydown.delete)="deleteLine(line.key)">
              <div class="item">
                <strong>{{ line.product.name }}</strong>
                <small>{{ line.product.sku }} {{ line.product.hsnSacCode ? '| HSN ' + line.product.hsnSacCode : '' }}</small>
                @if (line.product.requiresBatchSelection) {
                  <mat-form-field appearance="outline">
                    <mat-label>Batch / expiry</mat-label>
                    <mat-select [ngModel]="line.batch?.productVariantId" (ngModelChange)="selectBatch(line.key, $event)">
                      @for (batch of line.product.batches; track batch.productVariantId) {
                        <mat-option [value]="batch.productVariantId">{{ batch.batchName }} | {{ batch.stockQuantity }} | {{ batch.expiryDate || 'No expiry' }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
              </div>
              <span>{{ line.product.unit }}</span>
              <input type="number" min="0.01" step="0.01" [(ngModel)]="line.quantity" (ngModelChange)="lineChanged()">
              <span>Rs. {{ line.product.mrp }}</span>
              <input type="number" min="0" step="0.01" [max]="line.product.mrp" [(ngModel)]="line.unitPrice" (ngModelChange)="lineChanged()">
              <div class="discount-cell">
                <select [(ngModel)]="line.discountType" (ngModelChange)="lineChanged()">
                  <option value="Percentage">%</option>
                  <option value="FlatAmount">Rs</option>
                </select>
                <input type="number" min="0" step="0.01" [(ngModel)]="line.discountValue" (ngModelChange)="lineChanged()">
              </div>
              <span>{{ line.product.taxRate }}%</span>
              <strong>Rs. {{ lineTotal(line) }}</strong>
              <button mat-icon-button type="button" title="Delete row" (click)="deleteLine(line.key)"><mat-icon>delete</mat-icon></button>
            </div>
          } @empty {
            <p class="empty">Scan, search, or press F4 to add the first row.</p>
          }
        </div>
      </section>

      <aside class="summary-panel">
        <section class="customer-box">
          <div class="section-head">
            <strong>Customer</strong>
            <button mat-icon-button type="button" title="Add customer" (click)="showInlineCustomer.set(!showInlineCustomer())"><mat-icon>person_add</mat-icon></button>
          </div>
          <mat-form-field appearance="outline">
            <mat-label>Name or phone</mat-label>
            <input matInput [(ngModel)]="customerTerm" (ngModelChange)="searchCustomers()" autocomplete="off">
          </mat-form-field>
          @if (customerMatches().length) {
            <div class="customer-results">
              @for (customer of customerMatches(); track customer.id) {
                <button type="button" (click)="selectCustomer(customer)">{{ customer.name }} <span>{{ customer.phone }}</span></button>
              }
            </div>
          }
          @if (showInlineCustomer()) {
            <div class="inline-customer">
              <input placeholder="Name" [(ngModel)]="newCustomer.name">
              <input placeholder="Phone" [(ngModel)]="newCustomer.phone">
              <input placeholder="Email" [(ngModel)]="newCustomer.email">
              <button mat-stroked-button type="button" (click)="addCustomer()">Add</button>
            </div>
          }
          <label class="walkin"><input type="checkbox" [(ngModel)]="walkIn"> Walk-in Customer</label>
          @if (selectedCustomer()) {
            <div class="customer-stats">
              <span>Loyalty: {{ selectedCustomer()!.loyaltyPoints }}</span>
              <span>Outstanding: Rs. {{ selectedCustomer()!.outstandingBalance }}</span>
              <span>Credit: Rs. {{ selectedCustomer()!.creditLimit }}</span>
            </div>
          }
        </section>

        <section class="totals">
          <div><span>Sub Total</span><strong>Rs. {{ quote()?.totals?.subTotal ?? localSubtotal() }}</strong></div>
          <div><span>Item Discounts</span><strong>Rs. {{ quote()?.totals?.itemDiscountTotal ?? 0 }}</strong></div>
          <div class="discount-row">
            <mat-form-field appearance="outline">
              <mat-label>Bill discount</mat-label>
              <mat-select [(ngModel)]="billDiscountType" (ngModelChange)="recalculate()">
                <mat-option [value]="null">None</mat-option>
                <mat-option value="Percentage">Percentage</mat-option>
                <mat-option value="FlatAmount">Flat Amount</mat-option>
              </mat-select>
            </mat-form-field>
            <input type="number" min="0" [(ngModel)]="billDiscountValue" (input)="recalculate()">
          </div>
          <div class="coupon-row">
            <input placeholder="Coupon" [(ngModel)]="couponCode">
            <button mat-stroked-button type="button" (click)="applyCoupon()">Apply</button>
          </div>
          @if (couponMessage()) { <p class="coupon-message">{{ couponMessage() }}</p> }
          <div><span>Bill Discount</span><strong>Rs. {{ quote()?.totals?.billDiscountAmount ?? 0 }}</strong></div>
          <div><span>Coupon Discount</span><strong>Rs. {{ quote()?.totals?.couponDiscountAmount ?? 0 }}</strong></div>
          <div><span>Taxable</span><strong>Rs. {{ quote()?.totals?.taxableAmount ?? 0 }}</strong></div>
          @for (tax of quote()?.taxBreakup ?? []; track tax.rate) {
            <div class="tax-line"><span>{{ tax.rate }}% GST</span><small>CGST {{ tax.cgst }} | SGST {{ tax.sgst }} | IGST {{ tax.igst }}</small><strong>Rs. {{ tax.totalTax }}</strong></div>
          }
          <div><span>Round off</span><strong>Rs. {{ quote()?.totals?.roundOff ?? 0 }}</strong></div>
          <div class="grand"><span>Grand Total</span><strong>Rs. {{ quote()?.totals?.grandTotal ?? localSubtotal() }}</strong></div>
        </section>

        <section class="payment-box">
          <mat-form-field appearance="outline">
            <mat-label>Payment mode</mat-label>
            <mat-select [(ngModel)]="paymentMode">
              <mat-option value="Cash">Cash</mat-option>
              <mat-option value="Card">Card</mat-option>
              <mat-option value="UPI">UPI</mat-option>
              <mat-option value="Credit">Credit</mat-option>
              <mat-option value="Split">Split</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Amount tendered</mat-label>
            <input matInput type="number" min="0" [(ngModel)]="amountTendered" (ngModelChange)="recalculate()">
          </mat-form-field>
          @if (paymentMode === 'UPI' || paymentMode === 'Card') {
            <mat-form-field appearance="outline">
              <mat-label>{{ paymentMode === 'UPI' ? 'UPI ref' : 'Card last 4 digits' }}</mat-label>
              <input matInput [(ngModel)]="paymentReference">
            </mat-form-field>
          }
          <div class="change"><span>Change</span><strong>Rs. {{ changeDue() }}</strong></div>
        </section>

        <div class="actions">
          <button mat-stroked-button type="button" (click)="save(false)"><mat-icon>save</mat-icon>Draft</button>
          <button mat-flat-button color="primary" type="button" (click)="save(true, true)"><mat-icon>print</mat-icon>Confirm & Print</button>
          <button mat-flat-button type="button" (click)="save(true)"><mat-icon>check_circle</mat-icon>Confirm</button>
          <button mat-button type="button" (click)="cancel()"><mat-icon>close</mat-icon>Cancel</button>
        </div>
      </aside>
    </section>
  `,
  styles: [`
    .billing-workspace { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 14px; padding: 14px; height: calc(100vh - 64px); overflow: hidden; }
    .entry-panel, .summary-panel { background: #fff; border: 1px solid #dfe5ec; border-radius: 8px; min-width: 0; overflow: auto; }
    .entry-panel { padding: 14px; }
    .summary-panel { padding: 14px; display: grid; align-content: start; gap: 14px; }
    .toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 44px auto; gap: 8px; align-items: start; }
    .search { width: 100%; }
    .typeahead, .customer-results { display: grid; gap: 4px; border: 1px solid #d8dee8; border-radius: 6px; padding: 6px; margin-top: -10px; background: #fbfcfe; }
    .typeahead button, .customer-results button { display: flex; justify-content: space-between; gap: 12px; border: 0; background: transparent; padding: 8px; text-align: left; cursor: pointer; }
    .typeahead span, .customer-results span { color: #667085; font-size: 12px; }
    .shortcut-strip { display: flex; flex-wrap: wrap; gap: 12px; color: #667085; font-size: 12px; margin: 6px 0 12px; }
    kbd { border: 1px solid #c7ced8; border-bottom-width: 2px; border-radius: 4px; padding: 1px 5px; color: #222; background: #f8fafc; }
    .rows { display: grid; gap: 6px; }
    .row { display: grid; grid-template-columns: minmax(220px, 1.5fr) 60px 70px 80px 92px 122px 58px 90px 40px; gap: 8px; align-items: center; border: 1px solid #e4e8ef; border-radius: 6px; padding: 8px; }
    .row.header { background: #f5f7fa; font-size: 12px; font-weight: 700; color: #4b5565; }
    .item { display: grid; gap: 2px; }
    .item small { color: #667085; }
    .item mat-form-field { margin-top: 4px; width: 100%; }
    input, select { width: 100%; min-height: 34px; border: 1px solid #cfd6e1; border-radius: 5px; padding: 0 8px; box-sizing: border-box; }
    .discount-cell { display: grid; grid-template-columns: 46px 1fr; gap: 4px; }
    .empty { color: #667085; text-align: center; padding: 40px; border: 1px dashed #cbd5e1; border-radius: 8px; }
    .section-head, .totals div, .change { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .customer-box, .totals, .payment-box { display: grid; gap: 8px; }
    .inline-customer { display: grid; grid-template-columns: 1fr 110px 1fr auto; gap: 6px; }
    .walkin { color: #4b5565; font-size: 13px; }
    .customer-stats { display: grid; gap: 3px; font-size: 12px; color: #667085; background: #f8fafc; border-radius: 6px; padding: 8px; }
    .discount-row, .coupon-row { display: grid !important; grid-template-columns: 1fr 110px; gap: 8px; align-items: start; }
    .coupon-message { margin: 0; color: #6941c6; font-size: 12px; }
    .tax-line { display: grid !important; grid-template-columns: auto 1fr auto; align-items: center; font-size: 12px; color: #667085; }
    .grand { margin-top: 8px; padding-top: 10px; border-top: 1px solid #dfe5ec; font-size: 22px; }
    .grand strong { color: #0f766e; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    @media (max-width: 1100px) { .billing-workspace { grid-template-columns: 1fr; height: auto; } .row { grid-template-columns: 1fr 52px 60px 70px 80px 110px 50px 80px 36px; } }
    @media print { .billing-workspace { display: none; } }
  `]
})
export class BillingNewComponent {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  @ViewChild('productSearch') productSearch?: ElementRef<HTMLInputElement>;

  readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly lines = signal<BillLine[]>([]);
  readonly productMatches = signal<ProductSearchResultDto[]>([]);
  readonly customerMatches = signal<CustomerSearchResultDto[]>([]);
  readonly selectedCustomer = signal<CustomerSearchResultDto | null>(null);
  readonly quote = signal<BillQuoteDto | null>(null);
  readonly barcodeMode = signal(false);
  readonly showInlineCustomer = signal(false);
  readonly couponMessage = signal('');
  productTerm = '';
  customerTerm = 'Walk-in Customer';
  walkIn = true;
  newCustomer = { name: '', phone: '', email: '' };
  billDiscountType: DiscountValueType | null = null;
  billDiscountValue = 0;
  couponCode = '';
  paymentMode: PaymentMethod = 'Cash';
  paymentReference = '';
  amountTendered = 0;
  private barcodeBuffer = '';
  private lastKeyTime = 0;

  readonly localSubtotal = computed(() => this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  readonly changeDue = computed(() => Math.max(0, this.amountTendered - (this.quote()?.totals.grandTotal ?? this.localSubtotal())));

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.key === 'F2') { event.preventDefault(); this.productSearch?.nativeElement.focus(); }
    if (event.key === 'F3') { event.preventDefault(); this.barcodeMode.set(!this.barcodeMode()); this.productSearch?.nativeElement.focus(); }
    if (event.key === 'F4') { event.preventDefault(); this.addCustomItem(); }
    if (event.key === 'F5') { event.preventDefault(); this.save(false); }
    if (event.key === 'F6') { event.preventDefault(); this.save(true, true); }
    if (event.key === 'F7') { event.preventDefault(); this.save(true); }
    if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
    this.captureBarcode(event);
  }

  searchProducts(): void {
    const term = this.productTerm.trim();
    if (term.length < 2) { this.productMatches.set([]); return; }
    this.billing.searchProducts(this.shopId(), term).subscribe(products => this.productMatches.set(products));
  }

  addFirstProduct(): void {
    const product = this.productMatches()[0];
    if (product) this.addProduct(product);
  }

  addProduct(product: ProductSearchResultDto): void {
    this.lines.update(lines => [...lines, {
      key: crypto.randomUUID(),
      product,
      batch: product.requiresBatchSelection ? product.batches[0] ?? null : null,
      quantity: 1,
      unitPrice: product.requiresBatchSelection && product.batches[0] ? product.batches[0].sellingPrice : product.sellingPrice,
      discountType: 'Percentage',
      discountValue: 0
    }]);
    this.productTerm = '';
    this.productMatches.set([]);
    this.recalculate();
  }

  addCustomItem(): void {
    this.addProduct({
      productId: '70000000-0000-0000-0000-000000000001',
      sku: `CUSTOM-${this.lines().length + 1}`,
      name: 'Custom Item',
      category: 'Custom',
      unit: 'pc',
      stockQuantity: 0,
      mrp: 0,
      sellingPrice: 0,
      taxRate: 0,
      maxDiscountPercent: 100,
      requiresBatchSelection: false,
      batches: []
    });
  }

  selectBatch(key: string, batchId: string): void {
    this.lines.update(lines => lines.map(line => {
      if (line.key !== key) return line;
      const batch = line.product.batches.find(x => x.productVariantId === batchId) ?? null;
      return { ...line, batch, unitPrice: batch?.sellingPrice ?? line.unitPrice };
    }));
    this.recalculate();
  }

  deleteLine(key: string): void {
    this.lines.update(lines => lines.filter(line => line.key !== key));
    this.recalculate();
  }

  lineChanged(): void {
    this.lines.update(lines => [...lines]);
    this.recalculate();
  }

  lineTotal(line: BillLine): number {
    const gross = line.quantity * line.unitPrice;
    const discount = line.discountType === 'Percentage' ? gross * line.discountValue / 100 : line.discountValue;
    return Math.round((gross - discount) * (1 + line.product.taxRate / 100));
  }

  searchCustomers(): void {
    const term = this.customerTerm.trim();
    if (term.length < 2) { this.customerMatches.set([]); return; }
    this.billing.searchCustomers(this.shopId(), term).subscribe(customers => this.customerMatches.set(customers));
  }

  selectCustomer(customer: CustomerSearchResultDto): void {
    this.selectedCustomer.set(customer);
    this.customerTerm = customer.name;
    this.walkIn = false;
    this.customerMatches.set([]);
  }

  addCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.phone) return;
    this.billing.addCustomer(this.shopId(), this.newCustomer.name, this.newCustomer.phone, this.newCustomer.email).subscribe(customer => {
      this.selectCustomer(customer);
      this.showInlineCustomer.set(false);
      this.newCustomer = { name: '', phone: '', email: '' };
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) return;
    this.billing.validateCoupon(this.shopId(), this.couponCode.trim().toUpperCase(), this.quote()?.totals.taxableAmount ?? this.localSubtotal()).subscribe(result => {
      this.couponMessage.set(result.isValid ? `Coupon applied: Rs. ${result.discountAmount}` : result.message ?? 'Coupon not valid');
      if (result.isValid) this.recalculate();
    });
  }

  recalculate(): void {
    if (!this.lines().length) { this.quote.set(null); return; }
    this.billing.quote({
      shopId: this.shopId(),
      customerId: this.walkIn ? null : this.selectedCustomer()?.id,
      items: this.payloadItems(),
      billDiscountType: this.billDiscountType,
      billDiscountValue: this.billDiscountValue || 0,
      couponCode: this.couponCode || null,
      isInterstate: false
    }).subscribe(quote => this.quote.set(quote));
  }

  save(confirm: boolean, print = false): void {
    if (!this.lines().length) return;
    const total = this.quote()?.totals.grandTotal ?? this.localSubtotal();
    const paymentAmount = this.paymentMode === 'Credit' ? 0 : this.amountTendered || total;
    this.billing.createSale({
      shopId: this.shopId(),
      customerId: this.walkIn ? null : this.selectedCustomer()?.id,
      walkInCustomerName: this.walkIn ? this.customerTerm : null,
      items: this.payloadItems(),
      billDiscountType: this.billDiscountType,
      billDiscountValue: this.billDiscountValue || 0,
      couponCode: this.couponCode || null,
      payments: [{ method: this.paymentMode, amount: paymentAmount, referenceNumber: this.paymentReference || null, details: null }],
      confirm,
      notes: null
    }).subscribe(result => {
      if (print) this.print(result, '80');
      this.cancel();
    });
  }

  print(result: SaleInvoiceDetailDto, mode: 'a4' | '80' | '58'): void {
    this.billing.printInvoice(result.invoice.id).subscribe(print => {
      const html = mode === 'a4' ? print.a4Html : mode === '80' ? print.thermal80Html : print.thermal58Html;
      const popup = window.open('', '_blank', 'width=900,height=700');
      popup?.document.write(html);
      popup?.document.close();
      popup?.print();
    });
  }

  cancel(): void {
    this.lines.set([]);
    this.quote.set(null);
    this.productTerm = '';
    this.couponCode = '';
    this.couponMessage.set('');
    this.amountTendered = 0;
  }

  private payloadItems() {
    return this.lines().map(line => ({
      productId: line.product.productId,
      productVariantId: line.batch?.productVariantId ?? line.product.productVariantId ?? null,
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      discountType: line.discountValue > 0 ? line.discountType : null,
      discountValue: Number(line.discountValue) || 0,
      taxRate: line.product.taxRate
    }));
  }

  private captureBarcode(event: KeyboardEvent): void {
    if (!this.barcodeMode() || event.key.length !== 1 && event.key !== 'Enter') return;
    const now = Date.now();
    if (now - this.lastKeyTime > 80) this.barcodeBuffer = '';
    this.lastKeyTime = now;
    if (event.key === 'Enter') {
      const code = this.barcodeBuffer;
      this.barcodeBuffer = '';
      if (code.length >= 4) {
        this.productTerm = code;
        this.searchProducts();
        setTimeout(() => this.addFirstProduct(), 180);
      }
      return;
    }
    this.barcodeBuffer += event.key;
  }
}
