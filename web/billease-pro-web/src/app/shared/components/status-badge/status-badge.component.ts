import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'be-status-badge',
  standalone: true,
  template: `<span [class]="tone()">{{ value() }}</span>`,
  styles: [`span { display: inline-flex; border-radius: 999px; padding: 3px 9px; font-size: 12px; font-weight: 600; } .ok { background: #dcfae6; color: #067647; } .warn { background: #fef3c7; color: #92400e; } .bad { background: #fee4e2; color: #b42318; } .neutral { background: #eef2f6; color: #475467; }`]
})
export class StatusBadgeComponent {
  readonly value = input('');
  readonly tone = computed(() => {
    const text = this.value().toLowerCase();
    if (['active', 'paid', 'confirmed', 'approved', 'success'].some(x => text.includes(x))) return 'ok';
    if (['pending', 'draft', 'partial', 'warning'].some(x => text.includes(x))) return 'warn';
    if (['cancel', 'reject', 'expired', 'failed', 'critical'].some(x => text.includes(x))) return 'bad';
    return 'neutral';
  });
}
