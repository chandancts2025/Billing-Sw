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
        <a routerLink="/landing" class="brand-title-wrap" (click)="onItemClick()" title="View Landing Page">
          <span class="brand-mark">B</span>
          <span class="brand-text">BillEase Pro</span>
        </a>
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

      <div class="sidebar-footer">
        <a routerLink="/landing" class="sidebar-footer-link" title="Landing Page" (click)="onItemClick()">
          <mat-icon>public</mat-icon>
          <span>Landing Page</span>
        </a>

        <button type="button" class="sidebar-logout-btn" (click)="onLogoutClick()" title="Sign Out of BillEase Pro">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>

        <button type="button" class="collapse-toggle-btn" (click)="toggle.emit()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          <span>Collapse Sidebar</span>
        </button>
      </div>
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
    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px solid #263241;
      margin-top: auto;
    }
    .sidebar-footer-link {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #94a3b8;
      text-decoration: none;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s ease;
      min-height: 40px;
    }
    .sidebar-footer-link:hover {
      background: #1e293b;
      color: #38bdf8;
    }
    .sidebar-footer-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .sidebar-logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      text-decoration: none;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      min-height: 40px;
    }
    .sidebar-logout-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ffffff;
      border-color: #ef4444;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }
    .sidebar-logout-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .brand-title-wrap {
      text-decoration: none;
      color: inherit;
      cursor: pointer;
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
    .collapsed .collapse-toggle-btn,
    .collapsed .sidebar-footer-link,
    .collapsed .sidebar-logout-btn {
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
  readonly logout = output<void>();

  onItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      this.close.emit();
    }
  }

  onLogoutClick(): void {
    this.close.emit();
    this.logout.emit();
  }
}
