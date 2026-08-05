import { Injectable, computed, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  private readonly notificationsSignal = signal<ToastMessage[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() => this.notificationsSignal().length);

  success(text: string): void { this.push('success', text); }
  error(text: string): void { this.push('error', text); }
  info(text: string): void { this.push('info', text); }
  warning(text: string): void { this.push('warning', text); }

  dismiss(id: string): void {
    this.toastsSignal.update(items => items.filter(item => item.id !== id));
  }

  addNotification(text: string, type: ToastType = 'info'): void {
    this.notificationsSignal.update(items => [{ id: crypto.randomUUID(), type, text }, ...items].slice(0, 50));
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }

  private push(type: ToastType, text: string): void {
    const toast = { id: crypto.randomUUID(), type, text };
    this.toastsSignal.update(items => [...items, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 4500);
  }
}
