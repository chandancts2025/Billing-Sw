import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-reports',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="reports">
      @for (card of cards; track card.title) {
        <article>
          <mat-icon>{{ card.icon }}</mat-icon>
          <div>
            <span>{{ card.title }}</span>
            <strong>{{ card.value }}</strong>
          </div>
        </article>
      }
    </section>
  `,
  styles: [`
    .reports { padding: 20px; display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 14px; }
    article { display: flex; gap: 12px; align-items: center; background: white; border: 1px solid #dde3eb; border-radius: 8px; padding: 16px; }
    mat-icon { color: #2aa198; }
    span { display: block; color: #657386; font-size: 13px; }
    strong { font-size: 24px; }
    @media (max-width: 900px) { .reports { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .reports { grid-template-columns: 1fr; } }
  `]
})
export class ReportsComponent {
  readonly cards = [
    { icon: 'payments', title: 'Sales today', value: '₹24,890' },
    { icon: 'receipt_long', title: 'Invoices', value: '46' },
    { icon: 'inventory', title: 'Inventory value', value: '₹8.4L' },
    { icon: 'warning', title: 'Low stock', value: '12' }
  ];
}
