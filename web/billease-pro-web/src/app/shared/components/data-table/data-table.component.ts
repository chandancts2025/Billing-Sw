import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

export interface DataTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status';
}

export interface DataTableAction {
  icon: string;
  label: string;
  action: string;
  severity?: 'primary' | 'danger' | 'secondary';
}

@Component({
  selector: 'be-data-table',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, CheckboxModule],
  template: `
    @if (loading()) {
      <div class="skeleton">@for (row of skeletonRows; track row) { <span></span> }</div>
    } @else if (!rows().length) {
      <div class="empty">{{ emptyText() }}</div>
    } @else {
    <p-table [value]="rows()" [paginator]="true" [rows]="pageSize()" [rowHover]="true" responsiveLayout="scroll" [sortField]="sortField()" [sortOrder]="sortOrder()">
      <ng-template pTemplate="caption">
        <div class="caption">
          <span>{{ rows().length }} rows</span>
          <button pButton type="button" icon="pi pi-download" label="Export" text (click)="export.emit(rows())"></button>
        </div>
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          @if (bulkSelect()) { <th class="select"></th> }
          @for (column of columns(); track column.field) {
            <th [pSortableColumn]="column.sortable === false ? undefined : column.field">
              {{ column.header }}
              @if (column.sortable !== false) { <p-sortIcon [field]="column.field" /> }
            </th>
          }
          @if (actions().length) { <th class="actions">Actions</th> }
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-row>
        <tr>
          @if (bulkSelect()) {
            <td class="select"><p-checkbox [binary]="true" [ngModel]="isSelected(row)" (ngModelChange)="toggle(row)" /></td>
          }
          @for (column of columns(); track column.field) {
            <td>{{ row[column.field] }}</td>
          }
          @if (actions().length) {
            <td class="actions row-actions">
              @for (item of actions(); track item.action) {
                <button pButton type="button" [icon]="item.icon" text rounded [severity]="item.severity === 'danger' ? 'danger' : 'secondary'" [attr.aria-label]="item.label" (click)="action.emit({ action: item.action, row })"></button>
              }
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
    }
  `,
  styles: [`
    :host { display: block; border: 1px solid #dde3eb; border-radius: 8px; overflow: hidden; background: white; }
    .caption { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .actions { width: 132px; text-align: right; white-space: nowrap; }
    .select { width: 44px; }
    .row-actions { opacity: 0; transition: opacity .16s ease; }
    tr:hover .row-actions { opacity: 1; }
    .empty { padding: 40px; text-align: center; color: #667085; }
    .skeleton { padding: 14px; display: grid; gap: 10px; }
    .skeleton span { height: 34px; border-radius: 6px; background: linear-gradient(90deg, #eef2f6, #f8fafc, #eef2f6); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `]
})
export class DataTableComponent {
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly columns = input<DataTableColumn[]>([]);
  readonly actions = input<DataTableAction[]>([
    { icon: 'pi pi-pencil', label: 'Edit', action: 'edit' },
    { icon: 'pi pi-trash', label: 'Delete', action: 'delete', severity: 'danger' }
  ]);
  readonly pageSize = input(12);
  readonly loading = input(false);
  readonly bulkSelect = input(false);
  readonly emptyText = input('No records found.');
  readonly sortField = signal('');
  readonly sortOrder = signal(1);
  readonly selected = signal<Record<string, unknown>[]>([]);
  readonly selectedCount = computed(() => this.selected().length);
  readonly edit = output<Record<string, unknown>>();
  readonly remove = output<Record<string, unknown>>();
  readonly action = output<{ action: string; row: Record<string, unknown> }>();
  readonly export = output<Record<string, unknown>[]>();
  readonly selectionChange = output<Record<string, unknown>[]>();
  readonly skeletonRows = Array.from({ length: 8 }, (_, index) => index);

  isSelected(row: Record<string, unknown>): boolean {
    return this.selected().includes(row);
  }

  toggle(row: Record<string, unknown>): void {
    this.selected.update(rows => rows.includes(row) ? rows.filter(item => item !== row) : [...rows, row]);
    this.selectionChange.emit(this.selected());
  }
}
