import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { CustomerSearchResultDto } from '../../features/billing/billing.models';

@Injectable({ providedIn: 'root' })
export class CustomerApiService extends ApiService {
  list() { return this.http.get<any[]>(this.url('customers')); }
  search(shopId: string, term: string) { return this.http.get<CustomerSearchResultDto[]>(this.url('billing/customers/search'), { params: this.params({ shopId, term }) }); }
  create(shopId: string, name: string, phone: string, email?: string) { return this.http.post<CustomerSearchResultDto>(this.url('billing/customers'), { shopId, name, phone, email }); }
  getById(id: string) { return this.http.get<any>(this.url(`customers/${id}`)); }
  getLedger(shopId: string, customerId: string) { return this.http.get<any>(this.url(`reports/customer-ledger/${customerId}`), { params: this.params({ shopId }) }); }
  update(id: string, payload: unknown) { return this.http.put(this.url(`customers/${id}`), payload); }
  delete(id: string) { return this.http.delete(this.url(`customers/${id}`)); }
}
