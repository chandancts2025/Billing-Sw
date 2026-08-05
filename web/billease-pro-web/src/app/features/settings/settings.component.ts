import { JsonPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SettingsApiService } from '../../core/services/settings-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ShopStore } from '../../core/stores/shop.store';

@Component({
  selector: 'be-settings',
  standalone: true,
  imports: [FormsModule, JsonPipe, TitleCasePipe, RouterLink, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule],
  template: `
    <section class="settings">
      <aside>
        @for (tab of tabs; track tab.key) {
          <a [routerLink]="['/settings', tab.key]" [class.active]="section() === tab.key"><mat-icon>{{ tab.icon }}</mat-icon>{{ tab.label }}</a>
        }
      </aside>
      <main>
        <header>
          <div><strong>{{ section() | titlecase }} Settings</strong><span>Shop-level configuration is cached in memory and refreshed after login.</span></div>
          <button mat-flat-button color="primary" type="button" (click)="save()"><mat-icon>save</mat-icon>Save</button>
        </header>
        @if (section() === 'shop') {
          <section class="form">
            <label>Shop Name<input [(ngModel)]="shopName"></label>
            <label>Brand Color<input type="color" [(ngModel)]="brandColor"></label>
            <label>Idle Timeout Minutes<input type="number" min="5" [(ngModel)]="idleTimeoutMinutes"></label>
            <label><input type="checkbox" [(ngModel)]="preventMultipleOperatorSessions"> Prevent multiple Operator sessions</label>
          </section>
        } @else {
          @if (section() === 'users') {
            <section class="table">
              <div class="table-head"><strong>Users</strong><div><button mat-stroked-button type="button" (click)="showAddUser()">Add</button></div></div>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (u of users() ?? []; track u.id) {
                    <tr>
                      <td>{{ u.fullName || u.fullName }}</td>
                      <td>{{ u.email }}</td>
                      <td>{{ u.role }}</td>
                      <td>{{ u.isActive ? 'Yes' : 'No' }}</td>
                      <td><button mat-icon-button type="button" (click)="showEditUser(u)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="removeUser(u)"><mat-icon>delete</mat-icon></button></td>
                    </tr>
                  }
                </tbody>
              </table>
          @if (userFormVisible()) {
            <section class="form" style="margin-top:12px">
              <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput [(ngModel)]="userForm().fullName"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput [(ngModel)]="userForm().email"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Role</mat-label><mat-select [(ngModel)]="userForm().role"><mat-option value="Operator">Operator</mat-option><mat-option value="Admin">Admin</mat-option><mat-option value="SuperAdmin">SuperAdmin</mat-option></mat-select></mat-form-field>
              <label><input type="checkbox" [(ngModel)]="userForm().isActive"> Active</label>
              <div><button mat-flat-button color="primary" type="button" (click)="submitUser()">Save</button><button mat-button type="button" (click)="cancelUserForm()">Cancel</button></div>
            </section>
          }
            </section>
          } @else if (section() === 'taxes') {
            <section class="table">
              <div class="table-head"><strong>Tax Slabs</strong><div><button mat-stroked-button type="button" (click)="showAddTax()">Add</button></div></div>
              <table>
                <thead><tr><th>Name</th><th>Rate</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (t of taxes() ?? []; track t.id) {
                    <tr>
                      <td>{{ t.name }}</td>
                      <td>{{ t.rate }}%</td>
                      <td>{{ t.isActive ? 'Yes' : 'No' }}</td>
                      <td><button mat-icon-button type="button" (click)="showEditTax(t)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="removeTax(t)"><mat-icon>delete</mat-icon></button></td>
                    </tr>
                  }
                </tbody>
              </table>
          @if (taxFormVisible()) {
            <section class="form" style="margin-top:12px">
              <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="taxForm().name"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Rate (%)</mat-label><input matInput type="number" [(ngModel)]="taxForm().rate"></mat-form-field>
              <label><input type="checkbox" [(ngModel)]="taxForm().isActive"> Active</label>
              <div><button mat-flat-button color="primary" type="button" (click)="submitTax()">Save</button><button mat-button type="button" (click)="cancelTaxForm()">Cancel</button></div>
            </section>
          }
            </section>
          } @else if (section() === 'coupons') {
            <section class="table">
              <div class="table-head"><strong>Coupons</strong><div><button mat-stroked-button type="button" (click)="showAddCoupon()">Add</button></div></div>
              <table>
                <thead><tr><th>Code</th><th>Value</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (c of coupons() ?? []; track c.id) {
                    <tr>
                      <td>{{ c.code }}</td>
                      <td>{{ c.value }}</td>
                      <td>{{ c.isActive ? 'Yes' : 'No' }}</td>
                      <td><button mat-icon-button type="button" (click)="showEditCoupon(c)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="removeCoupon(c)"><mat-icon>delete</mat-icon></button></td>
                    </tr>
                  }
                </tbody>
              </table>
          @if (couponFormVisible()) {
            <section class="form" style="margin-top:12px">
              <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="couponForm().code"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Value</mat-label><input matInput type="number" [(ngModel)]="couponForm().value"></mat-form-field>
              <label><input type="checkbox" [(ngModel)]="couponForm().isActive"> Active</label>
              <div><button mat-flat-button color="primary" type="button" (click)="submitCoupon()">Save</button><button mat-button type="button" (click)="cancelCouponForm()">Cancel</button></div>
            </section>
          }
            </section>
          } @else if (section() === 'discounts') {
            <section class="table">
              <div class="table-head"><strong>Discount Types</strong><div><button mat-stroked-button type="button" (click)="showAddDiscount()">Add</button></div></div>
              <table>
                <thead><tr><th>Name</th><th>Default</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  @for (d of discounts() ?? []; track d.id) {
                    <tr>
                      <td>{{ d.name }}</td>
                      <td>{{ d.defaultValue }}</td>
                      <td>{{ d.isActive ? 'Yes' : 'No' }}</td>
                      <td><button mat-icon-button type="button" (click)="showEditDiscount(d)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="removeDiscount(d)"><mat-icon>delete</mat-icon></button></td>
                    </tr>
                  }
                </tbody>
              </table>
          @if (discountFormVisible()) {
            <section class="form" style="margin-top:12px">
              <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="discountForm().name"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Default value</mat-label><input matInput type="number" [(ngModel)]="discountForm().defaultValue"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Value type</mat-label><mat-select [(ngModel)]="discountForm().valueType"><mat-option value="Percentage">Percentage</mat-option><mat-option value="FlatAmount">FlatAmount</mat-option></mat-select></mat-form-field>
              <label><input type="checkbox" [(ngModel)]="discountForm().isActive"> Active</label>
              <div><button mat-flat-button color="primary" type="button" (click)="submitDiscount()">Save</button><button mat-button type="button" (click)="cancelDiscountForm()">Cancel</button></div>
            </section>
          }
            </section>
          } @else {
            <pre>{{ data() | json }}</pre>
          }
        }
        @if (section() === 'general') {
          <section class="form">
            <div>
              <strong>Two-factor authentication</strong>
              @if (!twoFactor()) {
                <p>Enable two-factor authentication (TOTP) for your account.</p>
                <button mat-stroked-button type="button" (click)="enable2Fa()">Enable 2FA</button>
              } @else {
                <p>Scan the provisioning URI into your authenticator app or copy the secret.</p>
                <div><small>Secret: {{ twoFactor()!.secret }}</small></div>
                <div><small>URI: {{ twoFactor()!.provisioningUri }}</small></div>
                <mat-form-field appearance="outline"><mat-label>Verification code</mat-label><input matInput [(ngModel)]="twoFactorCode"></mat-form-field>
                <button mat-flat-button color="primary" type="button" (click)="verify2Fa()">Verify</button>
              }
            </div>
            <div>
              <strong>Change password</strong>
              <mat-form-field appearance="outline"><mat-label>Current password</mat-label><input matInput type="password" [(ngModel)]="currentPassword"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>New password</mat-label><input matInput type="password" [(ngModel)]="newPassword"></mat-form-field>
              <button mat-flat-button color="primary" type="button" (click)="changePassword()">Change Password</button>
            </div>
          </section>
        }
      </main>
    </section>
  `,
  styles: [`.settings{display:grid;grid-template-columns:240px minmax(0,1fr);gap:14px;padding:14px}aside,main,.form,pre{background:#fff;border:1px solid #dfe5ec;border-radius:8px}aside{display:grid;align-content:start;gap:4px;padding:10px}a{display:flex;gap:8px;align-items:center;text-decoration:none;color:#344054;padding:10px;border-radius:6px}a.active,a:hover{background:#eef7f6;color:var(--brand-color,#0f766e)}main{padding:14px;display:grid;gap:14px;align-content:start}header{display:flex;justify-content:space-between;gap:12px;align-items:center}header div{display:grid;gap:4px}strong{font-size:22px}span{color:#667085}.form{padding:14px;display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:12px}label{display:grid;gap:6px;color:#344054}input{min-height:38px;border:1px solid #cfd6e1;border-radius:6px;padding:0 8px}pre{padding:14px;overflow:auto}@media(max-width:860px){.settings,.form{grid-template-columns:1fr}}`]
})
export class SettingsComponent {
  private readonly api = inject(SettingsApiService);
  private readonly auth = inject(AuthService);
  private readonly shop = inject(ShopStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd), startWith(null)));
  readonly tabs = [
    { key: 'shop', label: 'Shop', icon: 'store' },
    { key: 'users', label: 'Users', icon: 'manage_accounts' },
    { key: 'taxes', label: 'Taxes', icon: 'percent' },
    { key: 'coupons', label: 'Coupons', icon: 'confirmation_number' },
    { key: 'discounts', label: 'Discounts', icon: 'sell' },
    { key: 'general', label: 'General', icon: 'tune' }
  ];
  readonly section = computed(() => {
    this.nav();
    return this.router.url.split('/').filter(Boolean).at(-1) ?? this.route.snapshot.paramMap.get('section') ?? 'shop';
  });
  readonly data = signal<unknown>(null);
  readonly users = signal<any[] | null>(null);
  readonly taxes = signal<any[] | null>(null);
  readonly coupons = signal<any[] | null>(null);
  readonly discounts = signal<any[] | null>(null);

  // Forms state
  readonly userFormVisible = signal(false);
  readonly userForm = signal<{ id?: string | null; fullName: string; email: string; role: string; isActive: boolean }>({ id: null, fullName: '', email: '', role: 'Operator', isActive: true });

  readonly taxFormVisible = signal(false);
  readonly taxForm = signal<{ id?: string | null; name: string; rate: number; isActive: boolean }>({ id: null, name: '', rate: 0, isActive: true });

  readonly couponFormVisible = signal(false);
  readonly couponForm = signal<{ id?: string | null; code: string; value: number; isActive: boolean }>({ id: null, code: '', value: 0, isActive: true });

  readonly discountFormVisible = signal(false);
  readonly discountForm = signal<{ id?: string | null; name: string; defaultValue: number; valueType: string; isActive: boolean }>({ id: null, name: '', defaultValue: 0, valueType: 'Percentage', isActive: true });
  readonly twoFactor = signal<{ secret: string; provisioningUri: string } | null>(null);
  twoFactorCode = '';
  currentPassword = '';
  newPassword = '';
  shopName = 'BillEase Pro';
  brandColor = '#0f766e';
  idleTimeoutMinutes = 30;
  preventMultipleOperatorSessions = true;

  constructor() {
    this.load();
  }

  enable2Fa(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.auth.enableTwoFactor(userId).subscribe({ next: res => { this.twoFactor.set({ secret: res.secret, provisioningUri: res.provisioningUri }); }, error: () => alert('Could not enable 2FA') });
  }

  verify2Fa(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.auth.verifyTwoFactor(userId, this.twoFactorCode).subscribe({ next: ok => { if (ok) { alert('2FA enabled'); this.twoFactor.set(null); } else alert('Invalid code'); }, error: () => alert('Could not verify 2FA') });
  }

  changePassword(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    if (!this.currentPassword || !this.newPassword) return alert('Enter current and new password');
    this.auth.changePassword(userId, { currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({ next: ok => { if (ok) alert('Password changed'); else alert('Could not change password'); }, error: () => alert('Could not change password') });
  }

  load(): void {
    const shopId = this.auth.user()?.shopId;
    if (this.section() === 'shop' && shopId) {
      this.api.shop(shopId).subscribe(settings => {
        this.shop.setSettings(settings);
        this.shopName = settings.shopName;
        this.brandColor = settings.brandColor;
        this.idleTimeoutMinutes = settings.idleTimeoutMinutes;
        this.preventMultipleOperatorSessions = settings.preventMultipleOperatorSessions;
      });
      return;
    }
    const loaders: Record<string, () => unknown> = {
      users: () => this.api.users().subscribe(data => this.users.set(data as any[])),
      taxes: () => this.api.taxSlabs().subscribe(data => this.taxes.set(data as any[])),
      coupons: () => this.api.coupons().subscribe(data => this.coupons.set(data as any[])),
      discounts: () => this.api.discounts().subscribe(data => this.discounts.set(data as any[])),
      general: () => this.data.set({ darkMode: this.shop.darkMode(), offlineBanner: true, keyboardShortcuts: true })
    };
    loaders[this.section()]?.();
  }

  save(): void {
    const shopId = this.auth.user()?.shopId;
    if (!shopId) return;
    const payload = { shopName: this.shopName, brandColor: this.brandColor, idleTimeoutMinutes: this.idleTimeoutMinutes, preventMultipleOperatorSessions: this.preventMultipleOperatorSessions };
    this.api.updateShop(shopId, payload).subscribe(() => this.shop.setSettings({ shopId, darkModeEnabled: this.shop.darkMode(), ...payload }));
  }

  // Users CRUD
  // Users CRUD via form
  showAddUser(): void {
    this.userForm.set({ id: null, fullName: '', email: '', role: 'Operator', isActive: true });
    this.userFormVisible.set(true);
  }

  showEditUser(u: any): void {
    this.userForm.set({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, isActive: !!u.isActive });
    this.userFormVisible.set(true);
  }

  submitUser(): void {
    const model = this.userForm();
    if (!model.fullName || !model.email) return alert('Name and email required');
    const payload = { shopId: this.auth.user()?.shopId, fullName: model.fullName, email: model.email, role: model.role, isActive: model.isActive } as any;
    if (!model.id) {
      payload.password = 'Password@123';
      this.api.createUser(payload).subscribe(() => { this.userFormVisible.set(false); this.load(); });
    } else {
      this.api.updateUser(model.id, payload).subscribe(() => { this.userFormVisible.set(false); this.load(); });
    }
  }

  cancelUserForm(): void { this.userFormVisible.set(false); }

  removeUser(u: any): void {
    if (!confirm('Delete user?')) return;
    this.api.deleteUser(u.id).subscribe(() => this.load());
  }

  // Taxes CRUD
  showAddTax(): void { this.taxForm.set({ id: null, name: '', rate: 0, isActive: true }); this.taxFormVisible.set(true); }
  showEditTax(t: any): void { this.taxForm.set({ id: t.id, name: t.name, rate: Number(t.rate), isActive: !!t.isActive }); this.taxFormVisible.set(true); }
  submitTax(): void {
    const m = this.taxForm();
    if (!m.name) return alert('Name required');
    const payload = { name: m.name, rate: m.rate, taxRegime: 'GST', isActive: !!m.isActive };
    if (!m.id) this.api.createTaxSlab(payload).subscribe(() => { this.taxFormVisible.set(false); this.load(); });
    else this.api.updateTaxSlab(m.id!, payload).subscribe(() => { this.taxFormVisible.set(false); this.load(); });
  }
  cancelTaxForm(): void { this.taxFormVisible.set(false); }
  removeTax(t: any): void { if (!confirm('Delete tax slab?')) return; this.api.deleteTaxSlab(t.id).subscribe(() => this.load()); }

  // Coupons CRUD
  showAddCoupon(): void { this.couponForm.set({ id: null, code: '', value: 0, isActive: true }); this.couponFormVisible.set(true); }
  showEditCoupon(c: any): void { this.couponForm.set({ id: c.id, code: c.code, value: Number(c.value), isActive: !!c.isActive }); this.couponFormVisible.set(true); }
  submitCoupon(): void {
    const m = this.couponForm();
    if (!m.code) return alert('Code required');
    const payload: any = { shopId: this.auth.user()?.shopId, code: m.code, value: m.value, valueType: 'FlatAmount', validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 7*24*3600*1000).toISOString(), isActive: !!m.isActive };
    if (!m.id) this.api.createCoupon(payload).subscribe(() => { this.couponFormVisible.set(false); this.load(); });
    else this.api.updateCoupon(m.id!, payload).subscribe(() => { this.couponFormVisible.set(false); this.load(); });
  }
  cancelCouponForm(): void { this.couponFormVisible.set(false); }
  removeCoupon(c: any): void { if (!confirm('Delete coupon?')) return; this.api.deleteCoupon(c.id).subscribe(() => this.load()); }

  // Discounts CRUD
  showAddDiscount(): void { this.discountForm.set({ id: null, name: '', defaultValue: 0, valueType: 'Percentage', isActive: true }); this.discountFormVisible.set(true); }
  showEditDiscount(d: any): void { this.discountForm.set({ id: d.id, name: d.name, defaultValue: Number(d.defaultValue), valueType: d.valueType, isActive: !!d.isActive }); this.discountFormVisible.set(true); }
  submitDiscount(): void {
    const m = this.discountForm();
    if (!m.name) return alert('Name required');
    const payload = { name: m.name, valueType: m.valueType, defaultValue: m.defaultValue, isActive: !!m.isActive };
    if (!m.id) this.api.createDiscount(payload).subscribe(() => { this.discountFormVisible.set(false); this.load(); });
    else this.api.updateDiscount(m.id!, payload).subscribe(() => { this.discountFormVisible.set(false); this.load(); });
  }
  cancelDiscountForm(): void { this.discountFormVisible.set(false); }
  removeDiscount(d: any): void { if (!confirm('Delete discount?')) return; this.api.deleteDiscount(d.id).subscribe(() => this.load()); }
}
