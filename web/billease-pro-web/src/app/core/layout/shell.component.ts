import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/auth.models';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';
import { ShopStore } from '../stores/shop.store';
import { BreadcrumbComponent } from '../../shared/layout/breadcrumb.component';
import { SidebarComponent, SidebarItem } from '../../shared/layout/sidebar.component';
import { TopbarComponent } from '../../shared/layout/topbar.component';

@Component({
  selector: 'be-shell',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, MatIconModule, MatProgressBarModule, BreadcrumbComponent, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="collapsed()" [class.mobile-nav-open]="mobileMenuOpen()">
      <be-sidebar [items]="visibleNav()" [collapsed]="collapsed()" (toggle)="toggleSidebar()" (close)="mobileMenuOpen.set(false)" />
      @if (mobileMenuOpen()) {
        <div class="mobile-sidebar-backdrop" (click)="mobileMenuOpen.set(false)"></div>
      }
      <main>
        <be-topbar
          [shopName]="shopName()"
          [userName]="auth.user()?.fullName ?? ''"
          [role]="auth.user()?.role ?? ''"
          [unread]="notifications.unreadCount()"
          (menuToggle)="mobileMenuOpen.set(!mobileMenuOpen())"
          (help)="showHelp.set(true)"
          (notifications)="showNotifications.set(!showNotifications())"
          (theme)="shop.toggleDarkMode()"
          (logout)="auth.logout()" />
        @if (loading.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
        @if (!online()) { <div class="offline"><mat-icon>wifi_off</mat-icon>You are offline. Changes will need a connection to sync.</div> }
        <section class="content" [class.route-enter]="routePulse()">
          <be-breadcrumb />
          <router-outlet />
        </section>
      </main>

      <section class="toasts">
        @for (toast of notifications.toasts(); track toast.id) {
          <article [class]="toast.type">
            <strong>{{ toast.type }}</strong>
            <span>{{ toast.text }}</span>
          </article>
        }
      </section>

      @if (showNotifications()) {
        <aside class="notification-panel">
          <header><strong>Notifications</strong><button mat-icon-button type="button" (click)="showNotifications.set(false)"><mat-icon>close</mat-icon></button></header>
          @for (item of notifications.notifications(); track item.id) {
            <article class="unread"><strong>{{ item.type }}</strong><span>{{ item.text }}</span></article>
          } @empty {
            <p>No notifications yet.</p>
          }
        </aside>
      }

      @if (showHelp()) {
        <section class="help-backdrop" (click)="showHelp.set(false)">
          <article class="help" (click)="$event.stopPropagation()">
            <header><strong>Keyboard Shortcuts</strong><button mat-icon-button type="button" (click)="showHelp.set(false)"><mat-icon>close</mat-icon></button></header>
            <div><kbd>F2</kbd><span>Focus product search</span></div>
            <div><kbd>F3</kbd><span>Barcode scan mode</span></div>
            <div><kbd>F4</kbd><span>Add custom bill item</span></div>
            <div><kbd>F5</kbd><span>Save draft</span></div>
            <div><kbd>F6</kbd><span>Confirm and print</span></div>
            <div><kbd>F7</kbd><span>Confirm bill</span></div>
            <div><kbd>Esc</kbd><span>Cancel or close dialog</span></div>
          </article>
        </section>
      }
    </div>
  `,
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  readonly notifications = inject(NotificationService);
  readonly shop = inject(ShopStore);
  readonly collapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly online = signal(navigator.onLine);
  readonly showHelp = signal(false);
  readonly showNotifications = signal(false);
  readonly routePulse = signal(true);
  readonly shopName = computed(() => this.shop.settings()?.shopName ?? 'BillEase Pro');
  private readonly navItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard', minRole: 'Operator' },
    { label: 'New Bill', icon: 'point_of_sale', link: '/billing/new', minRole: 'Operator' },
    { label: 'Bill History', icon: 'receipt_long', link: '/billing/history', minRole: 'Operator' },
    { label: 'Returns', icon: 'assignment_return', link: '/billing/returns', minRole: 'Operator' },
    { label: 'Products', icon: 'inventory_2', link: '/inventory/products', minRole: 'Operator' },
    { label: 'Categories', icon: 'category', link: '/inventory/categories', minRole: 'Admin' },
    { label: 'Purchases', icon: 'shopping_cart', link: '/purchase/orders', minRole: 'Admin' },
    { label: 'Suppliers', icon: 'local_shipping', link: '/purchase/suppliers', minRole: 'Admin' },
    { label: 'Customers', icon: 'groups', link: '/customers', minRole: 'Operator' },
    { label: 'Reports', icon: 'analytics', link: '/reports/analytics', minRole: 'Operator' },
    { label: 'Settings', icon: 'settings', link: '/settings/shop', minRole: 'Admin' }
  ];
  readonly visibleNav = computed(() => this.navItems.filter(item => this.canSee(item.minRole)));

  @HostListener('window:online')
  markOnline(): void { this.online.set(true); }

  @HostListener('window:offline')
  markOffline(): void { this.online.set(false); }

  @HostListener('window:keydown', ['$event'])
  shortcuts(event: KeyboardEvent): void {
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      event.preventDefault();
      this.showHelp.set(true);
    }
  }

  toggleSidebar(): void {
    this.collapsed.update(value => !value);
  }

  private canSee(required?: UserRole): boolean {
    return !required || this.auth.hasRoleAtLeast(required);
  }
}
