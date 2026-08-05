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
      <div><strong>{{ shopName() }}</strong><span>{{ userName() }} | {{ role() }}</span></div>
      <nav>
        <a mat-icon-button routerLink="/billing/new" aria-label="Quick bill"><mat-icon>bolt</mat-icon></a>
        <button mat-icon-button type="button" aria-label="Shortcuts" (click)="help.emit()"><mat-icon>keyboard</mat-icon></button>
        <button mat-icon-button type="button" aria-label="Notifications" (click)="notifications.emit()"><mat-icon [matBadge]="unread()" matBadgeColor="warn">notifications</mat-icon></button>
        <button mat-icon-button type="button" aria-label="Theme" (click)="theme.emit()"><mat-icon>dark_mode</mat-icon></button>
        <button mat-icon-button type="button" aria-label="Sign out" (click)="logout.emit()"><mat-icon>logout</mat-icon></button>
      </nav>
    </header>
  `,
  styles: [`header{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:var(--surface,#fff);border-bottom:1px solid var(--border,#e2e6ec)}div{display:grid;gap:2px}span{color:#657386;font-size:13px}nav{display:flex;align-items:center;gap:4px}`]
})
export class TopbarComponent {
  readonly shopName = input('BillEase Pro');
  readonly userName = input('');
  readonly role = input('');
  readonly unread = input(0);
  readonly help = output<void>();
  readonly notifications = output<void>();
  readonly theme = output<void>();
  readonly logout = output<void>();
}
