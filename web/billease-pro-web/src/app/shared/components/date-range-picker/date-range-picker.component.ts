import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface DateRangeValue { from: string; to: string; preset: string; }

@Component({
  selector: 'be-date-range-picker',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="range">
      <mat-form-field appearance="outline"><mat-label>Range</mat-label><mat-select [ngModel]="preset()" (ngModelChange)="setPreset($event)"><mat-option value="today">Today</mat-option><mat-option value="yesterday">Yesterday</mat-option><mat-option value="week">This Week</mat-option><mat-option value="month">This Month</mat-option><mat-option value="lastMonth">Last Month</mat-option><mat-option value="custom">Custom</mat-option></mat-select></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>From</mat-label><input matInput type="date" [ngModel]="from()" (ngModelChange)="from.set($event); emit()"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>To</mat-label><input matInput type="date" [ngModel]="to()" (ngModelChange)="to.set($event); emit()"></mat-form-field>
    </div>
  `,
  styles: [`.range { display: flex; flex-wrap: wrap; gap: 8px; } mat-form-field { width: 150px; }`]
})
export class DateRangePickerComponent {
  readonly valueChange = output<DateRangeValue>();
  readonly preset = signal('month');
  readonly from = signal('');
  readonly to = signal('');

  constructor() { this.setPreset('month'); }

  setPreset(preset: string): void {
    this.preset.set(preset);
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    if (preset === 'yesterday') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); }
    if (preset === 'week') start.setDate(now.getDate() - now.getDay());
    if (preset === 'month') start.setDate(1);
    if (preset === 'lastMonth') { start.setMonth(now.getMonth() - 1, 1); end.setMonth(now.getMonth(), 0); }
    this.from.set(start.toISOString().slice(0, 10));
    this.to.set(end.toISOString().slice(0, 10));
    this.emit();
  }

  emit(): void {
    this.valueChange.emit({ preset: this.preset(), from: this.from(), to: this.to() });
  }
}
