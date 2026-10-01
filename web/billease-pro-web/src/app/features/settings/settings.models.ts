import { Gender, UserRole } from '../../core/auth/auth.models';

export type SettingsSectionKey = 'shop' | 'taxes' | 'discounts' | 'coupons' | 'users' | 'general';
export type ShopType = 'Pharmacy' | 'Grocery' | 'Fashion' | 'Restaurant' | 'Hotel' | 'Electronics' | 'Hardware' | 'General';
export type TaxRegime = 'GST' | 'VAT' | 'Sales Tax' | 'No Tax';
export type GstMode = 'Exclusive' | 'Inclusive';
export type CouponType = 'Percentage' | 'Flat';
export type RoundingMethod = '0.5 up' | 'always up' | 'always down';
export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Split';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export interface MediaAsset {
  name: string;
  dataUrl: string;
}

export interface ShopDetailsSettings {
  shopName: string;
  legalName: string;
  shopType: ShopType;
  logo: MediaAsset | null;
  banner: MediaAsset | null;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contact: {
    primaryPhone: string;
    alternatePhone: string;
    email: string;
    website: string;
  };
  licenses: {
    gstin: string;
    pan: string;
    fssaiLicense: string;
    drugLicenseNo: string;
    tradeLicense: string;
  };
  bank: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
  };
  invoice: {
    prefix: string;
    startingNumber: number;
    showGstin: boolean;
    showPan: boolean;
    showLicenseNo: boolean;
    showBankDetails: boolean;
    showSignatureLine: boolean;
    terms: string;
    footerText: string;
    copies: 1 | 2 | 3;
  };
}

export interface TaxSlabSettings {
  id: string;
  name: string;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  category: string;
  isDefault: boolean;
}

export interface TaxSettings {
  regime: TaxRegime;
  gstMode: GstMode;
  interstateDefault: boolean;
  reverseCharge: boolean;
  defaultCategorySlab: Record<string, string>;
  slabs: TaxSlabSettings[];
}

export interface DiscountSettings {
  maxBillDiscountPercent: number;
  maxItemDiscountPercent: number;
  approvalThresholdPercent: number;
  allowOperatorDiscounts: boolean;
}

export interface CouponSettings {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscountCap: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  applicableCategories: string[];
  active: boolean;
}

export interface UserSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  role: UserRole;
  status: 'Active' | 'Inactive' | 'Locked';
  shiftStart: string;
  shiftEnd: string;
  maxDiscountAllowedPercent: number;
  forcePasswordReset: boolean;
  enforce2Fa: boolean;
  lastLogin: string;
  loginHistory: string[];
}

export interface GeneralSettings {
  operations: {
    workingHours: WeekDaySettings[];
    financialYearStartMonth: string;
    currencySymbol: string;
    decimalPlaces: number;
    roundingMethod: RoundingMethod;
    dateFormat: string;
    timeZone: string;
    language: 'English' | 'Hindi' | 'Tamil' | 'Telugu';
  };
  pos: {
    defaultPaymentMode: PaymentMode;
    autoConfirmOnPrint: boolean;
    requireCustomer: boolean;
    lowStockWarning: boolean;
    autoPrintAfterConfirm: boolean;
    defaultBillCopies: 1 | 2 | 3;
    preventMultipleOperatorSessions: boolean;
  };
  notifications: {
    globalLowStockThreshold: number;
    expiryAlertDays: number[];
    dailySummaryEmail: boolean;
    lowStockDigest: boolean;
    paymentDueReminders: boolean;
    whatsappProviderApiKey: string;
  };
  loyalty: {
    enabled: boolean;
    earnPoints: number;
    earnPerAmount: number;
    redeemPoints: number;
    redeemAmount: number;
    minPointsToRedeem: number;
    expiryDays: number;
  };
}

export interface WeekDaySettings {
  day: string;
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface PermissionMatrix {
  [role: string]: Record<string, Record<PermissionAction, boolean>>;
}

export interface AuditLogEntry {
  id: string;
  section: SettingsSectionKey;
  action: string;
  actor: string;
  at: string;
  summary: string;
}

export interface SettingsDraft {
  shop: ShopDetailsSettings;
  taxes: TaxSettings;
  discounts: DiscountSettings;
  coupons: CouponSettings[];
  users: UserSettings[];
  permissions: PermissionMatrix;
  general: GeneralSettings;
  auditLog: AuditLogEntry[];
}

export interface SettingsSearchHit {
  label: string;
  section: SettingsSectionKey;
  targetId: string;
}
