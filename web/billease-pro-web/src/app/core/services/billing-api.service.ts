import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BillHistoryRowDto, BillQuoteDto, CreateSaleInvoiceItemRequest, CreatePaymentRequest, PrintInvoiceDto, ProductSearchResultDto, SaleInvoiceDetailDto } from '../../features/billing/billing.models';

@Injectable({ providedIn: 'root' })
export class BillingApiService extends ApiService {
  newBill(payload: { shopId: string; customerId?: string | null; walkInCustomerName?: string | null; items: CreateSaleInvoiceItemRequest[]; payments: CreatePaymentRequest[]; confirm: boolean }) {
    return this.http.post<SaleInvoiceDetailDto>(this.url('billing/sales'), payload);
  }
  updateBill(id: string, payload: unknown) { return this.http.put(this.url(`salesinvoices/${id}`), payload); }
  confirmBill(id: string) { return this.http.post(this.url(`billing/sales/${id}/confirm`), {}); }
  calculateTotals(payload: unknown) { return this.http.post<BillQuoteDto>(this.url('billing/quote'), payload); }
  applyCoupon(payload: unknown) { return this.http.post(this.url('billing/coupon/validate'), payload); }
  getHistory(shopId: string) { return this.http.get<BillHistoryRowDto[]>(this.url('billing/sales/history'), { params: this.params({ shopId }) }); }
  printBill(id: string) { return this.http.get<PrintInvoiceDto>(this.url(`billing/sales/${id}/print`)); }
  searchProducts(shopId: string, term: string) { return this.http.get<ProductSearchResultDto[]>(this.url('billing/products/search'), { params: this.params({ shopId, term }) }); }
}
