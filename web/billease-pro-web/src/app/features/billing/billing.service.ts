import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import {
  BillHistoryRowDto,
  BillQuoteDto,
  CouponValidationDto,
  CreatePaymentRequest,
  CreateSaleInvoiceItemRequest,
  CustomerSearchResultDto,
  DiscountValueType,
  PaymentMethod,
  PrintInvoiceDto,
  ProductSearchResultDto,
  SaleInvoiceDetailDto,
  SalesInvoiceDto,
  SalesInvoiceStatus,
  SalesReturnDto,
  SalesReturnLookupDto,
  ConfirmSalesInvoiceRequest,
  CancelSalesInvoiceRequest,
  ReturnSalesInvoiceRequest,
  PrintSalesInvoiceResponse,
  SaleInvoiceForEditDto
} from './billing.models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/billing`;

  searchProducts(shopId: string, term: string) {
    return this.http.get<ProductSearchResultDto[]>(`${this.base}/products/search`, { params: { shopId, term } });
  }

  searchCustomers(shopId: string, term: string) {
    return this.http.get<CustomerSearchResultDto[]>(`${this.base}/customers/search`, { params: { shopId, term } });
  }

  addCustomer(shopId: string, name: string, phone: string, email?: string) {
    return this.http.post<CustomerSearchResultDto>(`${this.base}/customers`, { shopId, name, phone, email });
  }

  quote(payload: {
    shopId: string;
    customerId?: string | null;
    items: CreateSaleInvoiceItemRequest[];
    billDiscountType?: DiscountValueType | null;
    billDiscountValue: number;
    couponCode?: string | null;
    isInterstate: boolean;
  }) {
    return this.http.post<BillQuoteDto>(`${this.base}/quote`, payload);
  }

  validateCoupon(shopId: string, code: string, orderAmount: number) {
    return this.http.post<CouponValidationDto>(`${this.base}/coupon/validate`, { shopId, code, orderAmount });
  }

  createSale(payload: {
    shopId: string;
    customerId?: string | null;
    walkInCustomerName?: string | null;
    items: CreateSaleInvoiceItemRequest[];
    billDiscountType?: DiscountValueType | null;
    billDiscountValue: number;
    couponCode?: string | null;
    payments: CreatePaymentRequest[];
    confirm: boolean;
    notes?: string | null;
  }) {
    return this.http.post<SaleInvoiceDetailDto>(`${this.base}/sales`, payload);
  }

  history(shopId: string, filter: { from?: string; to?: string; customerId?: string; paymentMode?: PaymentMethod | ''; status?: SalesInvoiceStatus | ''; search?: string }) {
    let params = new HttpParams().set('shopId', shopId);
    Object.entries(filter).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<BillHistoryRowDto[]>(`${this.base}/sales/history`, { params });
  }

  printInvoice(id: string) {
    return this.http.get<PrintInvoiceDto>(`${this.base}/sales/${id}/print`);
  }

  printSalesInvoice(id: string) {
    return this.http.post<PrintSalesInvoiceResponse>(`${this.base}/sales/${id}/print`, null);
  }

  confirmSalesInvoice(id: string) {
    return this.http.post<SalesInvoiceDto>(`${this.base}/sales/${id}/confirm`, null);
  }

  cancelSalesInvoice(id: string, reason?: string) {
    return this.http.post<boolean>(`${this.base}/sales/${id}/cancel`, { reason });
  }

  returnSalesInvoice(id: string, payload: { items: { salesInvoiceItemId: string; quantity: number; refundAmount: number }[]; reason?: string | null }) {
    return this.http.post<SalesReturnDto>(`${this.base}/sales/${id}/return`, { salesInvoiceId: id, items: payload.items, reason: payload.reason });
  }

  getForReturn(id: string) {
    return this.http.get<SalesReturnLookupDto>(`${this.base}/sales/${id}/return`);
  }

  findForReturn(shopId: string, billNo: string) {
    return this.http.get<SalesReturnLookupDto>(`${this.base}/sales/return-lookup`, { params: { shopId, billNo } });
  }

  createReturn(payload: { salesInvoiceId: string; items: { salesInvoiceItemId: string; quantity: number; refundAmount: number }[]; reason: string; refundMode: string }) {
    return this.http.post<SalesReturnDto>(`${this.base}/returns`, payload);
  }

  getSaleInvoice(id: string) {
    return this.http.get<SaleInvoiceForEditDto>(`${this.base}/sales/${id}`);
  }

  alterSale(id: string, payload: {
    shopId: string;
    customerId?: string | null;
    walkInCustomerName?: string | null;
    items: CreateSaleInvoiceItemRequest[];
    billDiscountType?: DiscountValueType | null;
    billDiscountValue: number;
    couponCode?: string | null;
    payments: CreatePaymentRequest[];
    confirm: boolean;
    notes?: string | null;
  }) {
    return this.http.put<SaleInvoiceDetailDto>(`${this.base}/sales/${id}`, payload);
  }

  deleteDraft(id: string) {
    return this.http.delete<boolean>(`${this.base}/sales/${id}`);
  }

  getDrafts(shopId: string) {
    return this.history(shopId, { status: 'Draft' });
  }
}
