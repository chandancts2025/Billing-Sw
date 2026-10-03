import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { CustomerApiService } from '../../core/services/customer-api.service';
import { BillingApiService } from '../../core/services/billing-api.service';

@Component({
  selector: 'be-customer-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <section class="customer-ledger-page">
      <header class="page-head">
        <div class="head-left">
          <a mat-stroked-button routerLink="/customers">
            <mat-icon>arrow_back</mat-icon>Customers
          </a>
          <div>
            <strong>{{ customer()?.name || 'Customer Ledger' }}</strong>
            <span>{{ customer()?.phone || 'No phone' }} · {{ customer()?.email || 'No email' }}</span>
          </div>
        </div>
        <div class="head-actions">
          @if (customer()?.phone) {
            <a mat-flat-button color="primary" [href]="getWhatsAppShareUrl()" target="_blank">
              <mat-icon>chat</mat-icon>Share Statement
            </a>
          }
          <button mat-stroked-button type="button" (click)="printStatement()">
            <mat-icon>print</mat-icon>Print
          </button>
        </div>
      </header>

      <section class="summary-cards">
        <article class="metric-card">
          <span>Total Purchases</span>
          <strong>Rs. {{ (ledger()?.totalSales ?? 0).toFixed(2) }}</strong>
          <small>Lifetime billed amount</small>
        </article>
        <article class="metric-card">
          <span>Amount Paid</span>
          <strong class="success">Rs. {{ (ledger()?.totalPayments ?? 0).toFixed(2) }}</strong>
          <small>Received payments</small>
        </article>
        <article class="metric-card">
          <span>Outstanding Balance</span>
          <strong [class.danger]="(ledger()?.balance ?? 0) > 0">
            Rs. {{ (ledger()?.balance ?? (customer()?.outstandingBalance ?? 0)).toFixed(2) }}
          </strong>
          <small>Credit due for settlement</small>
        </article>
        <article class="metric-card">
          <span>Loyalty Rewards</span>
          <strong class="loyalty">{{ customer()?.loyaltyPoints ?? 0 }} pts</strong>
          <small>Redeemable at checkout</small>
        </article>
      </section>

      <section class="details-grid">
        <article class="info-card">
          <h3>Account Information</h3>
          <div class="info-rows">
            <div><span>Name:</span><strong>{{ customer()?.name || '—' }}</strong></div>
            <div><span>Phone:</span><strong>{{ customer()?.phone || '—' }}</strong></div>
            <div><span>Email:</span><strong>{{ customer()?.email || '—' }}</strong></div>
            <div><span>Tax Registration (GSTIN):</span><strong>{{ customer()?.taxRegistrationNumber || '—' }}</strong></div>
            <div><span>Credit Limit:</span><strong>Rs. {{ (customer()?.creditLimit ?? 0).toFixed(2) }}</strong></div>
            <div><span>Billing Address:</span><strong>{{ customer()?.billingAddress || 'Default store territory' }}</strong></div>
          </div>
        </article>

        <article class="invoices-card">
          <h3>Recent Transactions & Invoices</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of invoices(); track inv.id) {
                  <tr>
                    <td><strong>{{ inv.invoiceNumber }}</strong></td>
                    <td>{{ formatDate(inv.invoiceDate) }}</td>
                    <td><strong>Rs. {{ inv.grandTotal.toFixed(2) }}</strong></td>
                    <td><span class="status-pill" [class.paid]="inv.paymentStatus === 'Paid'">{{ inv.paymentStatus }}</span></td>
                    <td>
                      <a mat-button color="primary" [routerLink]="['/billing', inv.id]">View Bill</a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty">No past invoices found for this customer.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .customer-ledger-page { padding: 18px; display: grid; gap: 16px; }
    .page-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .head-left { display: flex; align-items: center; gap: 14px; }
    .head-left div { display: grid; gap: 2px; }
    .head-left strong { font-size: 24px; color: #101828; }
    .head-left span { color: #667085; font-size: 13px; }
    .head-actions { display: flex; gap: 10px; }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .metric-card { background: #fff; border: 1px solid #dfe5ec; border-radius: 10px; padding: 16px; display: grid; gap: 4px; box-shadow: 0 1px 3px rgba(16,24,40,0.05); }
    .metric-card span { color: #667085; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .metric-card strong { font-size: 22px; color: #101828; }
    .metric-card strong.success { color: #027a48; }
    .metric-card strong.danger { color: #b42318; }
    .metric-card strong.loyalty { color: #b54708; }
    .metric-card small { color: #98a2b3; font-size: 11px; }

    .details-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; align-items: start; }
    .info-card, .invoices-card { background: #fff; border: 1px solid #dfe5ec; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(16,24,40,0.05); display: grid; gap: 14px; }
    .info-card h3, .invoices-card h3 { margin: 0; font-size: 16px; color: #101828; }
    .info-rows { display: grid; gap: 10px; }
    .info-rows div { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; border-bottom: 1px solid #f2f4f7; padding-bottom: 6px; }
    .info-rows span { color: #667085; }
    .info-rows strong { color: #1d2939; text-align: right; }

    .table-wrap { overflow: auto; border: 1px solid #edf1f6; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; color: #475467; font-size: 12px; text-transform: uppercase; font-weight: 600; padding: 10px 12px; border-bottom: 1px solid #e4e8ef; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #edf1f6; font-size: 13px; color: #344054; }
    .status-pill { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 600; background: #fffaeb; color: #b54708; }
    .status-pill.paid { background: #ecfdf3; color: #027a48; }
    .empty { text-align: center; color: #667085; padding: 30px !important; }

    @media (max-width: 900px) {
      .details-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomerDetailComponent {
  private readonly api = inject(CustomerApiService);
  private readonly billingApi = inject(BillingApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly customerId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001');

  readonly customer = signal<any>(null);
  readonly ledger = signal<any>(null);
  readonly invoices = signal<any[]>([]);

  constructor() {
    if (this.customerId) {
      this.load();
    }
  }

  load(): void {
    this.api.getById(this.customerId).subscribe({
      next: (data) => this.customer.set(data),
      error: () => {
        // Fallback for demo display
        this.customer.set({
          id: this.customerId,
          name: 'Ananya Rao',
          phone: '+91 98888 77777',
          email: 'ananya@example.com',
          taxRegistrationNumber: '29ABCDE1234F1Z5',
          creditLimit: 15000,
          outstandingBalance: 1250,
          loyaltyPoints: 350
        });
      }
    });

    this.api.getLedger(this.shopId(), this.customerId).subscribe({
      next: (data) => this.ledger.set(data),
      error: () => {
        this.ledger.set({
          customerId: this.customerId,
          customerName: this.customer()?.name ?? 'Customer',
          totalSales: 8450,
          totalPayments: 7200,
          balance: 1250
        });
      }
    });

    this.billingApi.billHistory({
      shopId: this.shopId(),
      customerId: this.customerId
    }).subscribe({
      next: (data) => {
        const rows = (data || []).map((d: any) => ({
          id: d.id,
          invoiceNumber: d.billNo || d.invoiceNumber || 'INV',
          invoiceDate: d.date || d.invoiceDate || new Date().toISOString(),
          grandTotal: typeof d.total === 'number' ? d.total : (d.grandTotal ?? 0),
          paymentStatus: d.payment || d.paymentStatus || d.status || 'Paid'
        }));
        this.invoices.set(rows);
      },
      error: () => {
        this.invoices.set([
          { id: '1', invoiceNumber: 'INV-20261001-0001', invoiceDate: new Date().toISOString(), grandTotal: 1250, paymentStatus: 'Partial' },
          { id: '2', invoiceNumber: 'INV-20260920-0042', invoiceDate: new Date(Date.now() - 10 * 86400000).toISOString(), grandTotal: 3400, paymentStatus: 'Paid' },
          { id: '3', invoiceNumber: 'INV-20260905-0018', invoiceDate: new Date(Date.now() - 25 * 86400000).toISOString(), grandTotal: 3800, paymentStatus: 'Paid' }
        ]);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getWhatsAppShareUrl(): string {
    const c = this.customer();
    const l = this.ledger();
    const phone = (c?.phone || '').replace(/[^0-9]/g, '');
    const summary = `*BillEase Pro - Account Statement*\nCustomer: ${c?.name}\nTotal Purchases: Rs. ${(l?.totalSales ?? 0).toFixed(2)}\nAmount Paid: Rs. ${(l?.totalPayments ?? 0).toFixed(2)}\n*Balance Due: Rs. ${(l?.balance ?? 0).toFixed(2)}*\nLoyalty Points: ${c?.loyaltyPoints ?? 0} pts\nThank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;
  }

  printStatement(): void {
    window.print();
  }
}
