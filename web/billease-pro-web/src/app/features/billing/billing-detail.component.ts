import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillingApiService } from '../../core/services/billing-api.service';
import { BillingService } from './billing.service';
import { PrintService } from '../../core/services/print.service';
import { PrintInvoiceDto } from './billing.models';

@Component({
  selector: 'be-billing-detail',
  standalone: true,
  imports: [JsonPipe, MatButtonModule, MatIconModule],
  template: `
    <section class="detail">
      <header>
        <div><strong>Bill Detail</strong><span>{{ billId }}</span></div>
        <div>
          <button mat-stroked-button type="button" (click)="print('a4')"><mat-icon>picture_as_pdf</mat-icon>A4</button>
          <button mat-stroked-button type="button" (click)="print('80')"><mat-icon>receipt</mat-icon>80mm</button>
          <button mat-stroked-button type="button" (click)="print('58')"><mat-icon>receipt_long</mat-icon>58mm</button>
        </div>
      </header>
      @if (invoice()) {
        <article [innerHTML]="invoice()!.a4Html"></article>
      } @else {
        <pre>{{ { id: billId, status: 'Loading invoice print template' } | json }}</pre>
      }
    </section>
  `,
  styles: [`.detail{display:grid;gap:14px;padding:14px}header{display:flex;justify-content:space-between;align-items:center;gap:12px}header div{display:flex;gap:8px;align-items:center}header div:first-child{display:grid;gap:3px;align-items:start}header strong{font-size:22px}header span{color:#667085}article,pre{background:#fff;border:1px solid #dfe5ec;border-radius:8px;padding:16px;overflow:auto}`]
})
export class BillingDetailComponent {
  private readonly api = inject(BillingApiService);
  private readonly billing = inject(BillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly printer = inject(PrintService);
  readonly billId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly invoice = signal<PrintInvoiceDto | null>(null);

  constructor() {
    if (this.billId) this.api.printBill(this.billId).subscribe(data => this.invoice.set(data));
  }

  confirm(): void {
    if (!this.billId) return;
    this.billing.confirmSalesInvoice(this.billId).subscribe({ next: () => { alert('Invoice confirmed'); }, error: () => alert('Could not confirm invoice') });
  }

  cancelInvoice(): void {
    if (!this.billId) return;
    if (!confirm('Cancel this invoice?')) return;
    this.billing.cancelSalesInvoice(this.billId).subscribe({ next: ok => { if (ok) alert('Invoice cancelled'); else alert('Could not cancel invoice'); }, error: () => alert('Could not cancel invoice') });
  }

  print(mode: 'a4' | '80' | '58'): void {
    const template = this.invoice();
    if (!template) return;
    this.printer.printHtml(mode === 'a4' ? template.a4Html : mode === '80' ? template.thermal80Html : template.thermal58Html);
  }
}
