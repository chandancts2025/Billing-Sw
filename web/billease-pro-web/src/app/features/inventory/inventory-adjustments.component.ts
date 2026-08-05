import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { CreateInventoryAdjustmentLineRequest, InventoryAdjustmentDto, InventoryAlertDto, InventoryProductListItemDto, SaveUnitConversionRequest, StockLedgerRowDto, UnitConversionDto } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory-adjustments',
  standalone: true,
  imports: [FormsModule, SlicePipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header><strong>Stock Control</strong><span>Adjustments, approvals, PDF vouchers, ledger, unit conversion, and inventory alerts.</span></header>
      <section class="layout">
        <form class="panel" (ngSubmit)="createAdjustment()">
          <h3>New Adjustment</h3>
          <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select [(ngModel)]="adjustmentType" name="adjustmentType"><mat-option value="Damage">Damage</mat-option><mat-option value="Theft">Theft</mat-option><mat-option value="Found">Found</mat-option><mat-option value="Correction">Correction</mat-option><mat-option value="OpeningBalance">Opening Balance</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Reason</mat-label><input matInput required [(ngModel)]="reason" name="reason"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Reference</mat-label><input matInput [(ngModel)]="referenceNumber" name="referenceNumber"></mat-form-field>
          <div class="line-form">
            <mat-form-field appearance="outline"><mat-label>Product</mat-label><mat-select [(ngModel)]="line.productId" name="product">@for (p of products(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }</mat-select></mat-form-field>
            <input type="number" placeholder="New Qty" [(ngModel)]="line.newQuantity" name="newQuantity">
            <input placeholder="Line reason" [(ngModel)]="line.reason" name="lineReason">
            <button mat-stroked-button type="button" (click)="addLine()">Add</button>
          </div>
          @for (item of lines(); track item.productId) { <div class="row"><span>{{ productName(item.productId) }}</span><strong>{{ item.newQuantity }}</strong></div> }
          <button mat-flat-button color="primary" type="submit"><mat-icon>save</mat-icon>Create Approval Request</button>
        </form>

        <section class="panel">
          <h3>Adjustments</h3>
          @for (adj of adjustments(); track adj.id) {
            <div class="row"><span>{{ adj.adjustmentNumber }} | {{ adj.adjustmentType }} | {{ adj.status }}</span><strong>{{ adj.netQuantityChange }}</strong><button mat-icon-button type="button" (click)="approve(adj)"><mat-icon>done</mat-icon></button><button mat-icon-button type="button" (click)="voucher(adj)"><mat-icon>picture_as_pdf</mat-icon></button></div>
          }
        </section>
      </section>

      <section class="layout">
        <section class="panel">
          <h3>Stock Ledger</h3>
          <div class="line-form compact">
            <mat-form-field appearance="outline"><mat-label>Product</mat-label><mat-select [(ngModel)]="ledgerProductId" name="ledgerProduct">@for (p of products(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }</mat-select></mat-form-field>
            <button mat-stroked-button type="button" (click)="loadLedger()">Load</button>
          </div>
          @for (row of ledger(); track row.date + row.referenceType) { <div class="row"><span>{{ row.date | slice:0:10 }} {{ row.movementType }} {{ row.direction }}</span><strong>In {{ row.inQuantity }} / Out {{ row.outQuantity }} / Bal {{ row.runningBalance }}</strong></div> }
        </section>

        <section class="panel">
          <h3>Unit Conversions</h3>
          <div class="line-form compact">
            <input placeholder="Base Unit Id" [(ngModel)]="conversion.baseUnitId" name="baseUnitId">
            <input placeholder="Alternate Unit Id" [(ngModel)]="conversion.alternateUnitId" name="alternateUnitId">
            <input type="number" placeholder="Factor" [(ngModel)]="conversion.factor" name="factor">
            <button mat-stroked-button type="button" (click)="saveConversion()">Save</button>
          </div>
          @for (row of conversions(); track row.id) { <div class="row"><span>{{ row.baseUnit }} -> {{ row.alternateUnit }}</span><strong>{{ row.factor }}</strong></div> }
        </section>
      </section>

      <section class="panel">
        <h3>Alerts</h3>
        @for (alert of alerts(); track alert.id) { <div class="row"><span>{{ alert.severity }} | {{ alert.title }}</span><strong>{{ alert.createdAt | slice:0:10 }}</strong></div> }
      </section>
    </section>
  `,
  styles: [`.page{padding:14px;display:grid;gap:14px}header{display:grid;gap:3px}header strong{font-size:22px}header span{color:#667085}.layout{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{background:white;border:1px solid #dfe5ec;border-radius:8px;padding:14px;display:grid;gap:10px;align-content:start}.line-form{display:grid;grid-template-columns:1fr 110px 1fr auto;gap:8px;align-items:start}.line-form.compact{grid-template-columns:1fr 1fr 100px auto}.row{display:grid;grid-template-columns:1fr auto 40px 40px;gap:8px;align-items:center;border-top:1px solid #edf1f6;padding:8px 0}input{min-height:36px;border:1px solid #cfd6e1;border-radius:5px;padding:0 8px}@media(max-width:980px){.layout,.line-form,.line-form.compact,.row{grid-template-columns:1fr}}`]
})
export class InventoryAdjustmentsComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly products = signal<InventoryProductListItemDto[]>([]);
  readonly adjustments = signal<InventoryAdjustmentDto[]>([]);
  readonly lines = signal<CreateInventoryAdjustmentLineRequest[]>([]);
  readonly ledger = signal<StockLedgerRowDto[]>([]);
  readonly conversions = signal<UnitConversionDto[]>([]);
  readonly alerts = signal<InventoryAlertDto[]>([]);
  adjustmentType = 'Correction' as const;
  reason = '';
  referenceNumber = '';
  ledgerProductId = '';
  line: CreateInventoryAdjustmentLineRequest = { productId: '', newQuantity: 0, reason: null };
  conversion: SaveUnitConversionRequest = { shopId: '', baseUnitId: '', alternateUnitId: '', factor: 1, isActive: true };
  constructor() { this.inventory.products(this.shopId()).subscribe(x => { this.products.set(x); this.ledgerProductId = x[0]?.id ?? ''; }); this.load(); }
  load(): void { this.inventory.adjustments(this.shopId()).subscribe(x => this.adjustments.set(x)); this.inventory.unitConversions(this.shopId()).subscribe(x => this.conversions.set(x)); this.inventory.alerts(this.shopId()).subscribe(x => this.alerts.set(x)); }
  addLine(): void { if (!this.line.productId) return; this.lines.update(x => [...x, { ...this.line }]); this.line = { productId: '', newQuantity: 0, reason: null }; }
  createAdjustment(): void { this.inventory.createAdjustment({ shopId: this.shopId(), adjustmentType: this.adjustmentType, reason: this.reason, referenceNumber: this.referenceNumber || null, notes: null, items: this.lines() }).subscribe(() => { this.lines.set([]); this.load(); }); }
  approve(adj: InventoryAdjustmentDto): void { this.inventory.approveAdjustment(adj.id).subscribe(() => this.load()); }
  voucher(adj: InventoryAdjustmentDto): void { this.inventory.adjustmentVoucher(adj.id).subscribe(v => { const w = window.open('', '_blank', 'width=900,height=700'); w?.document.write(v.html); w?.document.close(); w?.print(); }); }
  loadLedger(): void { if (this.ledgerProductId) this.inventory.stockLedger(this.shopId(), this.ledgerProductId).subscribe(x => this.ledger.set(x)); }
  saveConversion(): void { this.inventory.saveUnitConversion({ ...this.conversion, shopId: this.shopId() }).subscribe(() => this.load()); }
  productName(id: string): string { return this.products().find(x => x.id === id)?.name ?? id; }
}
