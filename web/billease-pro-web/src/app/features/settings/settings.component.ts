import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsApiService } from '../../core/services/settings-api.service';
import { ShopStore } from '../../core/stores/shop.store';
import {
  CouponSettings,
  CouponType,
  DiscountSettings,
  GeneralSettings,
  PermissionAction,
  SettingsDraft,
  SettingsSearchHit,
  SettingsSectionKey,
  ShopDetailsSettings,
  ShopType,
  TaxSettings,
  TaxSlabSettings,
  UserSettings
} from './settings.models';

const storageKey = 'billease.settings.workspace';

@Component({
  selector: 'be-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule, TitleCasePipe],
  template: `
    <section class="settings-page">
      <aside class="settings-nav">
        <div class="nav-head">
          <strong>Settings</strong>
          <span>Shop configuration</span>
        </div>
        <label class="settings-search">
          <mat-icon>search</mat-icon>
          <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Search invoice, GST, users..." autocomplete="off">
        </label>
        @if (searchMatches().length) {
          <div class="search-hits">
            @for (hit of searchMatches(); track hit.section + hit.targetId) {
              <button type="button" (click)="jumpTo(hit)">{{ hit.label }}<span>{{ hit.section | titlecase }}</span></button>
            }
          </div>
        }
        <nav>
          @for (tab of tabs; track tab.key) {
            <button type="button" [class.active]="section() === tab.key" (click)="selectSection(tab.key)">
              <mat-icon>{{ tab.icon }}</mat-icon><span>{{ tab.label }}</span>
            </button>
          }
        </nav>
      </aside>

      <section class="mobile-accordion">
        <details open>
          <summary><mat-icon>tune</mat-icon>Settings Sections</summary>
          @for (tab of tabs; track tab.key) {
            <button type="button" [class.active]="section() === tab.key" (click)="selectSection(tab.key)">{{ tab.label }}</button>
          }
        </details>
      </section>

      <main class="settings-main">
        <header class="page-header">
          <div>
            <span class="eyebrow">BillEase Pro</span>
            <h1>{{ currentTab().label }}</h1>
            <p>{{ currentTab().description }}</p>
          </div>
          <div class="header-actions">
            @if (dirty()) { <span class="dirty-pill">Unsaved</span> }
            <button mat-stroked-button type="button" (click)="resetSection()"><mat-icon>restart_alt</mat-icon>Reset</button>
            <button mat-flat-button color="primary" type="button" (click)="saveSection()"><mat-icon>save</mat-icon>Save</button>
          </div>
        </header>

        @if (section() === 'shop') {
          <section class="settings-content">
            <article id="business" class="panel">
              <h2>Business Information</h2>
              <div class="form-grid three">
                <label>Shop Name *<input [(ngModel)]="draft.shop.shopName" (ngModelChange)="touch()" required></label>
                <label>Legal Name<input [(ngModel)]="draft.shop.legalName" (ngModelChange)="touch()"></label>
                <label>Shop Type<select [(ngModel)]="draft.shop.shopType" (ngModelChange)="applyShopTypeDefaults()">@for (type of shopTypes; track type) { <option [ngValue]="type">{{ type }}</option> }</select></label>
              </div>
              <div class="media-grid">
                <label class="upload">Logo upload<input type="file" accept="image/*" (change)="imageSelected($event, 'logo')"><span>{{ draft.shop.logo?.name ?? 'Shown on bill header' }}</span></label>
                <label class="upload">Banner image<input type="file" accept="image/*" (change)="imageSelected($event, 'banner')"><span>{{ draft.shop.banner?.name ?? 'Optional POS/header banner' }}</span></label>
                <div class="brand-preview">
                  @if (draft.shop.logo) { <img [src]="draft.shop.logo.dataUrl" alt="Shop logo preview"> } @else { <mat-icon>storefront</mat-icon> }
                  <strong>{{ draft.shop.shopName }}</strong>
                  <span>{{ draft.shop.legalName || draft.shop.shopType }}</span>
                </div>
              </div>
            </article>

            <article id="address" class="panel">
              <h2>Address & Contact</h2>
              <div class="form-grid three">
                <label>Line 1<input [(ngModel)]="draft.shop.address.line1" (ngModelChange)="touch()"></label>
                <label>Line 2<input [(ngModel)]="draft.shop.address.line2" (ngModelChange)="touch()"></label>
                <label>City<input [(ngModel)]="draft.shop.address.city" (ngModelChange)="touch()"></label>
                <label>State<input [(ngModel)]="draft.shop.address.state" (ngModelChange)="touch()"></label>
                <label>Pincode<input [(ngModel)]="draft.shop.address.pincode" (ngModelChange)="touch()"></label>
                <label>Country<input [(ngModel)]="draft.shop.address.country" (ngModelChange)="touch()"></label>
                <label>Phone Primary<input [(ngModel)]="draft.shop.contact.primaryPhone" (ngModelChange)="touch()"></label>
                <label>Phone Alternate<input [(ngModel)]="draft.shop.contact.alternatePhone" (ngModelChange)="touch()"></label>
                <label>Email<input type="email" [(ngModel)]="draft.shop.contact.email" (ngModelChange)="touch()"></label>
                <label>Website<input [(ngModel)]="draft.shop.contact.website" (ngModelChange)="touch()"></label>
              </div>
            </article>

            <article id="licenses" class="panel">
              <h2>Registration & Licenses</h2>
              <div class="form-grid three">
                <label>GSTIN<input [(ngModel)]="draft.shop.licenses.gstin" (ngModelChange)="touch()"></label>
                <label>PAN<input [(ngModel)]="draft.shop.licenses.pan" (ngModelChange)="touch()"></label>
                @if (showFssai()) { <label>FSSAI License<input [(ngModel)]="draft.shop.licenses.fssaiLicense" (ngModelChange)="touch()"></label> }
                @if (draft.shop.shopType === 'Pharmacy') { <label>Drug License No<input [(ngModel)]="draft.shop.licenses.drugLicenseNo" (ngModelChange)="touch()"></label> }
                <label>Trade License<input [(ngModel)]="draft.shop.licenses.tradeLicense" (ngModelChange)="touch()"></label>
              </div>
            </article>

            <article id="bank" class="panel">
              <h2>Bank Details</h2>
              <div class="form-grid four">
                <label>Bank Name<input [(ngModel)]="draft.shop.bank.bankName" (ngModelChange)="touch()"></label>
                <label>Account No<input [(ngModel)]="draft.shop.bank.accountNo" (ngModelChange)="touch()"></label>
                <label>IFSC<input [(ngModel)]="draft.shop.bank.ifsc" (ngModelChange)="touch()"></label>
                <label>Branch<input [(ngModel)]="draft.shop.bank.branch" (ngModelChange)="touch()"></label>
              </div>
            </article>

            <article id="invoice" class="panel">
              <h2>Invoice Settings</h2>
              <div class="form-grid three">
                <label>Invoice Prefix<input [(ngModel)]="draft.shop.invoice.prefix" (ngModelChange)="touch()"></label>
                <label>Starting Invoice Number<input type="number" min="1" [(ngModel)]="draft.shop.invoice.startingNumber" (ngModelChange)="touch()"></label>
                <label>Bill Copies Count<select [(ngModel)]="draft.shop.invoice.copies" (ngModelChange)="touch()"><option [ngValue]="1">1 copy</option><option [ngValue]="2">2 copies</option><option [ngValue]="3">3 copies</option></select></label>
              </div>
              <div class="toggle-grid">
                <mat-checkbox [(ngModel)]="draft.shop.invoice.showGstin" (ngModelChange)="touch()">Show GSTIN</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.shop.invoice.showPan" (ngModelChange)="touch()">Show PAN</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.shop.invoice.showLicenseNo" (ngModelChange)="touch()">Show License No</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.shop.invoice.showBankDetails" (ngModelChange)="touch()">Show Bank Details</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.shop.invoice.showSignatureLine" (ngModelChange)="touch()">Signature Line</mat-checkbox>
              </div>
              <div class="invoice-layout">
                <div>
                  <label>Terms & Conditions</label>
                  <div class="rich-editor" contenteditable="true" [innerHTML]="draft.shop.invoice.terms" (input)="draft.shop.invoice.terms = editorHtml($event); touch()"></div>
                  <label>Footer Text<textarea rows="3" [(ngModel)]="draft.shop.invoice.footerText" (ngModelChange)="touch()"></textarea></label>
                </div>
                <div class="invoice-preview">
                  <span>Live Preview</span>
                  <strong>{{ invoiceNumberPreview() }}</strong>
                  <h3>{{ draft.shop.shopName }}</h3>
                  <p>{{ draft.shop.address.line1 }}, {{ draft.shop.address.city }}</p>
                  @if (draft.shop.invoice.showGstin) { <p>GSTIN: {{ draft.shop.licenses.gstin || 'Not configured' }}</p> }
                  @if (draft.shop.invoice.showPan) { <p>PAN: {{ draft.shop.licenses.pan || 'Not configured' }}</p> }
                  @if (draft.shop.invoice.showLicenseNo) { <p>License: {{ visibleLicense() || 'Not configured' }}</p> }
                  @if (draft.shop.invoice.showBankDetails) { <p>{{ draft.shop.bank.bankName }} {{ draft.shop.bank.ifsc }}</p> }
                  <footer>{{ draft.shop.invoice.footerText }}</footer>
                </div>
              </div>
            </article>
          </section>
        }

        @if (section() === 'taxes') {
          <section class="settings-content">
            <article id="tax-regime" class="panel">
              <h2>Tax Configuration</h2>
              <div class="form-grid four">
                <label>Tax Regime<select [(ngModel)]="draft.taxes.regime" (ngModelChange)="touch()"><option>GST</option><option>VAT</option><option>Sales Tax</option><option>No Tax</option></select></label>
                <label>GST Mode<select [(ngModel)]="draft.taxes.gstMode" (ngModelChange)="touch()"><option>Exclusive</option><option>Inclusive</option></select></label>
                <mat-checkbox [(ngModel)]="draft.taxes.interstateDefault" (ngModelChange)="touch()">Interstate by default</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.taxes.reverseCharge" (ngModelChange)="touch()">Reverse charge mechanism</mat-checkbox>
              </div>
            </article>
            <article id="tax-slabs" class="panel">
              <div class="section-title"><h2>Tax Slab CRUD</h2><button mat-stroked-button type="button" (click)="addTaxSlab()"><mat-icon>add</mat-icon>Add Slab</button></div>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Rate</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Default Category</th><th></th></tr></thead>
                  <tbody>
                    @for (slab of draft.taxes.slabs; track slab.id) {
                      <tr>
                        <td><input [(ngModel)]="slab.name" (ngModelChange)="touch()"></td>
                        <td><input type="number" [(ngModel)]="slab.rate" (ngModelChange)="splitTax(slab)"></td>
                        <td><input type="number" [(ngModel)]="slab.cgst" (ngModelChange)="touch()"></td>
                        <td><input type="number" [(ngModel)]="slab.sgst" (ngModelChange)="touch()"></td>
                        <td><input type="number" [(ngModel)]="slab.igst" (ngModelChange)="touch()"></td>
                        <td><select [(ngModel)]="slab.category" (ngModelChange)="touch()">@for (category of categories; track category) { <option>{{ category }}</option> }</select></td>
                        <td><button mat-icon-button type="button" (click)="removeTaxSlab(slab.id)"><mat-icon>delete</mat-icon></button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        }

        @if (section() === 'discounts') {
          <section class="settings-content">
            <article id="discount-rules" class="panel">
              <h2>Global Discount Rules</h2>
              <div class="form-grid four">
                <label>Max Bill Discount %<input type="number" [(ngModel)]="draft.discounts.maxBillDiscountPercent" (ngModelChange)="touch()"></label>
                <label>Max Item Discount %<input type="number" [(ngModel)]="draft.discounts.maxItemDiscountPercent" (ngModelChange)="touch()"></label>
                <label>Require Approval Above %<input type="number" [(ngModel)]="draft.discounts.approvalThresholdPercent" (ngModelChange)="touch()"></label>
                <mat-checkbox [(ngModel)]="draft.discounts.allowOperatorDiscounts" (ngModelChange)="touch()">Allow operator discounts</mat-checkbox>
              </div>
            </article>
          </section>
        }

        @if (section() === 'coupons') {
          <section class="settings-content">
            <article id="coupon-form" class="panel">
              <div class="section-title">
                <h2>Coupon Management</h2>
                <div><button mat-stroked-button type="button" (click)="generateCouponCode()"><mat-icon>casino</mat-icon>Random Code</button><button mat-stroked-button type="button" (click)="bulkGenerateCoupons()"><mat-icon>auto_awesome_motion</mat-icon>Bulk Generate</button></div>
              </div>
              <div class="form-grid four">
                <label>Code<input [(ngModel)]="couponForm.code" (ngModelChange)="touch()"></label>
                <label>Type<select [(ngModel)]="couponForm.type" (ngModelChange)="touch()"><option [ngValue]="'Percentage'">%</option><option [ngValue]="'Flat'">Flat</option></select></label>
                <label>Value<input type="number" [(ngModel)]="couponForm.value" (ngModelChange)="touch()"></label>
                <label>Min Order<input type="number" [(ngModel)]="couponForm.minOrder" (ngModelChange)="touch()"></label>
                <label>Max Discount Cap<input type="number" [(ngModel)]="couponForm.maxDiscountCap" (ngModelChange)="touch()"></label>
                <label>Valid From<input type="date" [(ngModel)]="couponForm.validFrom" (ngModelChange)="touch()"></label>
                <label>Valid To<input type="date" [(ngModel)]="couponForm.validTo" (ngModelChange)="touch()"></label>
                <label>Usage Limit<input type="number" [(ngModel)]="couponForm.usageLimit" (ngModelChange)="touch()"></label>
              </div>
              <div class="category-chips">
                @for (category of categories; track category) {
                  <button type="button" [class.active]="couponForm.applicableCategories.includes(category)" (click)="toggleCouponCategory(category)">{{ category }}</button>
                }
              </div>
              <button mat-flat-button color="primary" type="button" (click)="upsertCoupon()"><mat-icon>confirmation_number</mat-icon>{{ couponForm.id ? 'Update Coupon' : 'Create Coupon' }}</button>
            </article>
            <article id="coupon-list" class="panel">
              <h2>Coupon List</h2>
              <div class="coupon-grid">
                @for (coupon of draft.coupons; track coupon.id) {
                  <article class="coupon-card">
                    <div><strong>{{ coupon.code }}</strong><span>{{ coupon.type }} {{ coupon.value }} | Used {{ coupon.usedCount }} / {{ coupon.usageLimit }}</span></div>
                    <div class="qr" [title]="'Printable code for ' + coupon.code">@for (cell of qrCells(coupon.code); track $index) { <i [class.on]="cell"></i> }</div>
                    <div class="coupon-actions"><button mat-icon-button type="button" (click)="editCoupon(coupon)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="removeCoupon(coupon.id)"><mat-icon>delete</mat-icon></button></div>
                  </article>
                }
              </div>
            </article>
          </section>
        }

        @if (section() === 'users') {
          <section class="settings-content">
            <article id="user-list" class="panel">
              <div class="section-title"><h2>User Management</h2><button mat-stroked-button type="button" (click)="newUser()"><mat-icon>person_add</mat-icon>Add User</button></div>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
                  <tbody>
                    @for (user of draft.users; track user.id) {
                      <tr><td>{{ user.name }}</td><td>{{ user.email }}</td><td>{{ user.phone }}</td><td>{{ user.role }}</td><td><span class="status">{{ user.status }}</span></td><td>{{ user.lastLogin | date:'medium' }}</td><td><button mat-icon-button type="button" (click)="editUser(user)"><mat-icon>edit</mat-icon></button></td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
            <article id="user-form" class="panel">
              <h2>Add/Edit User</h2>
              <div class="form-grid four">
                <label>Name<input [(ngModel)]="userForm.name" (ngModelChange)="touch()"></label>
                <label>Email<input type="email" [(ngModel)]="userForm.email" (ngModelChange)="touch()"></label>
                <label>Phone<input [(ngModel)]="userForm.phone" (ngModelChange)="touch()"></label>
                <label>DOB<input type="date" [(ngModel)]="userForm.dob" (ngModelChange)="touch()"></label>
                <label>Gender<select [(ngModel)]="userForm.gender" (ngModelChange)="touch()"><option>NotSpecified</option><option>Female</option><option>Male</option><option>NonBinary</option><option>PreferNotToSay</option></select></label>
                <label>Role<select [(ngModel)]="userForm.role" (ngModelChange)="touch()">@for (role of editableRoles(); track role) { <option [ngValue]="role">{{ role }}</option> }</select></label>
                <label>Shift Start<input type="time" [(ngModel)]="userForm.shiftStart" (ngModelChange)="touch()"></label>
                <label>Shift End<input type="time" [(ngModel)]="userForm.shiftEnd" (ngModelChange)="touch()"></label>
                <label>Max Discount Allowed %<input type="number" [(ngModel)]="userForm.maxDiscountAllowedPercent" (ngModelChange)="touch()"></label>
                <label>Status<select [(ngModel)]="userForm.status" (ngModelChange)="touch()"><option>Active</option><option>Inactive</option><option>Locked</option></select></label>
                <mat-checkbox [(ngModel)]="userForm.forcePasswordReset" (ngModelChange)="touch()">Force password reset</mat-checkbox>
                <mat-checkbox [(ngModel)]="userForm.enforce2Fa" (ngModelChange)="touch()">Enforce 2FA</mat-checkbox>
              </div>
              <div class="user-actions"><button mat-flat-button color="primary" type="button" (click)="upsertUser()"><mat-icon>save</mat-icon>{{ userForm.id ? 'Update User' : 'Add User' }}</button><button mat-stroked-button type="button" (click)="newUser()">Clear</button></div>
              <div class="history-list"><h3>Login History</h3>@for (login of userForm.loginHistory; track login) { <span>{{ login | date:'medium' }}</span> } @empty { <span>No login events yet.</span> }</div>
            </article>
            <article id="permissions" class="panel">
              <h2>Role Permissions Matrix</h2>
              <div class="table-wrap">
                <table class="permission-table">
                  <thead><tr><th>Feature Permission</th>@for (role of roles; track role) { <th>{{ role }}</th> }</tr></thead>
                  <tbody>
                    @for (feature of permissionFeatures; track feature) {
                      @for (action of permissionActions; track action) {
                        <tr><td>{{ feature }} / {{ action }}</td>@for (role of roles; track role) { <td><mat-checkbox [disabled]="!canEditPermissions()" [ngModel]="permission(role, feature, action)" (ngModelChange)="setPermission(role, feature, action, $event)" /></td> }</tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        }

        @if (section() === 'general') {
          <section class="settings-content">
            <article id="operations" class="panel">
              <h2>Business Operations</h2>
              <div class="hours-grid">
                @for (day of draft.general.operations.workingHours; track day.day) {
                  <div><mat-checkbox [(ngModel)]="day.open" (ngModelChange)="touch()">{{ day.day }}</mat-checkbox><input type="time" [(ngModel)]="day.openTime" (ngModelChange)="touch()" [disabled]="!day.open"><input type="time" [(ngModel)]="day.closeTime" (ngModelChange)="touch()" [disabled]="!day.open"></div>
                }
              </div>
              <div class="form-grid four">
                <label>Financial Year Start Month<select [(ngModel)]="draft.general.operations.financialYearStartMonth" (ngModelChange)="touch()">@for (month of months; track month) { <option>{{ month }}</option> }</select></label>
                <label>Currency Symbol<input [(ngModel)]="draft.general.operations.currencySymbol" (ngModelChange)="touch()"></label>
                <label>Decimal Places<input type="number" min="0" max="4" [(ngModel)]="draft.general.operations.decimalPlaces" (ngModelChange)="touch()"></label>
                <label>Rounding Method<select [(ngModel)]="draft.general.operations.roundingMethod" (ngModelChange)="touch()"><option>0.5 up</option><option>always up</option><option>always down</option></select></label>
                <label>Date Format<select [(ngModel)]="draft.general.operations.dateFormat" (ngModelChange)="touch()"><option>dd/MM/yyyy</option><option>MM/dd/yyyy</option><option>yyyy-MM-dd</option></select></label>
                <label>Time Zone<input [(ngModel)]="draft.general.operations.timeZone" (ngModelChange)="touch()"></label>
                <label>Language<select [(ngModel)]="draft.general.operations.language" (ngModelChange)="touch()"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option></select></label>
              </div>
            </article>
            <article id="pos" class="panel">
              <h2>POS Behavior</h2>
              <div class="form-grid four">
                <label>Default Payment Mode<select [(ngModel)]="draft.general.pos.defaultPaymentMode" (ngModelChange)="touch()"><option>Cash</option><option>Card</option><option>UPI</option><option>Credit</option><option>Split</option></select></label>
                <label>Bill Copies Default<select [(ngModel)]="draft.general.pos.defaultBillCopies" (ngModelChange)="touch()"><option [ngValue]="1">1 copy</option><option [ngValue]="2">2 copies</option><option [ngValue]="3">3 copies</option></select></label>
                <mat-checkbox [(ngModel)]="draft.general.pos.autoConfirmOnPrint" (ngModelChange)="touch()">Auto-confirm bill on print</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.pos.requireCustomer" (ngModelChange)="touch()">Require customer on every bill</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.pos.lowStockWarning" (ngModelChange)="touch()">Low stock warning on billing</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.pos.autoPrintAfterConfirm" (ngModelChange)="touch()">Print automatically after confirm</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.pos.preventMultipleOperatorSessions" (ngModelChange)="touch()">Prevent multiple Operator sessions</mat-checkbox>
              </div>
            </article>
            <article id="notifications" class="panel">
              <h2>Notification Settings</h2>
              <div class="form-grid four">
                <label>Low Stock Threshold<input type="number" [(ngModel)]="draft.general.notifications.globalLowStockThreshold" (ngModelChange)="touch()"></label>
                <label>Expiry Alert Days<select multiple [(ngModel)]="draft.general.notifications.expiryAlertDays" (ngModelChange)="touch()"><option [ngValue]="15">15 days</option><option [ngValue]="30">30 days</option><option [ngValue]="60">60 days</option></select></label>
                <mat-checkbox [(ngModel)]="draft.general.notifications.dailySummaryEmail" (ngModelChange)="touch()">Daily summary email</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.notifications.lowStockDigest" (ngModelChange)="touch()">Low stock digest</mat-checkbox>
                <mat-checkbox [(ngModel)]="draft.general.notifications.paymentDueReminders" (ngModelChange)="touch()">Payment due reminders</mat-checkbox>
                <label class="wide">WhatsApp API Key<input type="password" [(ngModel)]="draft.general.notifications.whatsappProviderApiKey" (ngModelChange)="touch()" autocomplete="off"></label>
              </div>
            </article>
            <article id="loyalty" class="panel">
              <h2>Loyalty Program</h2>
              <div class="form-grid four">
                <mat-checkbox [(ngModel)]="draft.general.loyalty.enabled" (ngModelChange)="touch()">Enable loyalty points</mat-checkbox>
                <label>Earn Points<input type="number" [(ngModel)]="draft.general.loyalty.earnPoints" (ngModelChange)="touch()"></label>
                <label>Per Rs. Spent<input type="number" [(ngModel)]="draft.general.loyalty.earnPerAmount" (ngModelChange)="touch()"></label>
                <label>Redeem Points<input type="number" [(ngModel)]="draft.general.loyalty.redeemPoints" (ngModelChange)="touch()"></label>
                <label>Redeem Amount<input type="number" [(ngModel)]="draft.general.loyalty.redeemAmount" (ngModelChange)="touch()"></label>
                <label>Min Points To Redeem<input type="number" [(ngModel)]="draft.general.loyalty.minPointsToRedeem" (ngModelChange)="touch()"></label>
                <label>Points Expiry Days<input type="number" [(ngModel)]="draft.general.loyalty.expiryDays" (ngModelChange)="touch()"></label>
              </div>
            </article>
          </section>
        }

        <article id="audit" class="panel audit-panel">
          <div class="section-title"><h2>Change History</h2><button mat-stroked-button type="button" (click)="addAudit('Viewed audit log')"><mat-icon>history</mat-icon>Refresh</button></div>
          <div class="audit-list">
            @for (entry of sectionAudit(); track entry.id) {
              <div><strong>{{ entry.action }}</strong><span>{{ entry.summary }}</span><small>{{ entry.actor }} | {{ entry.at | date:'medium' }}</small></div>
            } @empty {
              <p>No changes recorded for this section yet.</p>
            }
          </div>
        </article>

        <footer class="sticky-save">
          <span>{{ dirty() ? 'You have unsaved changes in this settings workspace.' : 'All changes saved locally.' }}</span>
          <div><button mat-stroked-button type="button" (click)="resetSection()">Reset to Defaults</button><button mat-flat-button color="primary" type="button" (click)="saveSection()">Save {{ currentTab().label }}</button></div>
        </footer>
      </main>
    </section>
  `,
  styles: [`
    .settings-page{display:grid;grid-template-columns:288px minmax(0,1fr);min-height:calc(100vh - 74px);background:#f6f7f9}.settings-nav{position:sticky;top:64px;height:calc(100vh - 64px);background:#fff;border-right:1px solid #dfe5ec;padding:14px;display:grid;grid-template-rows:auto auto auto 1fr;gap:12px;align-content:start;overflow:auto}.nav-head{display:grid;gap:2px}.nav-head strong{font-size:20px}.nav-head span,.page-header p,.eyebrow,.search-hits span,.coupon-card span,.audit-list span,.audit-list small{color:#667085}.settings-search{height:42px;display:flex;align-items:center;gap:8px;border:1px solid #cfd6e1;border-radius:6px;padding:0 10px;background:#fff}.settings-search input{border:0;outline:0;width:100%;min-width:0}.search-hits{display:grid;gap:4px;border:1px solid #dfe5ec;border-radius:6px;padding:6px}.search-hits button{border:0;background:#f8fafc;border-radius:5px;padding:8px;text-align:left;display:grid;gap:2px;cursor:pointer}nav{display:grid;gap:6px}nav button,.mobile-accordion button{display:flex;align-items:center;gap:10px;border:0;background:transparent;border-radius:6px;padding:10px;text-align:left;cursor:pointer;color:#344054}nav button.active,nav button:hover,.mobile-accordion button.active{background:#eef7f6;color:var(--brand-color,#0f766e)}.mobile-accordion{display:none;padding:10px;background:#fff;border-bottom:1px solid #dfe5ec}.mobile-accordion summary{display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer}.settings-main{min-width:0;padding:16px;display:grid;gap:14px;align-content:start}.page-header,.section-title,.sticky-save{display:flex;justify-content:space-between;align-items:center;gap:12px}.page-header h1{margin:0;font-size:28px}.page-header p{margin:3px 0 0}.eyebrow{font-size:12px;text-transform:uppercase;font-weight:700;letter-spacing:.06em}.header-actions,.section-title>div,.coupon-actions,.user-actions,.sticky-save>div{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.dirty-pill{border:1px solid #fdb022;color:#b54708;background:#fffaeb;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:700}.settings-content{display:grid;gap:14px}.panel{background:#fff;border:1px solid #dfe5ec;border-radius:8px;padding:14px;display:grid;gap:12px}.panel h2{margin:0;font-size:18px}.panel h3{margin:6px 0 0;font-size:14px}.form-grid{display:grid;gap:12px;align-items:end}.form-grid.three{grid-template-columns:repeat(3,minmax(160px,1fr))}.form-grid.four{grid-template-columns:repeat(4,minmax(140px,1fr))}.wide{grid-column:span 2}label{display:grid;gap:6px;font-size:13px;color:#344054;font-weight:600}input,select,textarea{width:100%;min-height:38px;border:1px solid #cfd6e1;border-radius:6px;padding:0 9px;background:#fff;color:#19202a}textarea{padding:9px;resize:vertical}.media-grid,.invoice-layout{display:grid;grid-template-columns:1fr 1fr 300px;gap:12px;align-items:stretch}.invoice-layout{grid-template-columns:minmax(0,1fr) 360px}.upload{border:1px dashed #b8c2d0;border-radius:8px;padding:14px;align-content:center;background:#fbfcfe}.upload input{border:0;padding:0}.brand-preview,.invoice-preview{border:1px solid #dfe5ec;border-radius:8px;padding:14px;display:grid;gap:5px;align-content:start;background:#f8fafc}.brand-preview img{max-width:80px;max-height:52px;object-fit:contain}.brand-preview mat-icon{font-size:42px;width:42px;height:42px;color:var(--brand-color,#0f766e)}.toggle-grid,.category-chips{display:flex;flex-wrap:wrap;gap:8px 14px}.rich-editor{min-height:118px;border:1px solid #cfd6e1;border-radius:6px;padding:10px;background:#fff;outline-color:var(--brand-color,#0f766e)}.invoice-preview strong{justify-self:start;background:#eef7f6;color:var(--brand-color,#0f766e);border-radius:5px;padding:4px 8px}.invoice-preview h3{font-size:20px}.invoice-preview p,.invoice-preview footer{margin:0;color:#475467;font-size:13px}.table-wrap{overflow:auto;border:1px solid #edf1f6;border-radius:8px}table{width:100%;border-collapse:collapse;min-width:840px}th,td{padding:9px;border-bottom:1px solid #edf1f6;text-align:left}th{background:#f8fafc;color:#475467;font-size:12px}td input,td select{min-height:34px}.permission-table td:not(:first-child),.permission-table th:not(:first-child){text-align:center}.category-chips button{border:1px solid #d0d5dd;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer}.category-chips button.active{background:#eef7f6;border-color:var(--brand-color,#0f766e);color:var(--brand-color,#0f766e)}.coupon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.coupon-card{border:1px solid #e4e8ef;border-radius:8px;padding:10px;display:grid;grid-template-columns:1fr 72px auto;gap:10px;align-items:center}.coupon-card>div:first-child{display:grid;gap:3px}.qr{width:64px;height:64px;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;background:#fff;border:1px solid #111;padding:4px}.qr i{background:#fff}.qr i.on{background:#111}.status{display:inline-flex;border-radius:999px;background:#eef7f6;color:var(--brand-color,#0f766e);padding:4px 8px;font-size:12px;font-weight:700}.history-list{display:flex;gap:8px;flex-wrap:wrap}.history-list span{border:1px solid #d0d5dd;border-radius:999px;padding:5px 8px;font-size:12px;color:#475467}.hours-grid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:8px}.hours-grid div{display:grid;grid-template-columns:120px 1fr 1fr;gap:8px;align-items:center;border:1px solid #edf1f6;border-radius:6px;padding:8px}.audit-list{display:grid;gap:8px}.audit-list div{display:grid;gap:2px;border-left:3px solid var(--brand-color,#0f766e);padding:8px 10px;background:#f8fafc;border-radius:6px}.audit-list p{margin:0;color:#667085}.sticky-save{position:sticky;bottom:0;z-index:5;background:#ffffffe8;backdrop-filter:blur(8px);border:1px solid #dfe5ec;border-radius:8px;padding:10px 12px;box-shadow:0 -8px 24px rgba(16,24,40,.08)}.sticky-save span{color:#667085}@media(max-width:1100px){.settings-page{grid-template-columns:1fr}.settings-nav{display:none}.mobile-accordion{display:block}.settings-main{padding:12px}.form-grid.three,.form-grid.four,.media-grid,.invoice-layout,.hours-grid{grid-template-columns:1fr}.page-header,.sticky-save{align-items:flex-start;flex-direction:column}.coupon-card{grid-template-columns:1fr auto}.coupon-actions{grid-column:1 / -1}.wide{grid-column:auto}}
  `]
})
export class SettingsComponent {
  private readonly api = inject(SettingsApiService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shopStore = inject(ShopStore);
  private readonly nav = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd), startWith(null)));

  readonly dirty = signal(false);
  readonly searchTerm = signal('');
  readonly shopTypes: ShopType[] = ['Supermarket', 'Grocery', 'Electronics', 'Fashion', 'Pharmacy', 'Restaurant', 'Hotel', 'Hardware', 'General'];
  readonly categories = ['Medicines', 'Grocery', 'Fashion', 'Electronics', 'Food', 'Services', 'General'];
  readonly months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  readonly roles = ['SuperAdmin', 'Admin', 'Operator'] as const;
  readonly permissionActions: PermissionAction[] = ['create', 'read', 'update', 'delete'];
  readonly permissionFeatures = ['Billing', 'Inventory', 'Purchases', 'Customers', 'Reports', 'Settings', 'Users'];
  readonly tabs: { key: SettingsSectionKey; label: string; icon: string; description: string }[] = [
    { key: 'shop', label: 'Shop Details', icon: 'store', description: 'Business identity, licenses, invoice format, bill header, and footer details.' },
    { key: 'taxes', label: 'Tax Configuration', icon: 'percent', description: 'GST/VAT regime, inclusive/exclusive behavior, slabs, category defaults, and B2B controls.' },
    { key: 'discounts', label: 'Discount Rules', icon: 'sell', description: 'Global limits, operator permissions, and approval thresholds.' },
    { key: 'coupons', label: 'Coupons', icon: 'confirmation_number', description: 'Promotional coupon creation, printable code cards, usage limits, and validity.' },
    { key: 'users', label: 'Users & Roles', icon: 'manage_accounts', description: 'User access, shift rules, security requirements, and permission matrix.' },
    { key: 'general', label: 'General Settings', icon: 'tune', description: 'Operations, POS behavior, notifications, currency, language, and loyalty program.' }
  ];
  readonly searchIndex: SettingsSearchHit[] = [
    { label: 'Invoice prefix and live preview', section: 'shop', targetId: 'invoice' },
    { label: 'GSTIN, PAN, license fields', section: 'shop', targetId: 'licenses' },
    { label: 'Bank details on bill footer', section: 'shop', targetId: 'bank' },
    { label: 'GST mode and interstate IGST', section: 'taxes', targetId: 'tax-regime' },
    { label: 'Tax slab CRUD', section: 'taxes', targetId: 'tax-slabs' },
    { label: 'Discount approval threshold', section: 'discounts', targetId: 'discount-rules' },
    { label: 'Coupon bulk generation', section: 'coupons', targetId: 'coupon-form' },
    { label: 'Role permissions matrix', section: 'users', targetId: 'permissions' },
    { label: 'Working hours and financial year', section: 'general', targetId: 'operations' },
    { label: 'POS print behavior', section: 'general', targetId: 'pos' },
    { label: 'Low stock and expiry notifications', section: 'general', targetId: 'notifications' },
    { label: 'Loyalty points', section: 'general', targetId: 'loyalty' }
  ];

  draft = this.loadDraft();
  couponForm = this.blankCoupon();
  userForm = this.blankUser();

  constructor() {
    const shopId = this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001';
    if (shopId) {
      this.api.shop(shopId).subscribe({
        next: (data: any) => {
          if (!data) return;
          if (data.shopName) this.draft.shop.shopName = data.shopName;
          if (data.legalName) this.draft.shop.legalName = data.legalName;
          if (data.taxRegistrationNumber) this.draft.shop.licenses.gstin = data.taxRegistrationNumber;
          if (data.phone) this.draft.shop.contact.primaryPhone = data.phone;
          if (data.email) this.draft.shop.contact.email = data.email;
          if (data.addressLine1) this.draft.shop.address.line1 = data.addressLine1;
          if (data.city) this.draft.shop.address.city = data.city;
          if (data.state) this.draft.shop.address.state = data.state;
          if (data.postalCode) this.draft.shop.address.pincode = data.postalCode;
          if (data.country) this.draft.shop.address.country = data.country;
        },
        error: () => {}
      });
    }
  }

  readonly section = computed<SettingsSectionKey>(() => {
    this.nav();
    const section = this.router.url.split('?')[0].split('/').filter(Boolean).at(-1) as SettingsSectionKey | undefined;
    return this.tabs.some(tab => tab.key === section) ? section! : (this.route.snapshot.paramMap.get('section') as SettingsSectionKey | null) ?? 'shop';
  });
  readonly currentTab = computed(() => this.tabs.find(tab => tab.key === this.section()) ?? this.tabs[0]);
  readonly searchMatches = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return [];
    return this.searchIndex.filter(hit => `${hit.label} ${hit.section}`.toLowerCase().includes(term)).slice(0, 8);
  });
  readonly sectionAudit = computed(() => this.draft.auditLog.filter(entry => entry.section === this.section()).slice(0, 8));
  readonly canEditPermissions = computed(() => this.auth.role() === 'SuperAdmin');
  readonly editableRoles = computed(() => this.auth.role() === 'SuperAdmin' ? [...this.roles] : this.roles.filter(role => role !== 'SuperAdmin'));

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (!this.dirty()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  canDeactivate(): boolean {
    return !this.dirty() || window.confirm('You have unsaved settings changes. Leave this page?');
  }

  selectSection(section: SettingsSectionKey): void {
    if (section === this.section() || !this.canDeactivate()) return;
    void this.router.navigate(['/settings', section]);
  }

  jumpTo(hit: SettingsSearchHit): void {
    if (!this.canDeactivate()) return;
    this.searchTerm.set('');
    void this.router.navigate(['/settings', hit.section]).then(() => {
      window.setTimeout(() => document.getElementById(hit.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
  }

  touch(): void { this.dirty.set(true); }

  saveSection(): void {
    this.addAudit(`Saved ${this.currentTab().label}`);
    localStorage.setItem(storageKey, JSON.stringify(this.draft));
    this.dirty.set(false);
    this.applyRuntimeSettings();
    this.notifications.success(`${this.currentTab().label} saved.`);
  }

  resetSection(): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Reset settings', message: `Reset ${this.currentTab().label} to defaults?`, confirmText: 'Reset' } }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const defaults = createDefaultSettings();
      const key = this.section();
      this.draft[key] = structuredClone(defaults[key]) as never;
      if (key === 'coupons') this.couponForm = this.blankCoupon();
      if (key === 'users') this.userForm = this.blankUser();
      this.addAudit(`Reset ${this.currentTab().label}`);
      this.touch();
      this.notifications.info(`${this.currentTab().label} reset to defaults.`);
    });
  }

  showFssai(): boolean {
    return this.draft.shop.shopType === 'Restaurant' || this.draft.shop.shopType === 'Hotel' || this.draft.shop.shopType === 'Grocery' || this.draft.shop.shopType === 'Supermarket';
  }

  applyShopTypeDefaults(): void {
    const prefix: Record<ShopType, string> = { Supermarket: 'SM-', Pharmacy: 'PH-', Grocery: 'GR-', Fashion: 'FS-', Restaurant: 'REST-', Hotel: 'HT-', Electronics: 'EL-', Hardware: 'HW-', General: 'BILL-' };
    this.draft.shop.invoice.prefix = prefix[this.draft.shop.shopType];
    this.touch();
  }

  imageSelected(event: Event, target: 'logo' | 'banner'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.draft.shop[target] = { name: file.name, dataUrl: String(reader.result) };
      this.touch();
    };
    reader.readAsDataURL(file);
  }

  editorHtml(event: Event): string { return (event.target as HTMLElement).innerHTML; }
  invoiceNumberPreview(): string { return `${this.draft.shop.invoice.prefix}${String(this.draft.shop.invoice.startingNumber).padStart(5, '0')}`; }
  visibleLicense(): string {
    if (this.draft.shop.shopType === 'Pharmacy') return this.draft.shop.licenses.drugLicenseNo;
    if (this.showFssai()) return this.draft.shop.licenses.fssaiLicense;
    return this.draft.shop.licenses.tradeLicense;
  }

  splitTax(slab: TaxSlabSettings): void {
    slab.cgst = Number((slab.rate / 2).toFixed(2));
    slab.sgst = Number((slab.rate / 2).toFixed(2));
    slab.igst = Number(slab.rate.toFixed(2));
    this.touch();
  }

  addTaxSlab(): void {
    this.draft.taxes.slabs.push({ id: crypto.randomUUID(), name: 'New Slab', rate: 0, cgst: 0, sgst: 0, igst: 0, category: 'General', isDefault: false });
    this.touch();
  }

  removeTaxSlab(id: string): void {
    this.draft.taxes.slabs = this.draft.taxes.slabs.filter(slab => slab.id !== id);
    this.touch();
  }

  generateCouponCode(): void {
    this.couponForm.code = `PROMO${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    this.touch();
  }

  bulkGenerateCoupons(): void {
    for (let i = 0; i < 10; i += 1) {
      this.draft.coupons.unshift({ ...this.blankCoupon(), id: crypto.randomUUID(), code: `BULK${Math.random().toString(36).slice(2, 8).toUpperCase()}`, value: 10, usageLimit: 1 });
    }
    this.addAudit('Bulk generated 10 coupons');
    this.touch();
  }

  toggleCouponCategory(category: string): void {
    const selected = this.couponForm.applicableCategories;
    this.couponForm.applicableCategories = selected.includes(category) ? selected.filter(item => item !== category) : [...selected, category];
    this.touch();
  }

  upsertCoupon(): void {
    const coupon = { ...this.couponForm, code: this.couponForm.code.trim().toUpperCase() || `CPN${Date.now()}` };
    const index = this.draft.coupons.findIndex(item => item.id === coupon.id);
    if (index >= 0) this.draft.coupons[index] = coupon;
    else this.draft.coupons.unshift({ ...coupon, id: crypto.randomUUID() });
    this.couponForm = this.blankCoupon();
    this.addAudit('Updated coupon rules');
    this.touch();
  }

  editCoupon(coupon: CouponSettings): void {
    this.couponForm = structuredClone(coupon);
    document.getElementById('coupon-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  removeCoupon(id: string): void {
    this.draft.coupons = this.draft.coupons.filter(coupon => coupon.id !== id);
    this.touch();
  }

  qrCells(code: string): boolean[] {
    let seed = [...code].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Array.from({ length: 64 }, (_, index) => {
      seed = (seed * 1103515245 + 12345 + index) % 2147483647;
      return index < 8 || index % 8 === 0 || seed % 3 === 0;
    });
  }

  newUser(): void { this.userForm = this.blankUser(); }
  editUser(user: UserSettings): void {
    this.userForm = structuredClone(user);
    document.getElementById('user-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  upsertUser(): void {
    const user = { ...this.userForm, name: this.userForm.name.trim(), email: this.userForm.email.trim().toLowerCase() };
    if (!user.name || !user.email) {
      this.notifications.warning('Name and email are required.');
      return;
    }
    const index = this.draft.users.findIndex(item => item.id === user.id);
    if (index >= 0) this.draft.users[index] = user;
    else this.draft.users.unshift({ ...user, id: crypto.randomUUID() });
    this.addAudit('Updated user access');
    this.newUser();
    this.touch();
  }

  permission(role: string, feature: string, action: PermissionAction): boolean {
    return !!this.draft.permissions[role]?.[feature]?.[action];
  }

  setPermission(role: string, feature: string, action: PermissionAction, value: boolean): void {
    if (!this.canEditPermissions()) return;
    this.draft.permissions[role] ??= {};
    this.draft.permissions[role][feature] ??= { create: false, read: false, update: false, delete: false };
    this.draft.permissions[role][feature][action] = value;
    this.touch();
  }

  addAudit(action: string): void {
    this.draft.auditLog.unshift({ id: crypto.randomUUID(), section: this.section(), action, actor: this.auth.user()?.fullName ?? 'System', at: new Date().toISOString(), summary: `${this.currentTab().label} changed from settings workspace.` });
  }

  private loadDraft(): SettingsDraft {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return createDefaultSettings();
    try {
      return { ...createDefaultSettings(), ...JSON.parse(stored) } as SettingsDraft;
    } catch {
      return createDefaultSettings();
    }
  }

  private applyRuntimeSettings(): void {
    const shopId = this.auth.user()?.shopId ?? '10000000-0000-0000-0000-000000000001';
    this.shopStore.setSettings({
      shopId,
      shopName: this.draft.shop.shopName,
      brandColor: '#0f766e',
      darkModeEnabled: this.shopStore.darkMode(),
      idleTimeoutMinutes: 30,
      preventMultipleOperatorSessions: this.draft.general.pos.preventMultipleOperatorSessions
    });
    if (shopId) {
      this.api.updateShop(shopId, {
        shopName: this.draft.shop.shopName,
        legalName: this.draft.shop.legalName,
        industryType: this.draft.shop.shopType,
        email: this.draft.shop.contact.email,
        phone: this.draft.shop.contact.primaryPhone,
        addressLine1: this.draft.shop.address.line1,
        city: this.draft.shop.address.city,
        state: this.draft.shop.address.state,
        postalCode: this.draft.shop.address.pincode,
        country: this.draft.shop.address.country,
        taxRegistrationNumber: this.draft.shop.licenses.gstin,
        currencyCode: this.draft.general.operations.currencySymbol || 'INR',
        brandColor: '#0f766e',
        darkModeEnabled: String(this.shopStore.darkMode()),
        idleTimeoutMinutes: '30',
        preventMultipleOperatorSessions: String(this.draft.general.pos.preventMultipleOperatorSessions),
        invoicePrefix: this.draft.shop.invoice.prefix,
        invoiceStartingNumber: String(this.draft.shop.invoice.startingNumber),
        printTemplate: 'Thermal80',
        upiId: this.draft.shop.contact.primaryPhone ? this.draft.shop.contact.primaryPhone + '@upi' : '',
        termsAndConditions: this.draft.shop.invoice.terms
      }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  private blankCoupon(): CouponSettings {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { id: '', code: '', type: 'Percentage' as CouponType, value: 10, minOrder: 0, maxDiscountCap: 500, validFrom: today, validTo: nextMonth, usageLimit: 100, usedCount: 0, applicableCategories: ['General'], active: true };
  }

  private blankUser(): UserSettings {
    return { id: '', name: '', email: '', phone: '', dob: '', gender: 'NotSpecified', role: 'Operator', status: 'Active', shiftStart: '09:00', shiftEnd: '18:00', maxDiscountAllowedPercent: 5, forcePasswordReset: false, enforce2Fa: false, lastLogin: '', loginHistory: [] };
  }
}

function createDefaultSettings(): SettingsDraft {
  const now = new Date().toISOString();
  const shop: ShopDetailsSettings = {
    shopName: 'BillEase Demo Store',
    legalName: 'BillEase Demo Store Pvt Ltd',
    shopType: 'General',
    logo: null,
    banner: null,
    address: { line1: 'Main Market Road', line2: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India' },
    contact: { primaryPhone: '+91-9000000000', alternatePhone: '', email: 'demo@billeasepro.local', website: '' },
    licenses: { gstin: '29ABCDE1234F1Z5', pan: 'ABCDE1234F', fssaiLicense: '', drugLicenseNo: '', tradeLicense: '' },
    bank: { bankName: '', accountNo: '', ifsc: '', branch: '' },
    invoice: { prefix: 'BILL-', startingNumber: 1, showGstin: true, showPan: true, showLicenseNo: true, showBankDetails: false, showSignatureLine: true, terms: 'Goods once sold will be accepted for return as per store policy.', footerText: 'Thank you for shopping with us.', copies: 1 }
  };
  const taxes: TaxSettings = {
    regime: 'GST',
    gstMode: 'Exclusive',
    interstateDefault: false,
    reverseCharge: false,
    defaultCategorySlab: { General: 'GST 18%' },
    slabs: [
      { id: crypto.randomUUID(), name: 'GST 5%', rate: 5, cgst: 2.5, sgst: 2.5, igst: 5, category: 'Grocery', isDefault: false },
      { id: crypto.randomUUID(), name: 'GST 12%', rate: 12, cgst: 6, sgst: 6, igst: 12, category: 'Food', isDefault: false },
      { id: crypto.randomUUID(), name: 'GST 18%', rate: 18, cgst: 9, sgst: 9, igst: 18, category: 'General', isDefault: true }
    ]
  };
  const discounts: DiscountSettings = { maxBillDiscountPercent: 15, maxItemDiscountPercent: 20, approvalThresholdPercent: 10, allowOperatorDiscounts: true };
  const general: GeneralSettings = {
    operations: {
      workingHours: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({ day, open: day !== 'Sunday', openTime: '09:00', closeTime: '21:00' })),
      financialYearStartMonth: 'April',
      currencySymbol: 'Rs.',
      decimalPlaces: 2,
      roundingMethod: '0.5 up',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Asia/Kolkata',
      language: 'English'
    },
    pos: { defaultPaymentMode: 'Cash', autoConfirmOnPrint: false, requireCustomer: false, lowStockWarning: true, autoPrintAfterConfirm: true, defaultBillCopies: 1, preventMultipleOperatorSessions: true },
    notifications: { globalLowStockThreshold: 5, expiryAlertDays: [15, 30, 60], dailySummaryEmail: true, lowStockDigest: true, paymentDueReminders: true, whatsappProviderApiKey: '' },
    loyalty: { enabled: true, earnPoints: 1, earnPerAmount: 100, redeemPoints: 10, redeemAmount: 1, minPointsToRedeem: 100, expiryDays: 365 }
  };
  return {
    shop,
    taxes,
    discounts,
    coupons: [{ id: crypto.randomUUID(), code: 'WELCOME10', type: 'Percentage', value: 10, minOrder: 500, maxDiscountCap: 250, validFrom: now.slice(0, 10), validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), usageLimit: 500, usedCount: 42, applicableCategories: ['General'], active: true }],
    users: [
      { id: '50000000-0000-0000-0000-000000000001', name: 'Super Admin', email: 'superadmin@billeasepro.local', phone: '', dob: '', gender: 'NotSpecified', role: 'SuperAdmin', status: 'Active', shiftStart: '00:00', shiftEnd: '23:59', maxDiscountAllowedPercent: 100, forcePasswordReset: false, enforce2Fa: false, lastLogin: now, loginHistory: [now] },
      { id: '50000000-0000-0000-0000-000000000002', name: 'Admin User', email: 'admin@billeasepro.local', phone: '', dob: '', gender: 'NotSpecified', role: 'Admin', status: 'Active', shiftStart: '09:00', shiftEnd: '18:00', maxDiscountAllowedPercent: 25, forcePasswordReset: false, enforce2Fa: false, lastLogin: now, loginHistory: [now] },
      { id: '50000000-0000-0000-0000-000000000003', name: 'Operator User', email: 'operator@billeasepro.local', phone: '', dob: '', gender: 'NotSpecified', role: 'Operator', status: 'Active', shiftStart: '09:00', shiftEnd: '18:00', maxDiscountAllowedPercent: 5, forcePasswordReset: false, enforce2Fa: false, lastLogin: now, loginHistory: [now] }
    ],
    permissions: buildPermissions(),
    general,
    auditLog: [{ id: crypto.randomUUID(), section: 'shop', action: 'Defaults loaded', actor: 'System', at: now, summary: 'Initial settings workspace defaults generated.' }]
  };
}

function buildPermissions() {
  const features = ['Billing', 'Inventory', 'Purchases', 'Customers', 'Reports', 'Settings', 'Users'];
  const actions: PermissionAction[] = ['create', 'read', 'update', 'delete'];
  const matrix: Record<string, Record<string, Record<PermissionAction, boolean>>> = {};
  for (const role of ['SuperAdmin', 'Admin', 'Operator']) {
    matrix[role] = {};
    for (const feature of features) {
      matrix[role][feature] = { create: false, read: true, update: false, delete: false };
      for (const action of actions) {
        matrix[role][feature][action] = role === 'SuperAdmin'
          || (role === 'Admin' && feature !== 'Settings')
          || (role === 'Operator' && ['Billing', 'Customers'].includes(feature) && action !== 'delete')
          || (role === 'Operator' && ['Inventory', 'Reports'].includes(feature) && action === 'read');
      }
    }
  }
  return matrix;
}
