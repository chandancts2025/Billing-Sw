import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'be-breadcrumb',
  standalone: true,
  template: `<nav>@for (part of parts(); track part) { <span>{{ part }}</span> }</nav>`,
  styles: [`nav { display: flex; gap: 6px; color: #667085; font-size: 12px; } span:not(:last-child)::after { content: '/'; margin-left: 6px; }`]
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly nav = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd), startWith(null)));
  readonly parts = computed(() => {
    this.nav();
    return this.router.url.split('?')[0].split('/').filter(Boolean).map(x => x.replaceAll('-', ' '));
  });
}
