import { Injectable, effect, signal } from '@angular/core';
import { ShopSettingsDto } from '../models/api.models';

const brandColorKey = 'billease.brandColor';
const darkModeKey = 'billease.darkMode';

@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly settingsSignal = signal<ShopSettingsDto | null>(null);
  readonly settings = this.settingsSignal.asReadonly();
  readonly darkMode = signal(localStorage.getItem(darkModeKey) === 'true');

  constructor() {
    effect(() => {
      document.documentElement.style.setProperty('--brand-color', this.settingsSignal()?.brandColor ?? localStorage.getItem(brandColorKey) ?? '#0f766e');
      document.documentElement.classList.toggle('dark-mode', this.darkMode());
      localStorage.setItem(darkModeKey, String(this.darkMode()));
    });
  }

  setSettings(settings: ShopSettingsDto): void {
    this.settingsSignal.set(settings);
    localStorage.setItem(brandColorKey, settings.brandColor);
  }

  toggleDarkMode(): void {
    this.darkMode.update(value => !value);
  }
}
