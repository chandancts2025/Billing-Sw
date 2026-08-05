import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, ShopSetupRequest, UserDto, VerifyOtpRequest, TwoFactorSetupResponse, ChangePasswordRequest } from './auth.models';

const rememberedEmailKey = 'billease.rememberedEmail';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<UserDto | null>(null);
  private readonly expiresAtSignal = signal<Date | null>(null);
  private readonly setupRequiredSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly requiresShopSetup = this.setupRequiredSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal() && !!this.userSignal() && this.isTokenValid());
  readonly role = computed(() => this.userSignal()?.role ?? null);

  get accessToken(): string | null {
    return this.accessTokenSignal();
  }

  get rememberedEmail(): string {
    return localStorage.getItem(rememberedEmailKey) ?? '';
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request, { withCredentials: true });
  }

  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request, { withCredentials: true });
  }

  verifyOtp(request: VerifyOtpRequest) {
    return this.http.post<boolean>(`${environment.apiBaseUrl}/auth/verify-otp`, request, { withCredentials: true });
  }

  requestOtp(email: string, purpose: VerifyOtpRequest['purpose']) {
    return this.http.post<boolean>(`${environment.apiBaseUrl}/auth/request-otp`, { email, purpose }, { withCredentials: true });
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${environment.apiBaseUrl}/auth/forgot-password`, { email }, { withCredentials: true });
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.http.post<boolean>(`${environment.apiBaseUrl}/auth/reset-password`, { email, otp, newPassword }, { withCredentials: true });
  }

  setupShop(request: ShopSetupRequest) {
    return this.http.post(`${environment.apiBaseUrl}/auth/setup`, request, { withCredentials: true });
  }

  enableTwoFactor(userId: string) {
    return this.http.post<TwoFactorSetupResponse>(`${environment.apiBaseUrl}/auth/${userId}/2fa/setup`, null, { withCredentials: true });
  }

  verifyTwoFactor(userId: string, code: string) {
    return this.http.post<boolean>(`${environment.apiBaseUrl}/auth/${userId}/2fa/verify`, code, { withCredentials: true });
  }

  changePassword(userId: string, request: ChangePasswordRequest) {
    return this.http.post<boolean>(`${environment.apiBaseUrl}/auth/change-password/${userId}`, request, { withCredentials: true });
  }

  completeLogin(response: AuthResponse, rememberEmail = false): void {
    this.accessTokenSignal.set(response.accessToken);
    this.expiresAtSignal.set(new Date(response.expiresAt));
    this.userSignal.set(response.user);
    this.setupRequiredSignal.set(response.requiresShopSetup);
    if (rememberEmail) localStorage.setItem(rememberedEmailKey, response.user.email);
    else localStorage.removeItem(rememberedEmailKey);
    void this.router.navigateByUrl(response.requiresShopSetup ? '/auth/setup' : '/dashboard');
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.applySession(response))
    );
  }

  logout(navigate = true): void {
    const userId = this.userSignal()?.id;
    if (userId) {
      this.http.post(`${environment.apiBaseUrl}/auth/logout`, { userId }, { withCredentials: true }).subscribe({ error: () => undefined });
    }
    this.clearSession();
    if (navigate) void this.router.navigateByUrl('/auth/login');
  }

  isTokenValid(): boolean {
    const expiresAt = this.expiresAtSignal();
    return !!expiresAt && expiresAt.getTime() > Date.now() + 15_000;
  }

  hasRoleAtLeast(required: UserDto['role']): boolean {
    const levels: Record<UserDto['role'], number> = { Operator: 1, Admin: 2, SuperAdmin: 3 };
    const role = this.role();
    return !!role && levels[role] >= levels[required];
  }

  private applySession(response: AuthResponse): void {
    this.accessTokenSignal.set(response.accessToken);
    this.expiresAtSignal.set(new Date(response.expiresAt));
    this.userSignal.set(response.user);
    this.setupRequiredSignal.set(response.requiresShopSetup);
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.expiresAtSignal.set(null);
    this.userSignal.set(null);
    this.setupRequiredSignal.set(false);
  }
}
