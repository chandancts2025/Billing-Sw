import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableColumn, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';

@Component({
  selector: 'be-customers',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DataTableComponent, SearchBoxComponent],
  template: `
    <section class="page">
      <div class="toolbar">
        <be-search-box label="Search customers" [value]="query()" (valueChange)="query.set($event)" />
        <button mat-flat-button color="primary"><mat-icon>person_add</mat-icon>Add customer</button>
      </div>
      <be-data-table [columns]="columns" [rows]="filtered()" />
    </section>
  `,
  styles: [`.page { padding: 20px; display: grid; gap: 16px; } .toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 12px; align-items: start; } @media (max-width: 720px) { .toolbar { grid-template-columns: 1fr; } }`]
})
export class CustomersComponent {
  readonly query = signal('');
  readonly columns: DataTableColumn[] = [
    { field: 'name', header: 'Name' },
    { field: 'phone', header: 'Phone' },
    { field: 'points', header: 'Loyalty' },
    { field: 'credit', header: 'Credit limit' },
    { field: 'outstanding', header: 'Outstanding' }
  ];
  readonly rows = signal([
    { name: 'Walk-in Customer', phone: '-', points: 0, credit: 0, outstanding: 0 },
    { name: 'Ananya Rao', phone: '+91 90000 11111', points: 240, credit: 10000, outstanding: 1200 }
  ]);
  readonly filtered = computed(() => {
    const text = this.query().toLowerCase();
    return this.rows().filter(row => Object.values(row).join(' ').toLowerCase().includes(text));
  });
}
