import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { SaveSupplierRequest, SupplierAnalysisDto, SupplierLedgerRowDto, SupplierSummaryDto } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory-suppliers',
  standalone: true,
  imports: [FormsModule, SlicePipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="page">
      <header><strong>Suppliers</strong><span>Supplier profile, opening balance, ledger, outstanding, and purchase analysis.</span></header>
      <section class="layout">
        <aside class="list">
          @for (supplier of suppliers(); track supplier.id) {
            <button type="button" (click)="select(supplier)"><strong>{{ supplier.name }}</strong><span>Outstanding Rs. {{ supplier.outstandingBalance }}</span></button>
          }
        </aside>
        <form class="form" (ngSubmit)="save()">
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput required [(ngModel)]="form.name" name="name"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Person</mat-label><input matInput [(ngModel)]="form.contactPerson" name="contactPerson"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput [(ngModel)]="form.phone" name="phone"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput [(ngModel)]="form.email" name="email"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>GSTIN</mat-label><input matInput [(ngModel)]="form.taxRegistrationNumber" name="taxRegistrationNumber"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>PAN</mat-label><input matInput [(ngModel)]="form.pan" name="pan"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Credit Days</mat-label><input matInput type="number" [(ngModel)]="form.creditDays" name="creditDays"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Opening Balance</mat-label><input matInput type="number" [(ngModel)]="form.openingBalance" name="openingBalance"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Payment Terms</mat-label><input matInput [(ngModel)]="form.paymentTerms" name="paymentTerms"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Address</mat-label><input matInput [(ngModel)]="form.address" name="address"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Bank Details</mat-label><input matInput [(ngModel)]="form.bankDetails" name="bankDetails"></mat-form-field>
          </div>
          <button mat-flat-button color="primary" type="submit"><mat-icon>save</mat-icon>Save Supplier</button>
        </form>
      </section>
      <section class="tables">
        <article><h3>Ledger</h3>@for (row of ledger(); track row.date + row.reference) { <div class="row"><span>{{ row.date | slice:0:10 }} {{ row.type }}</span><strong>Dr {{ row.debit }} / Cr {{ row.credit }} / Bal {{ row.balanceAfter }}</strong></div> } @empty { <p>Select a supplier.</p> }</article>
        <article><h3>Analysis</h3>@for (row of analysis(); track row.supplierId) { <div class="row"><span>{{ row.supplierName }}</span><strong>Purchase {{ row.purchaseTotal }} | Outstanding {{ row.outstanding }}</strong></div> }</article>
      </section>
    </section>
  `,
  styles: [`.page{padding:14px;display:grid;gap:14px}header{display:grid;gap:3px}header strong{font-size:22px}header span,p{color:#667085}.layout{display:grid;grid-template-columns:320px 1fr;gap:14px}.list,.form,article{background:white;border:1px solid #dfe5ec;border-radius:8px;padding:14px}.list{display:grid;gap:8px;align-content:start}.list button{display:grid;text-align:left;gap:3px;border:1px solid #e4e8ef;background:white;border-radius:6px;padding:10px}.list span{color:#667085;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:10px}.tables{display:grid;grid-template-columns:1fr 1fr;gap:14px}.row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #edf1f6;padding:8px 0}@media(max-width:900px){.layout,.grid,.tables{grid-template-columns:1fr}}`]
})
export class InventorySuppliersComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly suppliers = signal<SupplierSummaryDto[]>([]);
  readonly ledger = signal<SupplierLedgerRowDto[]>([]);
  readonly analysis = signal<SupplierAnalysisDto[]>([]);
  form: SaveSupplierRequest = this.blank();
  constructor() { this.load(); }
  load(): void { this.inventory.suppliers(this.shopId()).subscribe(x => this.suppliers.set(x)); this.inventory.supplierAnalysis(this.shopId()).subscribe(x => this.analysis.set(x)); }
  select(supplier: SupplierSummaryDto): void { this.form = { ...this.blank(), id: supplier.id, name: supplier.name, phone: supplier.phone, email: supplier.email, openingBalance: supplier.outstandingBalance }; this.inventory.supplierLedger(supplier.id).subscribe(x => this.ledger.set(x)); }
  save(): void { this.inventory.saveSupplier({ ...this.form, shopId: this.shopId() }).subscribe(() => { this.form = this.blank(); this.load(); }); }
  private blank(): SaveSupplierRequest { return { shopId: this.shopId(), name: '', contactPerson: null, phone: null, email: null, taxRegistrationNumber: null, pan: null, address: null, bankDetails: null, creditDays: 0, paymentTerms: null, openingBalance: 0 }; }
}
