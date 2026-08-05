import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-purchase-returns',
  standalone: true,
  imports: [MatIconModule],
  template: `<section><mat-icon>assignment_return</mat-icon><strong>Purchase Returns</strong><span>Debit note, stock reversal, and supplier ledger workflow.</span></section>`,
  styles: [`section{margin:14px;background:#fff;border:1px solid #dfe5ec;border-radius:8px;min-height:240px;display:grid;place-items:center;align-content:center;gap:8px}strong{font-size:22px}span{color:#667085}`]
})
export class PurchaseReturnsComponent {}
