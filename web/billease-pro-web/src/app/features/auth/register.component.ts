import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { AuthResponse } from '../../core/auth/auth.models';

@Component({
  selector: 'be-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule],
  template: `
    <main class="auth-page">
      <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
        <header>
          <h1>Create account</h1>
          <p>Step {{ step() + 1 }} of 3</p>
        </header>

        @if (step() === 0) {
          <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput formControlName="fullName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" inputmode="tel"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Date of birth</mat-label><input matInput formControlName="dob" type="date"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Gender</mat-label>
            <mat-select formControlName="gender">
              <mat-option value="NotSpecified">Not specified</mat-option>
              <mat-option value="Female">Female</mat-option>
              <mat-option value="Male">Male</mat-option>
              <mat-option value="NonBinary">Non-binary</mat-option>
              <mat-option value="PreferNotToSay">Prefer not to say</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Address line 1</mat-label><input matInput formControlName="line1"></mat-form-field>
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>City</mat-label><input matInput formControlName="city"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>State</mat-label><input matInput formControlName="state"></mat-form-field>
          </div>
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Pincode</mat-label><input matInput formControlName="pincode"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Country</mat-label><input matInput formControlName="country"></mat-form-field>
          </div>
        }

        @if (step() === 1) {
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" autocomplete="username"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Shop ID</mat-label><input matInput formControlName="shopId"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Invite code</mat-label><input matInput formControlName="inviteCode" autocomplete="off"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password">
          </mat-form-field>
          <mat-progress-bar mode="determinate" [value]="passwordScore()"></mat-progress-bar>
          <mat-form-field appearance="outline">
            <mat-label>Confirm password</mat-label>
            <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
          </mat-form-field>
        }

        @if (step() === 2) {
          <p class="hint">Enter the 6-digit OTP sent to {{ form.controls.email.value }}.</p>
          @if (maskedPhone()) {
            <p class="hint">Phone verification can use {{ maskedPhone() }} when enabled.</p>
          }
          <mat-form-field appearance="outline"><mat-label>Email OTP</mat-label><input matInput formControlName="otp" inputmode="numeric" autocomplete="one-time-code"></mat-form-field>
        }

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <div class="actions">
          <button mat-button type="button" (click)="back()" [disabled]="step() === 0">Back</button>
          @if (step() < 2) {
            <button mat-flat-button color="primary" type="button" (click)="next()" [disabled]="loading()">Next</button>
          } @else {
            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">Verify</button>
          }
        </div>
        <a routerLink="/auth/login">Back to sign in</a>
      </form>
    </main>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; background: #eef2f6; padding: 20px; }
    form { width: min(100%, 620px); display: grid; gap: 12px; background: white; border: 1px solid #dfe5ec; border-radius: 8px; padding: 24px; }
    h1, p { margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; }
    .hint { color: #5d6978; }
    .error { color: #b42318; font-size: 13px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly step = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly pendingResponse = signal<AuthResponse | null>(null);
  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: [''],
    dob: [''],
    gender: ['NotSpecified' as const],
    line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    country: ['India', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    shopId: [''],
    inviteCode: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    otp: ['']
  });
  readonly passwordScore = computed(() => {
    const value = this.form.controls.password.value;
    return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^a-zA-Z0-9]/.test(value)].filter(Boolean).length * 25;
  });
  readonly maskedPhone = computed(() => {
    const phone = this.form.controls.phone.value.replace(/\D/g, '');
    return phone.length >= 4 ? `${'x'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}` : '';
  });

  next(): void {
    this.error.set('');
    if (this.step() === 1 && this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (this.step() === 1) {
      this.createAccount();
      return;
    }
    this.step.set(Math.min(2, this.step() + 1));
  }

  back(): void {
    this.step.set(Math.max(0, this.step() - 1));
  }

  submit(): void {
    if (!this.pendingResponse()) {
      this.error.set('Create the account first.');
      return;
    }
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.auth.verifyOtp({ email: value.email, code: value.otp, purpose: 'EmailVerification' }).subscribe({
      next: () => this.auth.completeLogin(this.pendingResponse()!, true),
      error: () => {
        this.error.set('OTP verification failed.');
        this.loading.set(false);
      }
    });
  }

  private createAccount(): void {
    this.loading.set(true);
    const value = this.form.getRawValue();
    this.auth.register({
      fullName: value.fullName,
      email: value.email,
      phone: value.phone || undefined,
      dob: value.dob || undefined,
      gender: value.gender,
      address: { line1: value.line1, city: value.city, state: value.state, pincode: value.pincode, country: value.country },
      shopId: value.shopId || null,
      password: value.password,
      confirmPassword: value.confirmPassword,
      inviteCode: value.inviteCode || undefined
    }).subscribe({
      next: response => {
        this.pendingResponse.set(response);
        this.step.set(2);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Registration failed. Check the details and try again.');
        this.loading.set(false);
      }
    });
  }
}
