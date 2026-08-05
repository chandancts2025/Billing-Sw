export type FoodType = 'NotApplicable' | 'Veg' | 'NonVeg';
export type PurchaseOrderStatus = 'Draft' | 'Ordered' | 'PartiallyReceived' | 'Received' | 'Cancelled';
export type StockAdjustmentType = 'Damage' | 'Theft' | 'Found' | 'Correction' | 'OpeningBalance';
export type AdjustmentStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';
export type StockMovementType = 'Purchase' | 'Sale' | 'Return' | 'Adjustment' | 'Opening';
export type InventoryBatchStatus = 'Available' | 'Quarantined' | 'Expired' | 'Consumed';
export type NotificationSeverity = 'Info' | 'Warning' | 'Critical';

export interface CategoryDto { id: string; shopId: string; name: string; description?: string | null; parentCategoryId?: string | null; }
export interface UnitOfMeasureDto { id: string; name: string; symbol: string; unitType: string; }
export interface TaxSlabDto { id: string; name: string; rate: number; taxRegime: string; isActive: boolean; }
export interface SupplierSummaryDto { id: string; name: string; phone?: string | null; email?: string | null; outstandingBalance: number; }
export interface InventoryLookupDto { categories: CategoryDto[]; units: UnitOfMeasureDto[]; taxSlabs: TaxSlabDto[]; suppliers: SupplierSummaryDto[]; }

export interface InventoryProductListItemDto {
  id: string; sku: string; name: string; category: string; brand?: string | null; unit: string; stock: number;
  purchasePrice: number; sellingPrice: number; mrp: number; wholesalePrice: number; taxRate: number;
  isTaxInclusive: boolean; expiryTracking: boolean; isActive: boolean; isFeatured: boolean;
}

export interface InventoryVariantDto { id: string; variantName: string; sku: string; size?: string | null; color?: string | null; costPrice: number; sellingPrice: number; mrp: number; isActive: boolean; }
export interface InventoryProductDetailDto extends SaveProductRequest { id: string; sku: string; variants: InventoryVariantDto[]; }
export interface SaveProductVariantRequest { size?: string | null; color?: string | null; sellingPrice?: number | null; mrp?: number | null; }
export interface SaveProductRequest {
  id?: string | null; shopId: string; name: string; sku?: string | null; barcode?: string | null; categoryId: string;
  subCategory?: string | null; brand?: string | null; hsnSacCode?: string | null; unitOfMeasureId: string; taxSlabId: string;
  costPrice: number; sellingPrice: number; mrp: number; wholesalePrice: number; lowStockThreshold: number; maxStockThreshold: number;
  openingStock: number; reorderQuantity: number; isTaxInclusive: boolean; expiryTracking: boolean; batchTracking: boolean;
  requiresPrescription: boolean; composition?: string | null; manufacturer?: string | null; foodType: FoodType;
  preparationTimeMinutes?: number | null; recipeCost: number; portionSize?: string | null; imageDataUrl?: string | null;
  isActive: boolean; isFeatured: boolean; variants: SaveProductVariantRequest[];
}

export interface SaveCategoryRequest { id?: string | null; shopId: string; parentCategoryId?: string | null; name: string; description?: string | null; imageUrl?: string | null; colorHex?: string | null; displayOrder: number; }
export interface CategoryTreeNodeDto { id: string; name: string; description?: string | null; imageUrl?: string | null; colorHex?: string | null; displayOrder: number; children: CategoryTreeNodeDto[]; }

export interface InventoryBatchDto { id: string; productId: string; productName: string; productVariantId?: string | null; batchNo: string; manufacturingDate?: string | null; expiryDate?: string | null; quantityReceived: number; quantityAvailable: number; rate: number; status: InventoryBatchStatus; isQuarantined: boolean; }
export interface StockVelocityDto { productId: string; productName: string; movementQty: number; class: string; }
export interface InventoryDashboardDto { totalSkus: number; stockValueAtPurchase: number; stockValueAtSelling: number; lowStockCount: number; expiringSoonCount: number; deadStockCount: number; lowStockItems: InventoryProductListItemDto[]; expiringSoonItems: InventoryBatchDto[]; fastMoving: StockVelocityDto[]; slowMoving: StockVelocityDto[]; }

