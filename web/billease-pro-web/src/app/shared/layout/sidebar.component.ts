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
      <div class="brand"><span class="brand-mark">B</span><span>BillEase Pro</span></div>
      <nav>
        @for (item of items(); track item.link) {
          <a [routerLink]="item.link" routerLinkActive="active" [title]="item.label"><mat-icon>{{ item.icon }}</mat-icon><span>{{ item.label }}</span></a>
        }
      </nav>
      <button type="button" (click)="toggle.emit()"><mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon><span>Collapse</span></button>
    </aside>
  `,
  styles: [`aside { height: 100%; background:#151a22; color:white; padding:18px 14px; display:grid; grid-template-rows:auto 1fr auto; gap:18px; } .brand,a,button{display:flex;align-items:center;gap:10px}.brand{font-weight:700}.brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:6px;background:var(--brand-color,#0f766e)}nav{display:grid;gap:6px;align-content:start}a,button{color:#d7dde8;text-decoration:none;padding:10px 12px;border-radius:6px;background:transparent;border:0;text-align:left;cursor:pointer}a.active,a:hover,button:hover{background:#263241;color:white}.collapsed{width:72px}.collapsed span:not(.brand-mark){display:none}.collapsed a,.collapsed button{justify-content:center}`]
})
export class SidebarComponent {
  readonly items = input<SidebarItem[]>([]);
  readonly collapsed = input(false);
  readonly toggle = output<void>();
}
