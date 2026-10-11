import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-topbar',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatBadgeModule, MatIconModule],
  template: `
    <header>
      <div class="topbar-left">
        <button mat-icon-button type="button" class="mobile-menu-btn" aria-label="Toggle menu" (click)="menuToggle.emit()">
          <mat-icon>menu</mat-icon>
        </button>
        <a routerLink="/landing" class="brand-info" title="View BillEase Pro Landing Page">
          <strong class="shop-title" [title]="shopName()">{{ shopName() }}</strong>
          <span class="user-meta">{{ userName() }} <span class="role-pill">{{ role() }}</span></span>
        </a>
      </div>
      <nav>
        <a mat-icon-button routerLink="/landing" aria-label="Landing page" class="desktop-only-btn" title="View Landing Page"><mat-icon>public</mat-icon></a>
        <a mat-icon-button routerLink="/billing/new" aria-label="Quick bill" class="quick-bill-top" title="New Bill (POS)"><mat-icon>bolt</mat-icon></a>
        <button mat-icon-button type="button" aria-label="Shortcuts" (click)="help.emit()" class="desktop-only-btn" title="Shortcuts"><mat-icon>keyboard</mat-icon></button>
        <button mat-icon-button type="button" aria-label="Notifications" (click)="notifications.emit()"><mat-icon [matBadge]="unread()" matBadgeColor="warn">notifications</mat-icon></button>
        <button mat-icon-button type="button" aria-label="Theme" (click)="theme.emit()" class="desktop-only-btn"><mat-icon>dark_mode</mat-icon></button>
        <button type="button" class="topbar-logout-btn" (click)="logout.emit()" title="Sign out of BillEase Pro">
          <mat-icon>logout</mat-icon>
          <span class="logout-text">Logout</span>
        </button>
      </nav>
    </header>
  `,
  styles: [`
    header {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: var(--surface, #fff);
      border-bottom: 1px solid var(--border, #e2e6ec);
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .mobile-menu-btn {
      display: none;
      color: #334155;
    }
    .brand-info {
      display: grid;
      gap: 2px;
      min-width: 0;
      text-decoration: none;
      cursor: pointer;
    }
    .shop-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }
    .brand-info:hover .shop-title {
      color: var(--brand-color, #0f766e);
    }
    .user-meta {
      color: #64748b;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .role-pill {
      font-size: 10px;
      font-weight: 600;
      background: #e2e8f0;
      color: #334155;
      padding: 1px 6px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .quick-bill-top {
      color: var(--brand-color, #0f766e);
    }
    .topbar-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-left: 4px;
    }
    .topbar-logout-btn:hover {
      background: #fee2e2;
      border-color: #f87171;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
    }
    .topbar-logout-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    @media (max-width: 860px) {
      header {
        padding: 0 10px;
        height: 56px;
      }
      .mobile-menu-btn {
        display: inline-flex;
      }
      .shop-title {
        max-width: 140px;
        font-size: 14px;
      }
      .user-meta {
        font-size: 11px;
      }
      .desktop-only-btn {
        display: none !important;
      }
      .topbar-logout-btn {
        padding: 6px 8px;
      }
      .topbar-logout-btn .logout-text {
        display: none;
      }
    }
  `]
})
export class TopbarComponent {
  readonly shopName = input('BillEase Pro');
  readonly userName = input('');
  readonly role = input('');
  readonly unread = input(0);
  readonly menuToggle = output<void>();
  readonly help = output<void>();
  readonly notifications = output<void>();
  readonly theme = output<void>();
  readonly logout = output<void>();
}
