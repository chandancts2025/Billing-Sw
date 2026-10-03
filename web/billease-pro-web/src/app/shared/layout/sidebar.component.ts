import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserRole } from '../../core/auth/auth.models';

export interface SidebarItem {
  label: string;
  icon: string;
  link: string;
  minRole?: UserRole;
}

@Component({
  selector: 'be-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <aside [class.collapsed]="collapsed()">
      <div class="brand">
        <div class="brand-title-wrap">
          <span class="brand-mark">B</span>
          <span class="brand-text">BillEase Pro</span>
        </div>
        <button type="button" class="mobile-close-btn" (click)="close.emit()" aria-label="Close sidebar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <nav>
        @for (item of items(); track item.link) {
          <a [routerLink]="item.link" routerLinkActive="active" [title]="item.label" (click)="onItemClick()">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <button type="button" class="collapse-toggle-btn" (click)="toggle.emit()">
        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        <span>Collapse Sidebar</span>
      </button>
    </aside>
  `,
  styles: [`
    aside {
      height: 100%;
      background: #151a22;
      color: white;
      padding: 16px 12px;
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 16px;
      box-sizing: border-box;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
    }
    .brand-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 16px;
    }
    .brand-mark {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--brand-color, #0f766e);
      font-size: 18px;
      font-weight: 800;
      color: white;
      box-shadow: 0 2px 8px rgba(15, 118, 110, 0.4);
    }
    .mobile-close-btn {
      display: none;
      background: transparent;
      border: 0;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }
    .mobile-close-btn:hover {
      color: white;
      background: #263241;
    }
    nav {
      display: grid;
      gap: 4px;
      align-content: start;
    }
    a, .collapse-toggle-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #cbd5e1;
      text-decoration: none;
      padding: 10px 14px;
      border-radius: 8px;
      background: transparent;
      border: 0;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease;
      min-height: 42px;
    }
    a mat-icon, .collapse-toggle-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    a.active {
      background: var(--brand-color, #0f766e);
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3);
    }
    a:hover:not(.active), .collapse-toggle-btn:hover {
      background: #263241;
      color: white;
    }
    .collapsed {
      width: 72px;
      padding: 16px 8px;
    }
    .collapsed .brand-text,
    .collapsed span:not(.brand-mark) {
      display: none;
    }
    .collapsed a,
    .collapsed .collapse-toggle-btn {
      justify-content: center;
      padding: 10px;
    }
    @media (max-width: 860px) {
      .mobile-close-btn {
        display: inline-flex;
      }
      .collapse-toggle-btn {
        display: none !important;
      }
    }
  `]
})
export class SidebarComponent {
  readonly items = input<SidebarItem[]>([]);
  readonly collapsed = input(false);
  readonly toggle = output<void>();
  readonly close = output<void>();

  onItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      this.close.emit();
    }
  }
}
