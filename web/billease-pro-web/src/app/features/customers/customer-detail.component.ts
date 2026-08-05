import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerApiService } from '../../core/services/customer-api.service';

@Component({
  selector: 'be-customer-detail',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="page">
      <header><strong>Customer Ledger</strong><span>{{ customerId }}</span></header>
      <pre>{{ customer() | json }}</pre>
    </section>
  `,
  styles: [`.page{display:grid;gap:14px;padding:14px}header{display:grid;gap:4px}strong{font-size:22px}span{color:#667085}pre{background:#fff;border:1px solid #dfe5ec;border-radius:8px;padding:16px;overflow:auto}`]
})
export class CustomerDetailComponent {
  private readonly api = inject(CustomerApiService);
  private readonly route = inject(ActivatedRoute);
  readonly customerId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly customer = signal<unknown>(null);

  constructor() {
    if (this.customerId) this.api.getById(this.customerId).subscribe(data => this.customer.set(data));
  }
}
