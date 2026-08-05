import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'be-shop-setup',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <main class="setup-page">
      <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
        <h1>Shop setup</h1>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Shop name</mat-label><input matInput formControlName="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Legal name</mat-label><input matInput formControlName="legalName"></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Industry</mat-label>
            <mat-select formControlName="industryType">
              <mat-option value="Retail">Retail</mat-option>
              <mat-option value="Pharmacy">Pharmacy</mat-option>
              <mat-option value="Grocery">Grocery</mat-option>
              <mat-option value="Fashion">Fashion</mat-option>
              <mat-option value="Restaurant">Restaurant</mat-option>
              <mat-option value="Hotel">Hotel</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tax regime</mat-label>
            <mat-select formControlName="taxRegime">
              <mat-option value="GST">GST</mat-option>
              <mat-option value="VAT">VAT</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Currency</mat-label><input matInput formControlName="currencyCode" maxlength="3"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Tax registration</mat-label><input matInput formControlName="taxRegistrationNumber"></mat-form-field>
        </div>
        <mat-form-field appearance="outline"><mat-label>Address line 1</mat-label><input matInput formControlName="addressLine1"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Address line 2</mat-label><input matInput formControlName="addressLine2"></mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>City</mat-label><input matInput formControlName="city"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>State</mat-label><input matInput formControlName="state"></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Pincode</mat-label><input matInput formControlName="postalCode"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Country</mat-label><input matInput formControlName="country"></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
        </div>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Save setup</button>
      </form>
    </main>
  `,
  styles: [`
    .setup-page { min-height: 100vh; background: #eef2f6; padding: 24px; }
    form { max-width: 860px; margin: auto; display: grid; gap: 12px; background: white; border: 1px solid #dfe5ec; border-radius: 8px; padding: 24px; }
    h1 { margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .error { margin: 0; color: #b42318; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ShopSetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    legalName: [''],
    industryType: ['Retail', Validators.required],
    taxRegime: ['GST', Validators.required],
    currencyCode: ['INR', Validators.required],
    taxRegistrationNumber: [''],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['India', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.setupShop(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/pos'),
      error: () => {
        this.error.set('Shop setup failed.');
        this.loading.set(false);
      }
    });
  }
}
