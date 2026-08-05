import { Component } from '@angular/core';
import { InventorySuppliersComponent } from '../inventory/inventory-suppliers.component';

@Component({
  selector: 'be-suppliers',
  standalone: true,
  imports: [InventorySuppliersComponent],
  template: `<be-inventory-suppliers />`
})
export class SuppliersComponent {}
