import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `<section><mat-icon>{{ icon() }}</mat-icon><strong>{{ title() }}</strong><span>{{ message() }}</span></section>`,
  styles: [`section { display: grid; place-items: center; gap: 8px; padding: 42px; color: #667085; text-align: center; } mat-icon { color: var(--brand-color, #0f766e); } strong { color: #101828; }`]
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input('No data');
  readonly message = input('Nothing to show yet.');
}
