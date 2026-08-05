import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'be-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <main class="auth-page">
      <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
        <h1>Reset password</h1>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" autocomplete="username"></mat-form-field>
        @if (otpSent()) {
          <mat-form-field appearance="outline"><mat-label>OTP</mat-label><input matInput formControlName="otp" autocomplete="one-time-code"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>New password</mat-label><input matInput type="password" formControlName="newPassword" autocomplete="new-password"></mat-form-field>
        }
        @if (message()) { <p>{{ message() }}</p> }
        <button mat-flat-button color="primary" type="submit">{{ otpSent() ? 'Update password' : 'Send OTP' }}</button>
        <a routerLink="/auth/login">Back to sign in</a>
      </form>
    </main>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; background: #eef2f6; padding: 20px; }
    form { width: min(100%, 420px); display: grid; gap: 12px; background: white; border: 1px solid #dfe5ec; border-radius: 8px; padding: 24px; }
    h1, p { margin: 0; }
  `]
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly otpSent = signal(false);
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: [''],
    newPassword: ['']
  });

  submit(): void {
    const value = this.form.getRawValue();
    if (!this.otpSent()) {
      this.auth.forgotPassword(value.email).subscribe(response => {
        this.message.set(response.message);
        this.otpSent.set(true);
      });
      return;
    }

    this.auth.resetPassword(value.email, value.otp, value.newPassword).subscribe(ok => {
      this.message.set(ok ? 'Password updated. You can sign in now.' : 'OTP verification failed.');
    });
  }
}
