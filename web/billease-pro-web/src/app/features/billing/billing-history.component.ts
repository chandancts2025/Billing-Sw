import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { BillingService } from './billing.service';
import { BillHistoryRowDto, PaymentMethod, PrintInvoiceDto, SalesInvoiceStatus } from './billing.models';

@Component({
  selector: 'be-billing-history',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="history-page">
      <header class="page-head">
        <div>
          <strong>Bill History</strong>
          <span>{{ rows().length }} invoices loaded</span>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="load()"><mat-icon>refresh</mat-icon>Refresh</button>
      </header>

      <section class="filters">
        <mat-form-field appearance="outline">
          <mat-label>From</mat-label>
          <input matInput type="date" [(ngModel)]="filter.from">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To</mat-label>
          <input matInput type="date" [(ngModel)]="filter.to">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Payment</mat-label>
          <mat-select [(ngModel)]="filter.paymentMode">
            <mat-option value="">All</mat-option>
            <mat-option value="Cash">Cash</mat-option>
            <mat-option value="Card">Card</mat-option>
            <mat-option value="UPI">UPI</mat-option>
            <mat-option value="Credit">Credit</mat-option>
            <mat-option value="Split">Split</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filter.status">
            <mat-option value="">All</mat-option>
            <mat-option value="Draft">Draft</mat-option>
            <mat-option value="Confirmed">Confirmed</mat-option>
            <mat-option value="Cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="search">
          <mat-label>Bill number</mat-label>
          <input matInput [(ngModel)]="filter.search" (keydown.enter)="load()" autocomplete="off">
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="load()"><mat-icon>filter_alt</mat-icon>Apply</button>
      </section>

      <section class="export-bar">
        <button mat-stroked-button type="button" (click)="exportExcel()"><mat-icon>download</mat-icon>Excel</button>
        <button mat-stroked-button type="button" (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon>PDF</button>
      </section>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bill No</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>{{ row.billNo }}</td>
                <td>{{ formatDate(row.date) }}</td>
                <td>{{ row.customer }}</td>
                <td>{{ row.itemsCount }}</td>
                <td>Rs. {{ row.total }}</td>
                <td>{{ row.payment || 'Pending' }}</td>
                <td><span class="status" [class.cancelled]="row.status === 'Cancelled'">{{ row.status }}</span></td>
                <td class="actions">
                  <button mat-icon-button type="button" title="View invoice" (click)="view(row)"><mat-icon>visibility</mat-icon></button>
                  <button mat-icon-button type="button" title="Alter / Edit Bill" (click)="alterBill(row)"><mat-icon>edit_note</mat-icon></button>
                  <button mat-icon-button type="button" title="Reprint" (click)="reprint(row)"><mat-icon>print</mat-icon></button>
                  <button mat-icon-button type="button" title="Return" (click)="returnBill(row)"><mat-icon>assignment_return</mat-icon></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">No bills match the current filters.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (selectedPrint()) {
        <aside class="preview">
          <div class="preview-head">
            <strong>{{ selectedPrint()!.invoiceNumber }}</strong>
            <div>
              @if (selectedPrint()!.customerEmail) {
                <button mat-icon-button type="button" title="Email" (click)="emailBill(selectedPrint()!)"><mat-icon>mail</mat-icon></button>
              }
              <button mat-icon-button type="button" title="WhatsApp" (click)="shareWhatsApp(selectedPrint()!)"><mat-icon>chat</mat-icon></button>
              <button mat-icon-button type="button" title="Close" (click)="selectedPrint.set(null)"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <iframe title="Invoice preview" [srcdoc]="selectedPrint()!.a4Html"></iframe>
        </aside>
      }
    </section>
  `,
  styles: [`
    .history-page { display: grid; gap: 14px; padding: 14px; }
    .page-head, .export-bar, .preview-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .page-head div { display: grid; gap: 2px; }
    .page-head strong { font-size: 22px; }
    .page-head span { color: #667085; font-size: 13px; }
    .filters { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)) minmax(180px, 1.5fr) auto; gap: 10px; align-items: start; }
    .table-wrap, .preview { background: #fff; border: 1px solid #dfe5ec; border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 860px; }
    th, td { padding: 11px 12px; border-bottom: 1px solid #edf1f6; text-align: left; }
    th { background: #f7f9fc; font-size: 12px; color: #4b5565; }
    .actions { white-space: nowrap; }
    .status { display: inline-flex; padding: 3px 8px; border-radius: 999px; background: #e7f8f2; color: #047857; font-size: 12px; }
    .status.cancelled { background: #fee4e2; color: #b42318; }
    .empty { text-align: center; color: #667085; padding: 36px; }
    .preview { display: grid; gap: 8px; padding: 10px; }
    iframe { width: 100%; height: 560px; border: 1px solid #e4e8ef; border-radius: 6px; background: white; }
    @media (max-width: 980px) { .filters { grid-template-columns: 1fr 1fr; } }
  `]
})
export class BillingHistoryComponent {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';

  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly rows = signal<BillHistoryRowDto[]>([]);
  readonly selectedPrint = signal<PrintInvoiceDto | null>(null);
  readonly filter: { from: string; to: string; paymentMode: PaymentMethod | ''; status: SalesInvoiceStatus | ''; search: string } = {
    from: '',
    to: '',
    paymentMode: '',
    status: '',
    search: ''
  };

  constructor() {
    this.load();
  }

  load(): void {
    this.billing.history(this.shopId(), this.filter).subscribe(rows => this.rows.set(rows));
  }

  view(row: BillHistoryRowDto): void {
    this.billing.printInvoice(row.id).subscribe(print => this.selectedPrint.set(print));
  }

  reprint(row: BillHistoryRowDto): void {
    this.billing.printInvoice(row.id).subscribe(print => this.openPrint(print.a4Html));
  }

  alterBill(row: BillHistoryRowDto): void {
    void this.router.navigate(['/billing/new'], { queryParams: { alterInvoiceId: row.id } });
  }

  returnBill(row: BillHistoryRowDto): void {
    void this.router.navigate(['/billing/returns', row.id]);
  }

  exportExcel(): void {
    const csv = [
      ['Bill No', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status'],
      ...this.rows().map(row => [row.billNo, this.formatDate(row.date), row.customer, String(row.itemsCount), String(row.total), row.payment, row.status])
    ].map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
    this.download('billease-bill-history.csv', 'text/csv;charset=utf-8', csv);
  }

  exportPdf(): void {
    const rows = this.rows().map(row => `<tr><td>${row.billNo}</td><td>${this.formatDate(row.date)}</td><td>${row.customer}</td><td>${row.itemsCount}</td><td>${row.total}</td><td>${row.payment}</td><td>${row.status}</td></tr>`).join('');
    this.openPrint(`<html><head><title>Bill History</title><style>body{font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h2>Bill History</h2><table><thead><tr><th>Bill No</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  }

  emailBill(print: PrintInvoiceDto): void {
    const subject = encodeURIComponent(`Invoice ${print.invoiceNumber}`);
    const body = encodeURIComponent(`Please find your BillEase Pro invoice ${print.invoiceNumber}.`);
    window.location.href = `mailto:${print.customerEmail}?subject=${subject}&body=${body}`;
  }

  shareWhatsApp(print: PrintInvoiceDto): void {
    window.open(print.whatsAppUrl, '_blank', 'noopener');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  private openPrint(html: string): void {
    const popup = window.open('', '_blank', 'width=900,height=700');
    popup?.document.write(html);
    popup?.document.close();
    popup?.print();
  }

  private download(filename: string, type: string, content: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
