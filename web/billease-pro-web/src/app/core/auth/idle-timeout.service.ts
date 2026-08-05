import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';
import { AuthService } from './auth.service';

const idleMinutesKey = 'billease.idleMinutes';

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(eventName =>
      this.document.addEventListener(eventName, () => this.reset(), { passive: true })
    );
    this.reset();
  }

  setTimeoutMinutes(minutes: number): void {
    localStorage.setItem(idleMinutesKey, String(Math.max(5, minutes)));
    this.reset();
  }

  private reset(): void {
    this.clearTimers();
    const idleMs = this.timeoutMinutes * 60_000;
    const warningMs = Math.max(0, idleMs - 120_000);

    this.zone.runOutsideAngular(() => {
      this.warningTimer = setTimeout(() => {
        if (!this.auth.isAuthenticated()) return;
        const staySignedIn = window.confirm('Your session will expire in 2 minutes. Stay signed in?');
        if (staySignedIn) this.zone.run(() => this.reset());
      }, warningMs);

      this.logoutTimer = setTimeout(() => {
        if (this.auth.isAuthenticated()) this.zone.run(() => this.auth.logout());
      }, idleMs);
    });
  }

  private get timeoutMinutes(): number {
    const configured = Number(localStorage.getItem(idleMinutesKey));
    return Number.isFinite(configured) && configured > 0 ? configured : 30;
  }

  private clearTimers(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
  }
}
