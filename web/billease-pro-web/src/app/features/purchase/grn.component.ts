import { Component } from '@angular/core';
import { InventoryPurchasesComponent } from '../inventory/inventory-purchases.component';

@Component({
  selector: 'be-grn',
  standalone: true,
  imports: [InventoryPurchasesComponent],
  template: `<be-inventory-purchases />`
})
export class GrnComponent {}
