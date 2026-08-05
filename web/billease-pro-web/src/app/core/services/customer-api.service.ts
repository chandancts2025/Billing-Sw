import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { CustomerSearchResultDto } from '../../features/billing/billing.models';

@Injectable({ providedIn: 'root' })
export class CustomerApiService extends ApiService {
  search(shopId: string, term: string) { return this.http.get<CustomerSearchResultDto[]>(this.url('billing/customers/search'), { params: this.params({ shopId, term }) }); }
  create(shopId: string, name: string, phone: string, email?: string) { return this.http.post<CustomerSearchResultDto>(this.url('billing/customers'), { shopId, name, phone, email }); }
  getById(id: string) { return this.http.get(this.url(`customers/${id}`)); }
  getLedger(shopId: string, customerId: string) { return this.http.get(this.url(`reports/customer-ledger/${customerId}`), { params: this.params({ shopId }) }); }
}
