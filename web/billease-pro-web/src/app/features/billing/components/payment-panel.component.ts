import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethod } from '../billing.models';

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string | null;
}

@Component({
  selector: 'be-payment-panel',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      @for (payment of payments(); track $index) {
        <div class="row">
          <select [(ngModel)]="payment.method" (ngModelChange)="changed()">
            <option value="Cash">Cash</option><option value="Card">Card</option><option value="UPI">UPI</option><option value="Credit">Credit</option>
          </select>
          <input type="number" min="0" [(ngModel)]="payment.amount" (ngModelChange)="changed()">
          @if (payment.method === 'UPI' || payment.method === 'Card') {
            <input [placeholder]="payment.method === 'UPI' ? 'UPI ref' : 'Card last 4'" [(ngModel)]="payment.referenceNumber" (ngModelChange)="changed()">
          }
          <button mat-icon-button type="button" (click)="remove($index)" aria-label="Remove payment"><mat-icon>delete</mat-icon></button>
        </div>
      }
      <button mat-stroked-button type="button" (click)="add()"><mat-icon>add</mat-icon>Split Payment</button>
      <div class="change"><span>Change</span><strong>Rs. {{ change().toFixed(2) }}</strong></div>
    </section>
  `,
  styles: [`section{display:grid;gap:8px}.row{display:grid;grid-template-columns:110px 1fr 1fr 40px;gap:8px;align-items:center}select,input{min-height:36px;border:1px solid #cfd6e1;border-radius:6px;padding:0 8px;min-width:0}.change{display:flex;justify-content:space-between;border-top:1px solid #dfe5ec;padding-top:8px}@media(max-width:720px){.row{grid-template-columns:1fr 1fr 40px}.row input:nth-child(3){grid-column:1 / -1}}`]
})
export class PaymentPanelComponent {
  readonly total = input(0);
  readonly valueChange = output<PaymentEntry[]>();
  readonly payments = signal<PaymentEntry[]>([{ method: 'Cash', amount: 0, referenceNumber: null }]);
  readonly paid = computed(() => this.payments().reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  readonly change = computed(() => Math.max(0, this.paid() - this.total()));

  add(): void {
    this.payments.update(rows => [...rows, { method: 'UPI', amount: Math.max(0, this.total() - this.paid()), referenceNumber: null }]);
    this.changed();
  }

  remove(index: number): void {
    this.payments.update(rows => rows.filter((_, i) => i !== index));
    this.changed();
  }

  changed(): void {
    this.payments.update(rows => [...rows]);
    this.valueChange.emit(this.payments());
  }
}
