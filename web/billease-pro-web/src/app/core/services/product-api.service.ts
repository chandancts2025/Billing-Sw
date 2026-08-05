import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { InventoryProductDetailDto, InventoryProductListItemDto, SaveProductRequest } from '../../features/inventory/inventory.models';
import { ProductSearchResultDto } from '../../features/billing/billing.models';

@Injectable({ providedIn: 'root' })
export class ProductApiService extends ApiService {
  search(shopId: string, search = '') { return this.http.get<InventoryProductListItemDto[]>(this.url('inventory/products'), { params: this.params({ shopId, search }) }); }
  getById(id: string) { return this.http.get<InventoryProductDetailDto>(this.url(`inventory/products/${id}`)); }
  getByBarcode(shopId: string, barcode: string) { return this.http.get<ProductSearchResultDto[]>(this.url('billing/products/search'), { params: this.params({ shopId, term: barcode }) }); }
  lowStock(shopId: string) { return this.http.post(this.url('reports/run'), { shopId, reportKey: 'low-stock', from: new Date(0).toISOString(), to: new Date().toISOString(), groupBy: 'day', deadStockDays: 90 }); }
  save(payload: SaveProductRequest) { return this.http.post<InventoryProductDetailDto>(this.url('inventory/products'), payload); }
}
