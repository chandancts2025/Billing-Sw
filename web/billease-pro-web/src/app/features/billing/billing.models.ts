export type DiscountValueType = 'Percentage' | 'FlatAmount' | 'Flat';
export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'NetBanking' | 'Cheque' | 'Credit' | 'Split' | 'Others';
export type SalesInvoiceStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ProductSearchResultDto {
  productId: string;
  productVariantId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  category: string;
  unit: string;
  stockQuantity: number;
  mrp: number;
  sellingPrice: number;
  taxRate: number;
  hsnSacCode?: string | null;
  maxDiscountPercent: number;
  requiresBatchSelection: boolean;
  batches: ProductBatchOptionDto[];
}

export interface ProductBatchOptionDto {
  productVariantId: string;
  batchName: string;
  sellingPrice: number;
  expiryDate?: string | null;
  stockQuantity: number;
}

export interface CustomerSearchResultDto {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  loyaltyPoints: number;
  outstandingBalance: number;
  creditLimit: number;
}

export interface CreateSaleInvoiceItemRequest {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountValueType | null;
  discountValue: number;
  taxRate: number;
}

export interface CreatePaymentRequest {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string | null;
  details?: string | null;
}

export interface BillTotalsDto {
  subTotal: number;
  itemDiscountTotal: number;
  billDiscountAmount: number;
  couponDiscountAmount: number;
  taxableAmount: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  amountTendered: number;
  changeDue: number;
}

export interface TaxBreakupDto {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface BillQuoteDto {
  totals: BillTotalsDto;
  taxBreakup: TaxBreakupDto[];
  coupon?: CouponValidationDto | null;
}

export interface CouponValidationDto {
  isValid: boolean;
  code: string;
  discountAmount: number;
  message?: string | null;
}

export interface SaleInvoiceDetailDto {
  invoice: SalesInvoiceDto;
  items: SalesInvoiceItemDto[];
  payments: PaymentDto[];
  totals: BillTotalsDto;
  taxBreakup: TaxBreakupDto[];
}

export interface SalesInvoiceDto {
  id: string;
  shopId: string;
  customerId?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  status: SalesInvoiceStatus;
  paymentStatus: string;
  subTotal: number;
  itemDiscountTotal: number;
  billDiscountAmount: number;
  couponDiscountAmount: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  couponCode?: string | null;
  notes?: string | null;
}

export interface SalesInvoiceItemDto {
  id: string;
  salesInvoiceId: string;
  productId: string;
  productVariantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface PaymentDto {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string | null;
  details?: string | null;
}

export interface BillHistoryRowDto {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  itemsCount: number;
  total: number;
  payment: string;
  status: SalesInvoiceStatus;
}

export interface PrintInvoiceDto {
  invoiceNumber: string;
  a4Html: string;
  thermal80Html: string;
  thermal58Html: string;
  whatsAppUrl: string;
  customerEmail?: string | null;
}

export interface SalesReturnLookupDto {
  invoice: SalesInvoiceDto;
  items: SalesInvoiceItemDto[];
}

export interface SalesReturnDto {
  id: string;
  shopId: string;
  salesInvoiceId: string;
  creditNoteNumber: string;
  status: string;
  refundAmount: number;
  reason?: string | null;
}

export interface ConfirmSalesInvoiceRequest { salesInvoiceId: string; }
export interface CancelSalesInvoiceRequest { salesInvoiceId: string; reason?: string | null; }
export interface ReturnSalesInvoiceRequest { salesInvoiceId: string; items: { salesInvoiceItemId: string; quantity: number; refundAmount: number }[]; reason?: string | null; }
export interface PrintSalesInvoiceResponse { invoiceNumber: string; printContent: string; }
