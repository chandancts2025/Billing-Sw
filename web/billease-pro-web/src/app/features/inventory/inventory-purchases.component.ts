import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { CreateGrnItemRequest, CreatePurchaseOrderItemRequest, InventoryLookupDto, InventoryProductListItemDto, PurchaseOrderDto } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory-purchases',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header><strong>Purchases</strong><span>Create PO, receive GRN, capture batch/expiry, approve stock, and review mismatches.</span></header>
      <section class="layout">
        <form class="panel" (ngSubmit)="createPo()">
          <h3>Purchase Order</h3>
          <mat-form-field appearance="outline"><mat-label>Supplier</mat-label><mat-select [(ngModel)]="supplierId" name="supplierId">@for (s of lookup()?.suppliers ?? []; track s.id) { <mat-option [value]="s.id">{{ s.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Expected Date</mat-label><input matInput type="date" [(ngModel)]="expectedDate" name="expectedDate"></mat-form-field>
          <div class="line-form">
            <mat-form-field appearance="outline"><mat-label>Product</mat-label><mat-select [(ngModel)]="poLine.productId" name="poProduct">@for (p of products(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }</mat-select></mat-form-field>
            <input type="number" placeholder="Qty" [(ngModel)]="poLine.expectedQuantity" name="poQty">
            <input type="number" placeholder="Rate" [(ngModel)]="poLine.unitCost" name="poRate">
            <input type="number" placeholder="Tax %" [(ngModel)]="poLine.taxRate" name="poTax">
            <button mat-stroked-button type="button" (click)="addPoLine()">Add</button>
          </div>
          @for (line of poItems(); track line.productId) { <div class="row"><span>{{ productName(line.productId) }}</span><strong>{{ line.expectedQuantity }} x {{ line.unitCost }}</strong></div> }
          <button mat-flat-button color="primary" type="submit"><mat-icon>shopping_cart</mat-icon>Create PO</button>
        </form>

        <section class="panel">
          <h3>Orders</h3>
          @for (order of orders(); track order.id) {
            <button class="order" type="button" (click)="selectOrder(order)"><strong>{{ order.purchaseOrderNumber }}</strong><span>{{ order.supplierName }} | {{ order.status }} | Rs. {{ order.grandTotal }}</span></button>
          }
        </section>
      </section>

      <form class="panel" (ngSubmit)="createGrn()">
        <h3>Receive GRN</h3>
        <div class="grn-head">
          <mat-form-field appearance="outline"><mat-label>Supplier Invoice</mat-label><input matInput [(ngModel)]="supplierInvoiceNumber" name="supplierInvoiceNumber"></mat-form-field>
          <button mat-flat-button color="primary" type="submit"><mat-icon>receipt</mat-icon>Create GRN</button>
          @if (lastGrnId()) { <button mat-stroked-button type="button" (click)="approveGrn()"><mat-icon>done_all</mat-icon>Approve & Update Stock</button> }
        </div>
        @for (line of grnItems(); track line.productId) {
          <div class="grn-line">
            <strong>{{ productName(line.productId) }}</strong>
            <input type="number" placeholder="Received" [(ngModel)]="line.quantityReceived" [name]="'received' + line.productId">
            <input placeholder="Batch" [(ngModel)]="line.batchNo" [name]="'batch' + line.productId">
            <input type="date" [(ngModel)]="line.expiryDate" [name]="'expiry' + line.productId">
            <span>Expected {{ line.expectedQuantity }}</span>
          </div>
        }
        @if (message()) { <p>{{ message() }}</p> }
      </form>
    </section>
  `,
  styles: [`.page{padding:14px;display:grid;gap:14px}header{display:grid;gap:3px}header strong{font-size:22px}header span,p{color:#667085}.layout{display:grid;grid-template-columns:1.3fr .7fr;gap:14px}.panel{background:white;border:1px solid #dfe5ec;border-radius:8px;padding:14px;display:grid;gap:10px;align-content:start}.line-form{display:grid;grid-template-columns:1fr 80px 90px 80px auto;gap:8px;align-items:start}.grn-head{display:grid;grid-template-columns:minmax(180px,1fr) auto auto;gap:8px;align-items:start}.grn-line,.row{display:grid;grid-template-columns:1fr 110px 130px 150px 100px;gap:8px;align-items:center;border-top:1px solid #edf1f6;padding:8px 0}.order{border:1px solid #e4e8ef;border-radius:6px;background:white;padding:10px;display:grid;text-align:left;gap:3px}.order span{color:#667085;font-size:12px}input{min-height:36px;border:1px solid #cfd6e1;border-radius:5px;padding:0 8px}@media(max-width:980px){.layout,.line-form,.grn-head,.grn-line,.row{grid-template-columns:1fr}}`]
})
export class InventoryPurchasesComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly lookup = signal<InventoryLookupDto | null>(null);
  readonly products = signal<InventoryProductListItemDto[]>([]);
  readonly orders = signal<PurchaseOrderDto[]>([]);
  readonly poItems = signal<CreatePurchaseOrderItemRequest[]>([]);
  readonly grnItems = signal<CreateGrnItemRequest[]>([]);
  readonly lastGrnId = signal('');
  readonly message = signal('');
  supplierId = '';
  expectedDate = '';
  supplierInvoiceNumber = '';
  selectedOrder: PurchaseOrderDto | null = null;
  poLine: CreatePurchaseOrderItemRequest = { productId: '', expectedQuantity: 1, unitCost: 0, taxRate: 0 };
  constructor() { this.inventory.lookup(this.shopId()).subscribe(x => { this.lookup.set(x); this.supplierId = x.suppliers[0]?.id ?? ''; }); this.inventory.products(this.shopId()).subscribe(x => this.products.set(x)); this.loadOrders(); }
  loadOrders(): void { this.inventory.purchaseOrders(this.shopId()).subscribe(x => this.orders.set(x)); }
  addPoLine(): void { if (!this.poLine.productId) return; this.poItems.update(x => [...x, { ...this.poLine }]); this.poLine = { productId: '', expectedQuantity: 1, unitCost: 0, taxRate: 0 }; }
  createPo(): void { this.inventory.createPurchaseOrder({ shopId: this.shopId(), supplierId: this.supplierId, expectedDate: this.expectedDate || null, notes: null, items: this.poItems() }).subscribe(order => { this.poItems.set([]); this.loadOrders(); this.selectOrder(order); }); }
  selectOrder(order: PurchaseOrderDto): void { this.selectedOrder = order; this.supplierId = order.supplierId; this.grnItems.set(order.items.map(x => ({ productId: x.productId, productVariantId: x.productVariantId, expectedQuantity: x.expectedQuantity, quantityReceived: x.expectedQuantity - x.receivedQuantity, quantityRejected: 0, unitCost: x.unitCost, rate: x.unitCost, taxRate: x.taxRate, batchNo: null, manufacturingDate: null, expiryDate: null }))); }
  createGrn(): void { this.inventory.createGrn({ shopId: this.shopId(), purchaseOrderId: this.selectedOrder?.id ?? null, supplierId: this.supplierId, supplierInvoiceNumber: this.supplierInvoiceNumber, invoiceDate: null, items: this.grnItems() }).subscribe(grn => { this.lastGrnId.set(grn.id); this.message.set(`${grn.grnNumber} created. ${grn.mismatchSummary || ''}`); }); }
  approveGrn(): void { this.inventory.approveGrn(this.lastGrnId()).subscribe(grn => { this.message.set(`${grn.grnNumber} approved and stock updated.`); this.lastGrnId.set(''); this.loadOrders(); }); }
  productName(id: string): string { return this.products().find(x => x.id === id)?.name ?? id; }
}
