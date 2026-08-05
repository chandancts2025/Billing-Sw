import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-search-input',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <label>
      <mat-icon>search</mat-icon>
      <input [placeholder]="placeholder()" [(ngModel)]="term" (ngModelChange)="changed($event)" autocomplete="off">
    </label>
  `,
  styles: [`label{height:40px;display:flex;align-items:center;gap:8px;border:1px solid #cfd6e1;border-radius:6px;background:#fff;padding:0 10px}input{border:0;outline:0;width:100%;min-width:0}`]
})
export class SearchInputComponent {
  readonly placeholder = input('Search');
  readonly valueChange = output<string>();
  readonly term = signal('');
  private timer?: number;

  changed(value: string): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.valueChange.emit(value), 300);
  }
}
