import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedSettings {
  canDeactivate: () => boolean;
}

export const settingsUnsavedGuard: CanDeactivateFn<HasUnsavedSettings> = component => component.canDeactivate();
