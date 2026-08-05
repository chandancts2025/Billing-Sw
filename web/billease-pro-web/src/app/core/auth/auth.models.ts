export type UserRole = 'SuperAdmin' | 'Admin' | 'Operator';
export type Gender = 'NotSpecified' | 'Female' | 'Male' | 'NonBinary' | 'PreferNotToSay';
export type OtpPurpose = 'EmailVerification' | 'PhoneVerification' | 'PasswordReset';

export interface UserDto {
  id: string;
  shopId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt: string;
  user: UserDto;
  requiresShopSetup: boolean;
}

export interface RegisterAddressRequest {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  gender: Gender;
  address: RegisterAddressRequest;
  shopId?: string | null;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ShopSetupRequest {
  name: string;
  legalName?: string;
  industryType: string;
  taxRegime: string;
  currencyCode: string;
  taxRegistrationNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  provisioningUri: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
