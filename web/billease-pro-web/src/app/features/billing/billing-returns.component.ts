import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { BillingService } from './billing.service';
import { SalesInvoiceItemDto, SalesReturnLookupDto } from './billing.models';

interface ReturnLine {
  item: SalesInvoiceItemDto;
  selected: boolean;
  quantity: number;
}

@Component({
  selector: 'be-billing-returns',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="returns-page">
      <header class="page-head">
        <div>
          <strong>Sales Return</strong>
          <span>Load an original bill, choose quantities, and generate a credit note.</span>
        </div>
      </header>

      <section class="lookup">
        <mat-form-field appearance="outline">
          <mat-label>Original bill number</mat-label>
          <input matInput [(ngModel)]="billNo" (keydown.enter)="findBill()" autocomplete="off">
        </mat-form-field>
        <button mat-flat-button color="primary" type="button" (click)="findBill()"><mat-icon>search</mat-icon>Find Bill</button>
      </section>

      @if (message()) {
        <p class="message" [class.error]="isError()">{{ message() }}</p>
      }

      @if (lookup()) {
        <section class="invoice-card">
          <div>
            <strong>{{ lookup()!.invoice.invoiceNumber }}</strong>
            <span>{{ formatDate(lookup()!.invoice.invoiceDate) }} | Total Rs. {{ lookup()!.invoice.grandTotal }}</span>
          </div>
          <span class="status">{{ lookup()!.invoice.status }}</span>
        </section>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th><th>Item</th><th>Sold Qty</th><th>Return Qty</th><th>Unit</th><th>Refund</th>
              </tr>
            </thead>
            <tbody>
              @for (line of returnLines(); track line.item.id) {
                <tr>
                  <td><mat-checkbox [(ngModel)]="line.selected" (change)="syncLines()"></mat-checkbox></td>
                  <td>{{ line.item.description }}</td>
                  <td>{{ line.item.quantity }}</td>
                  <td><input type="number" min="0" [max]="line.item.quantity" step="0.01" [(ngModel)]="line.quantity" (input)="syncLines()"></td>
                  <td>Rs. {{ line.item.unitPrice }}</td>
                  <td>Rs. {{ refundAmount(line) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <section class="return-form">
          <mat-form-field appearance="outline">
            <mat-label>Reason</mat-label>
            <mat-select [(ngModel)]="reason">
              <mat-option value="Defective">Defective</mat-option>
              <mat-option value="Wrong Item">Wrong Item</mat-option>
              <mat-option value="Customer Request">Customer Request</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Refund mode</mat-label>
            <mat-select [(ngModel)]="refundMode">
              <mat-option value="Cash">Cash</mat-option>
              <mat-option value="Original Payment Mode">Original Payment Mode</mat-option>
              <mat-option value="Credit to Account">Credit to Account</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="refund-total">
            <span>Refund Total</span>
            <strong>Rs. {{ refundTotal() }}</strong>
          </div>
          <button mat-flat-button color="primary" type="button" [disabled]="refundTotal() <= 0" (click)="createReturn()">
            <mat-icon>receipt_long</mat-icon>Generate Credit Note
          </button>
        </section>
      }
    </section>
  `,
  styles: [`
    .returns-page { display: grid; gap: 14px; padding: 14px; }
    .page-head div { display: grid; gap: 2px; }
    .page-head strong { font-size: 22px; }
    .page-head span { color: #667085; font-size: 13px; }
    .lookup { display: grid; grid-template-columns: minmax(220px, 420px) auto; gap: 10px; align-items: start; }
    .message { margin: 0; color: #047857; background: #ecfdf3; border: 1px solid #abefc6; border-radius: 6px; padding: 10px 12px; }
    .message.error { color: #b42318; background: #fff1f0; border-color: #fecdca; }
    .invoice-card, .return-form, .table-wrap { background: #fff; border: 1px solid #dfe5ec; border-radius: 8px; }
    .invoice-card { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px; }
    .invoice-card div { display: grid; gap: 2px; }
    .invoice-card span { color: #667085; font-size: 13px; }
    .status { color: #047857 !important; background: #e7f8f2; border-radius: 999px; padding: 4px 10px; }
    .table-wrap { overflow: auto; }
    table { width: 100%; min-width: 760px; border-collapse: collapse; }
    th, td { padding: 11px 12px; border-bottom: 1px solid #edf1f6; text-align: left; }
    th { background: #f7f9fc; font-size: 12px; color: #4b5565; }
    input { min-height: 34px; border: 1px solid #cfd6e1; border-radius: 5px; padding: 0 8px; box-sizing: border-box; max-width: 110px; }
    .return-form { display: grid; grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) minmax(130px, auto) auto; gap: 10px; align-items: start; padding: 14px; }
    .refund-total { display: grid; gap: 2px; padding: 6px 0; }
    .refund-total span { color: #667085; font-size: 12px; }
    .refund-total strong { color: #0f766e; font-size: 20px; }
    @media (max-width: 860px) { .lookup, .return-form { grid-template-columns: 1fr; } }
  `]
})
export class BillingReturnsComponent {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';

  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly lookup = signal<SalesReturnLookupDto | null>(null);
  readonly returnLines = signal<ReturnLine[]>([]);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly refundTotal = computed(() => this.returnLines().reduce((sum, line) => line.selected ? sum + this.refundAmount(line) : sum, 0));
  billNo = '';
  reason = 'Customer Request';
  refundMode = 'Original Payment Mode';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadById(id);
  }

  findBill(): void {
    const billNo = this.billNo.trim();
    if (!billNo) return;
    this.billing.findForReturn(this.shopId(), billNo).subscribe({
      next: lookup => this.applyLookup(lookup),
      error: () => this.showMessage('Bill not found.', true)
    });
  }

  loadById(id: string): void {
    this.billing.getForReturn(id).subscribe({
      next: lookup => this.applyLookup(lookup),
      error: () => this.showMessage('Bill not found.', true)
    });
  }

  syncLines(): void {
    this.returnLines.update(lines => lines.map(line => ({
      ...line,
      quantity: Math.max(0, Math.min(Number(line.quantity) || 0, line.item.quantity))
    })));
  }

  refundAmount(line: ReturnLine): number {
    if (!line.selected || line.quantity <= 0 || line.item.quantity <= 0) return 0;
    return Math.round((line.item.lineTotal / line.item.quantity) * line.quantity * 100) / 100;
  }

  createReturn(): void {
    const lookup = this.lookup();
    if (!lookup) return;
    const items = this.returnLines()
      .filter(line => line.selected && line.quantity > 0)
      .map(line => ({ salesInvoiceItemId: line.item.id, quantity: line.quantity, refundAmount: this.refundAmount(line) }));
    if (!items.length) return;
    this.billing.createReturn({ salesInvoiceId: lookup.invoice.id, items, reason: this.reason, refundMode: this.refundMode }).subscribe({
      next: result => this.showMessage(`Credit note ${result.creditNoteNumber} generated for Rs. ${result.refundAmount}.`, false),
      error: () => this.showMessage('Could not create the return. Check quantities and invoice status.', true)
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  private applyLookup(lookup: SalesReturnLookupDto): void {
    this.lookup.set(lookup);
    this.billNo = lookup.invoice.invoiceNumber;
    this.returnLines.set(lookup.items.map(item => ({ item, selected: false, quantity: 0 })));
    this.showMessage('', false);
  }

  private showMessage(text: string, error: boolean): void {
    this.message.set(text);
    this.isError.set(error);
  }
}
