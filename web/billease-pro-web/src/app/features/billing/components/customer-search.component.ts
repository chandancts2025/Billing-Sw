import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { CustomerSearchResultDto } from '../billing.models';

@Component({
  selector: 'be-customer-search',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <label><mat-icon>person_search</mat-icon><input [(ngModel)]="term" (ngModelChange)="search($event)" placeholder="Customer name or phone" autocomplete="off"></label>
      @if (matches().length) {
        <div>@for (customer of matches(); track customer.id) { <button type="button" (click)="pick(customer)"><strong>{{ customer.name }}</strong><span>{{ mask(customer.phone ?? '') }}</span></button> }</div>
      }
      <button mat-stroked-button type="button" (click)="addWalkIn()"><mat-icon>directions_walk</mat-icon>Walk-in</button>
    </section>
  `,
  styles: [`section{display:grid;gap:8px;position:relative}label{height:42px;display:flex;align-items:center;gap:8px;border:1px solid #cfd6e1;border-radius:6px;padding:0 10px;background:#fff}input{border:0;outline:0;width:100%}div{display:grid;gap:4px;border:1px solid #dfe5ec;border-radius:6px;padding:6px;background:#fff}div button{border:0;background:transparent;display:flex;justify-content:space-between;padding:8px;border-radius:5px;cursor:pointer}div button:hover{background:#eef7f6}span{color:#667085}`]
})
export class CustomerSearchComponent {
  private readonly api = inject(CustomerApiService);
  private readonly auth = inject(AuthService);
  readonly selected = output<CustomerSearchResultDto | null>();
  readonly shopId = computed(() => this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001');
  readonly matches = signal<CustomerSearchResultDto[]>([]);
  term = '';
  private timer?: number;

  search(value: string): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (value.trim().length < 2) { this.matches.set([]); return; }
      this.api.search(this.shopId(), value.trim()).subscribe(rows => this.matches.set(rows.slice(0, 10)));
    }, 300);
  }

  pick(customer: CustomerSearchResultDto): void {
    this.selected.emit(customer);
    this.term = customer.name;
    this.matches.set([]);
  }

  addWalkIn(): void {
    this.selected.emit(null);
    this.term = 'Walk-in Customer';
  }

  mask(phone: string): string {
    return phone.length <= 4 ? phone : `${'x'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
  }
}
