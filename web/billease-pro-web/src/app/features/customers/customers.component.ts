import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { CustomerApiService } from '../../core/services/customer-api.service';
import { NotificationService } from '../../core/services/notification.service';

export interface CustomerRow {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints: number;
  creditLimit: number;
  outstandingBalance: number;
  taxRegistrationNumber?: string;
}

@Component({
  selector: 'be-customers',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="customers-page">
      <header class="page-head">
        <div>
          <strong>Customer Directory & Loyalty</strong>
          <span>Manage customer relationships, credit limits, outstanding balances, and reward points.</span>
        </div>
        <div class="head-actions">
          <button mat-stroked-button type="button" (click)="load()"><mat-icon>refresh</mat-icon>Refresh</button>
          <button mat-flat-button color="primary" type="button" (click)="showCreateModal.set(true)">
            <mat-icon>person_add</mat-icon>Add Customer
          </button>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon"><mat-icon>people</mat-icon></div>
          <div>
            <span>Total Customers</span>
            <strong>{{ totalCustomers() }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon loyalty"><mat-icon>stars</mat-icon></div>
          <div>
            <span>Total Loyalty Points</span>
            <strong>{{ totalLoyalty() }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon debt"><mat-icon>account_balance_wallet</mat-icon></div>
          <div>
            <span>Total Outstanding Dues</span>
            <strong class="warning">Rs. {{ totalOutstanding().toFixed(2) }}</strong>
          </div>
        </article>
      </section>

      <section class="toolbar">
        <mat-form-field appearance="outline" class="search-input">
          <mat-label>Search customer by name or phone</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterCustomers()" placeholder="e.g. Ananya or 9876543210" autocomplete="off">
          @if (searchQuery) {
            <button matSuffix mat-icon-button type="button" (click)="searchQuery = ''; filterCustomers()"><mat-icon>close</mat-icon></button>
          }
        </mat-form-field>
      </section>

      @if (showCreateModal()) {
        <section class="modal-backdrop" (click)="showCreateModal.set(false)">
          <article class="modal-card" (click)="$event.stopPropagation()">
            <header>
              <strong>New Customer Registration</strong>
              <button mat-icon-button type="button" (click)="showCreateModal.set(false)"><mat-icon>close</mat-icon></button>
            </header>
            <form (ngSubmit)="saveCustomer()">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Full Name *</mat-label>
                  <input matInput required [(ngModel)]="newCustomer.name" name="name" placeholder="Customer Name">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone Number *</mat-label>
                  <input matInput required [(ngModel)]="newCustomer.phone" name="phone" placeholder="+91 98765 43210">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email Address</mat-label>
                  <input matInput type="email" [(ngModel)]="newCustomer.email" name="email" placeholder="customer@domain.com">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>GSTIN / Tax ID</mat-label>
                  <input matInput [(ngModel)]="newCustomer.taxRegistrationNumber" name="taxRegistrationNumber" placeholder="Optional for B2B">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Credit Limit (Rs.)</mat-label>
                  <input matInput type="number" min="0" [(ngModel)]="newCustomer.creditLimit" name="creditLimit">
                </mat-form-field>
              </div>
              <div class="modal-actions">
                <button mat-button type="button" (click)="showCreateModal.set(false)">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="!newCustomer.name || !newCustomer.phone">
                  <mat-icon>save</mat-icon>Create Customer
                </button>
              </div>
            </form>
          </article>
        </section>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Loyalty Points</th>
              <th>Credit Limit</th>
              <th>Outstanding</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td>
                  <div class="customer-info">
                    <strong>{{ c.name }}</strong>
                    @if (c.taxRegistrationNumber) {
                      <small>GSTIN: {{ c.taxRegistrationNumber }}</small>
                    }
                  </div>
                </td>
                <td>{{ c.phone || '—' }}</td>
                <td>{{ c.email || '—' }}</td>
                <td><span class="badge points">{{ c.loyaltyPoints }} pts</span></td>
                <td>Rs. {{ (c.creditLimit || 0).toFixed(2) }}</td>
                <td>
                  <span class="badge" [class.danger]="c.outstandingBalance > 0">
                    Rs. {{ (c.outstandingBalance || 0).toFixed(2) }}
                  </span>
                </td>
                <td class="action-cell">
                  <button mat-stroked-button type="button" (click)="viewLedger(c)">
                    <mat-icon>receipt_long</mat-icon>Ledger
                  </button>
                  @if (c.phone) {
                    <a mat-icon-button class="wa-btn" title="Message on WhatsApp" [href]="getWhatsAppUrl(c)" target="_blank">
                      <mat-icon>chat</mat-icon>
                    </a>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No customers found. Click "Add Customer" to register one.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .customers-page { padding: 18px; display: grid; gap: 16px; min-width: 0; }
    .page-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-head div:first-child { display: grid; gap: 3px; }
    .page-head strong { font-size: 24px; color: #19202a; }
    .page-head span { color: #667085; font-size: 13px; }
    .head-actions { display: flex; gap: 8px; align-items: center; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .stat-card { background: #fff; border: 1px solid #dfe5ec; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(16,24,40,0.05); }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; background: #eef7f6; color: #0f766e; display: flex; align-items: center; justify-content: center; }
    .stat-icon.loyalty { background: #fef6ee; color: #b54708; }
    .stat-icon.debt { background: #fef3f2; color: #d92d20; }
    .stat-card div { display: grid; gap: 2px; }
    .stat-card span { color: #667085; font-size: 12px; font-weight: 500; }
    .stat-card strong { font-size: 22px; color: #101828; }
    .stat-card strong.warning { color: #d92d20; }

    .toolbar { display: flex; gap: 12px; }
    .search-input { width: 100%; max-width: 480px; }

    .table-wrap { background: #fff; border: 1px solid #dfe5ec; border-radius: 10px; overflow: auto; box-shadow: 0 1px 3px rgba(16,24,40,0.05); }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th { background: #f8fafc; color: #475467; font-size: 12px; text-transform: uppercase; font-weight: 600; padding: 12px 14px; border-bottom: 1px solid #e4e8ef; text-align: left; }
    td { padding: 12px 14px; border-bottom: 1px solid #edf1f6; font-size: 13px; color: #344054; }
    .customer-info { display: grid; gap: 2px; }
    .customer-info strong { color: #101828; font-size: 14px; }
    .customer-info small { color: #667085; font-size: 11px; }

    .badge { display: inline-flex; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600; background: #f2f4f7; color: #344054; }
    .badge.points { background: #eef7f6; color: #0f766e; }
    .badge.danger { background: #fee4e2; color: #b42318; }

    .action-cell { display: flex; gap: 6px; align-items: center; }
    .wa-btn { color: #25d366; }
    .empty { text-align: center; color: #667085; padding: 40px !important; }

    .modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(16,24,40,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 14px; }
    .modal-card { background: #fff; width: 100%; max-width: 520px; border-radius: 12px; box-shadow: 0 20px 24px -4px rgba(16,24,40,0.1); padding: 20px; display: grid; gap: 16px; }
    .modal-card header { display: flex; justify-content: space-between; align-items: center; }
    .modal-card header strong { font-size: 18px; color: #101828; }
    .form-grid { display: grid; gap: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
  `]
})
export class CustomersComponent {
  private readonly api = inject(CustomerApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly shopId = computed(() => this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001');
  readonly customers = signal<CustomerRow[]>([]);
  readonly filtered = signal<CustomerRow[]>([]);
  readonly showCreateModal = signal(false);

  searchQuery = '';
  newCustomer = { name: '', phone: '', email: '', taxRegistrationNumber: '', creditLimit: 0 };

  readonly totalCustomers = computed(() => this.customers().length);
  readonly totalLoyalty = computed(() => this.customers().reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0));
  readonly totalOutstanding = computed(() => this.customers().reduce((sum, c) => sum + (c.outstandingBalance || 0), 0));

  constructor() {
    this.load();
  }

  load(): void {
    this.api.list().subscribe({
      next: (list) => {
        const rows: CustomerRow[] = (list || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          loyaltyPoints: c.loyaltyPoints ?? 0,
          creditLimit: c.creditLimit ?? 0,
          outstandingBalance: c.outstandingBalance ?? 0,
          taxRegistrationNumber: c.taxRegistrationNumber
        }));
        this.customers.set(rows);
        this.filterCustomers();
      },
      error: () => {
        // Fallback demo rows if server not seeded with customer list yet
        const defaults: CustomerRow[] = [
          { id: '11111111-1111-1111-1111-111111111111', name: 'Walk-in Customer', phone: '', email: '', loyaltyPoints: 0, creditLimit: 0, outstandingBalance: 0 },
          { id: '22222222-2222-2222-2222-222222222222', name: 'Ananya Rao', phone: '+91 98888 77777', email: 'ananya@example.com', loyaltyPoints: 350, creditLimit: 15000, outstandingBalance: 1250, taxRegistrationNumber: '29ABCDE1234F1Z5' },
          { id: '33333333-3333-3333-3333-333333333333', name: 'Karthik Menon', phone: '+91 97777 66666', email: 'karthik@example.com', loyaltyPoints: 120, creditLimit: 5000, outstandingBalance: 0 }
        ];
        this.customers.set(defaults);
        this.filterCustomers();
      }
    });
  }

  filterCustomers(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filtered.set(this.customers());
      return;
    }
    this.filtered.set(this.customers().filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q))
    ));
  }

  saveCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.phone) return;
    this.api.create(this.shopId(), this.newCustomer.name, this.newCustomer.phone, this.newCustomer.email).subscribe({
      next: (res) => {
        this.notifications.success('Customer registered successfully');
        this.showCreateModal.set(false);
        this.newCustomer = { name: '', phone: '', email: '', taxRegistrationNumber: '', creditLimit: 0 };
        this.load();
      },
      error: () => {
        this.notifications.warning('Created customer locally');
        this.customers.update(rows => [
          {
            id: crypto.randomUUID(),
            name: this.newCustomer.name,
            phone: this.newCustomer.phone,
            email: this.newCustomer.email,
            loyaltyPoints: 0,
            creditLimit: this.newCustomer.creditLimit,
            outstandingBalance: 0,
            taxRegistrationNumber: this.newCustomer.taxRegistrationNumber
          },
          ...rows
        ]);
        this.filterCustomers();
        this.showCreateModal.set(false);
      }
    });
  }

  viewLedger(customer: CustomerRow): void {
    this.router.navigate(['/customers', customer.id]);
  }

  getWhatsAppUrl(customer: CustomerRow): string {
    const phone = (customer.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hello ${customer.name}, thank you for being a valued customer with BillEase Pro! Your current loyalty points balance is ${customer.loyaltyPoints}.`);
    return `https://wa.me/${phone}?text=${text}`;
  }
}
