import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'be-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <main class="auth-page">
      <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
        <header>
          <h1>BillEase Pro</h1>
          <p>Sign in to continue</p>
        </header>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" autocomplete="username">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="off">
          <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" aria-label="Toggle password visibility">
            <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>2FA code</mat-label>
          <input matInput formControlName="twoFactorCode" inputmode="numeric" autocomplete="one-time-code">
        </mat-form-field>

        <div class="row">
          <mat-checkbox formControlName="rememberMe">Remember email</mat-checkbox>
          <a routerLink="/auth/forgot-password">Forgot password?</a>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
          <mat-icon>login</mat-icon>
          Sign in
        </button>
        <a class="secondary" routerLink="/auth/register">Create an account</a>
      </form>
    </main>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; background: #eef2f6; padding: 20px; }
    form { width: min(100%, 420px); display: grid; gap: 12px; background: white; border: 1px solid #dfe5ec; border-radius: 8px; padding: 24px; }
    header { display: grid; gap: 4px; }
    h1 { margin: 0; font-size: 28px; }
    p { margin: 0; color: #5d6978; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; }
    button[type='submit'] { height: 44px; }
    .secondary { text-align: center; font-weight: 600; }
    .error { color: #b42318; font-size: 13px; }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly hidePassword = signal(true);
  readonly form = this.fb.nonNullable.group({
    email: [this.auth.rememberedEmail, [Validators.required, Validators.email]],
    password: ['', Validators.required],
    twoFactorCode: [''],
    rememberMe: [!!this.auth.rememberedEmail]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    this.auth.login({ ...value, email: value.email.trim(), twoFactorCode: value.twoFactorCode.trim() }).subscribe({
      next: response => this.auth.completeLogin(response, value.rememberMe),
      error: (error: unknown) => {
        this.error.set(this.loginErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  private loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Cannot reach the API. Start BillEasePro.Api and check the configured API URL.';
    }

    if (error instanceof HttpErrorResponse && error.status === 429) {
      return 'Too many login attempts. Please wait a minute and try again.';
    }

    return 'Sign in failed. Check credentials or lockout status.';
  }
}
