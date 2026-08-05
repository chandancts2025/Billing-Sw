import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ShopSettingsDto } from '../models/api.models';
import { TaxSlabDto } from '../../features/inventory/inventory.models';

@Injectable({ providedIn: 'root' })
export class SettingsApiService extends ApiService {
  shop(shopId: string) { return this.http.get<ShopSettingsDto>(this.url(`settings/shops/${shopId}`)); }
  updateShop(shopId: string, payload: unknown) { return this.http.put(this.url(`settings/shops/${shopId}`), payload); }
  taxSlabs() { return this.http.get<TaxSlabDto[]>(this.url('taxslabs')); }
  coupons() { return this.http.get(this.url('coupons')); }
  users() { return this.http.get(this.url('users')); }
  discounts() { return this.http.get(this.url('discounttypes')); }

  // Generic CRUD helpers for settings subsections
  createUser(payload: unknown) { return this.http.post(this.url('users'), payload); }
  updateUser(id: string, payload: unknown) { return this.http.put(this.url(`users/${id}`), payload); }
  deleteUser(id: string) { return this.http.delete(this.url(`users/${id}`)); }

  createTaxSlab(payload: unknown) { return this.http.post(this.url('taxslabs'), payload); }
  updateTaxSlab(id: string, payload: unknown) { return this.http.put(this.url(`taxslabs/${id}`), payload); }
  deleteTaxSlab(id: string) { return this.http.delete(this.url(`taxslabs/${id}`)); }

  createCoupon(payload: unknown) { return this.http.post(this.url('coupons'), payload); }
  updateCoupon(id: string, payload: unknown) { return this.http.put(this.url(`coupons/${id}`), payload); }
  deleteCoupon(id: string) { return this.http.delete(this.url(`coupons/${id}`)); }

  createDiscount(payload: unknown) { return this.http.post(this.url('discounttypes'), payload); }
  updateDiscount(id: string, payload: unknown) { return this.http.put(this.url(`discounttypes/${id}`), payload); }
  deleteDiscount(id: string) { return this.http.delete(this.url(`discounttypes/${id}`)); }
}