export interface SupplierDetailDto { id: string; shopId: string; name: string; contactPerson?: string | null; phone?: string | null; email?: string | null; taxRegistrationNumber?: string | null; pan?: string | null; address?: string | null; bankDetails?: string | null; creditDays: number; paymentTerms?: string | null; openingBalance: number; outstandingBalance: number; }
export interface SaveSupplierRequest extends Omit<SupplierDetailDto, 'id' | 'outstandingBalance'> { id?: string | null; }
export interface SupplierLedgerRowDto { date: string; type: string; reference: string; debit: number; credit: number; balanceAfter: number; dueDate?: string | null; notes?: string | null; }
export interface SupplierAnalysisDto { supplierId: string; supplierName: string; purchaseTotal: number; paidTotal: number; outstanding: number; averageCreditDays: number; }

export interface CreatePurchaseOrderItemRequest { productId: string; productVariantId?: string | null; expectedQuantity: number; unitCost: number; taxRate: number; }
export interface CreatePurchaseOrderRequest { shopId: string; supplierId: string; expectedDate?: string | null; notes?: string | null; items: CreatePurchaseOrderItemRequest[]; }
export interface PurchaseOrderDto { id: string; shopId: string; supplierId: string; supplierName: string; purchaseOrderNumber: string; orderDate: string; expectedDate?: string | null; status: PurchaseOrderStatus; subTotal: number; taxTotal: number; grandTotal: number; notes?: string | null; items: PurchaseOrderItemDto[]; }
export interface PurchaseOrderItemDto { id: string; productId: string; productName: string; productVariantId?: string | null; expectedQuantity: number; receivedQuantity: number; unitCost: number; taxRate: number; lineTotal: number; }
export interface CreateGrnItemRequest extends CreatePurchaseOrderItemRequest { quantityReceived: number; quantityRejected: number; rate: number; batchNo?: string | null; manufacturingDate?: string | null; expiryDate?: string | null; }
export interface CreateGrnRequest { shopId: string; purchaseOrderId?: string | null; supplierId: string; supplierInvoiceNumber: string; invoiceDate?: string | null; items: CreateGrnItemRequest[]; }
export interface GrnDto { id: string; shopId: string; purchaseInvoiceId: string; purchaseOrderId?: string | null; grnNumber: string; receivedAt: string; isApproved: boolean; mismatchSummary?: string | null; items: GrnItemDto[]; }
export interface GrnItemDto { id: string; productId: string; productName: string; productVariantId?: string | null; expectedQuantity: number; quantityReceived: number; quantityRejected: number; batchNo?: string | null; manufacturingDate?: string | null; expiryDate?: string | null; rate: number; }

export interface CreateInventoryAdjustmentLineRequest { productId: string; productVariantId?: string | null; newQuantity: number; reason?: string | null; }
export interface CreateInventoryAdjustmentRequest { shopId: string; adjustmentType: StockAdjustmentType; reason: string; referenceNumber?: string | null; notes?: string | null; items: CreateInventoryAdjustmentLineRequest[]; }
export interface InventoryAdjustmentDto { id: string; shopId: string; adjustmentNumber: string; adjustmentDate: string; adjustmentType: StockAdjustmentType; status: AdjustmentStatus; reason: string; referenceNumber?: string | null; isApproved: boolean; netQuantityChange: number; }
export interface AdjustmentVoucherDto { adjustmentNumber: string; html: string; }
export interface StockLedgerRowDto { date: string; movementType: string; direction: string; inQuantity: number; outQuantity: number; runningBalance: number; referenceType: string; notes?: string | null; }
export interface UnitConversionDto { id: string; shopId: string; baseUnitId: string; baseUnit: string; alternateUnitId: string; alternateUnit: string; factor: number; isActive: boolean; }
export interface SaveUnitConversionRequest { id?: string | null; shopId: string; baseUnitId: string; alternateUnitId: string; factor: number; isActive: boolean; }
export interface InventoryAlertDto { id: string; severity: NotificationSeverity; title: string; message: string; isRead: boolean; createdAt: string; }
