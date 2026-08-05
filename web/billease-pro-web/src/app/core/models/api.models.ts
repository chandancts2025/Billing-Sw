export * from '../../core/auth/auth.models';
export * from '../../features/billing/billing.models';
export * from '../../features/inventory/inventory.models';
export * from '../../features/reports/reports.models';

export interface ApiListResponse<T> {
  items: T[];
  total: number;
}

export interface ShopSettingsDto {
  shopId: string;
  shopName: string;
  brandColor: string;
  darkModeEnabled: boolean;
  idleTimeoutMinutes: number;
  preventMultipleOperatorSessions: boolean;
}
