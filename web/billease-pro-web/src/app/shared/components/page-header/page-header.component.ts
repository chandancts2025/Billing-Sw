import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `<header><div><strong>{{ title() }}</strong><span>{{ subtitle() }}</span></div><ng-content /></header>`,
  styles: [`header { display: flex; align-items: center; justify-content: space-between; gap: 12px; } div { display: grid; gap: 3px; } strong { font-size: 22px; } span { color: #667085; font-size: 13px; }`]
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
