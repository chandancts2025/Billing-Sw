import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import {
  AdjustmentVoucherDto,
  CategoryDto,
  CategoryTreeNodeDto,
  CreateGrnRequest,
  CreateInventoryAdjustmentRequest,
  CreatePurchaseOrderRequest,
  GrnDto,
  InventoryAdjustmentDto,
  InventoryAlertDto,
  InventoryBatchDto,
  InventoryDashboardDto,
  InventoryLookupDto,
  InventoryProductDetailDto,
  InventoryProductListItemDto,
  PurchaseOrderDto,
  PurchaseReturnDto,
  PurchaseReturnRequest,
  SaveCategoryRequest,
  SaveProductRequest,
  SaveSupplierRequest,
  SaveUnitConversionRequest,
  StockLedgerRowDto,
  StockMovementType,
  SupplierAnalysisDto,
  SupplierDetailDto,
  SupplierLedgerRowDto,
  SupplierSummaryDto,
  UnitConversionDto
} from './inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/inventory`;

  lookup(shopId: string) { return this.http.get<InventoryLookupDto>(`${this.base}/lookup`, { params: { shopId } }); }
  dashboard(shopId: string) { return this.http.get<InventoryDashboardDto>(`${this.base}/dashboard`, { params: { shopId } }); }
  products(shopId: string, search = '') { return this.http.get<InventoryProductListItemDto[]>(`${this.base}/products`, { params: { shopId, search } }); }
  product(id: string) { return this.http.get<InventoryProductDetailDto>(`${this.base}/products/${id}`); }
  saveProduct(payload: SaveProductRequest) { return this.http.post<InventoryProductDetailDto>(`${this.base}/products`, payload); }
  categoryTree(shopId: string) { return this.http.get<CategoryTreeNodeDto[]>(`${this.base}/categories/tree`, { params: { shopId } }); }
  saveCategory(payload: SaveCategoryRequest) { return this.http.post<CategoryDto>(`${this.base}/categories`, payload); }
  batches(shopId: string, productId?: string, expiringOnly = false) {
    let params = new HttpParams().set('shopId', shopId).set('expiringOnly', expiringOnly);
    if (productId) params = params.set('productId', productId);
    return this.http.get<InventoryBatchDto[]>(`${this.base}/batches`, { params });
  }
  quarantineExpired(shopId: string) { return this.http.post<number>(`${this.base}/batches/quarantine-expired`, null, { params: { shopId } }); }
  purchaseOrders(shopId: string) { return this.http.get<PurchaseOrderDto[]>(`${this.base}/purchases/orders`, { params: { shopId } }); }
  createPurchaseOrder(payload: CreatePurchaseOrderRequest) { return this.http.post<PurchaseOrderDto>(`${this.base}/purchases/orders`, payload); }
  createGrn(payload: CreateGrnRequest) { return this.http.post<GrnDto>(`${this.base}/purchases/grn`, payload); }
  approveGrn(id: string) { return this.http.post<GrnDto>(`${this.base}/purchases/grn/${id}/approve`, null); }
  suppliers(shopId: string) { return this.http.get<SupplierSummaryDto[]>(`${this.base}/suppliers`, { params: { shopId } }); }
  saveSupplier(payload: SaveSupplierRequest) { return this.http.post<SupplierDetailDto>(`${this.base}/suppliers`, payload); }
  supplierLedger(id: string) { return this.http.get<SupplierLedgerRowDto[]>(`${this.base}/suppliers/${id}/ledger`); }
  supplierAnalysis(shopId: string) { return this.http.get<SupplierAnalysisDto[]>(`${this.base}/suppliers/analysis`, { params: { shopId } }); }
  adjustments(shopId: string) { return this.http.get<InventoryAdjustmentDto[]>(`${this.base}/adjustments`, { params: { shopId } }); }
  createAdjustment(payload: CreateInventoryAdjustmentRequest) { return this.http.post<InventoryAdjustmentDto>(`${this.base}/adjustments`, payload); }
  approveAdjustment(id: string) { return this.http.post<InventoryAdjustmentDto>(`${this.base}/adjustments/${id}/approve`, null); }
  adjustmentVoucher(id: string) { return this.http.get<AdjustmentVoucherDto>(`${this.base}/adjustments/${id}/voucher`); }
  stockLedger(shopId: string, productId: string, movementType?: StockMovementType | '') {
    let params = new HttpParams().set('shopId', shopId).set('productId', productId);
    if (movementType) params = params.set('movementType', movementType);
    return this.http.get<StockLedgerRowDto[]>(`${this.base}/stock-ledger`, { params });
  }
  unitConversions(shopId: string) { return this.http.get<UnitConversionDto[]>(`${this.base}/unit-conversions`, { params: { shopId } }); }
  saveUnitConversion(payload: SaveUnitConversionRequest) { return this.http.post<UnitConversionDto>(`${this.base}/unit-conversions`, payload); }
  alerts(shopId: string) { return this.http.get<InventoryAlertDto[]>(`${this.base}/alerts`, { params: { shopId } }); }
  purchaseReturns(shopId?: string) { return this.http.get<PurchaseReturnDto[]>(`${environment.apiBaseUrl}/purchasereturns`, { params: shopId ? { shopId } : undefined }); }
  createPurchaseReturn(payload: PurchaseReturnRequest) { return this.http.post<PurchaseReturnDto>(`${this.base}/purchases/returns`, payload); }
}
