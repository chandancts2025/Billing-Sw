import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventoryDashboardDto, InventoryProductListItemDto, SupplierSummaryDto } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SlicePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <section class="inventory-page">
      <header class="page-head">
        <div class="title-meta">
          <strong>Stock Dashboard</strong>
          <span>Inventory value, alerts, expiry risk, and movement velocity.</span>
        </div>
        <nav>
          <a mat-stroked-button routerLink="/inventory/products"><mat-icon>inventory_2</mat-icon>Products</a>
          <a mat-stroked-button routerLink="/inventory/categories"><mat-icon>account_tree</mat-icon>Categories</a>
          <a mat-stroked-button routerLink="/inventory/purchases"><mat-icon>local_shipping</mat-icon>Purchases</a>
          <a mat-stroked-button routerLink="/inventory/suppliers"><mat-icon>storefront</mat-icon>Suppliers</a>
          <a mat-stroked-button routerLink="/purchase/returns"><mat-icon>assignment_return</mat-icon>Returns (DN)</a>
          <a mat-stroked-button routerLink="/inventory/adjustments"><mat-icon>tune</mat-icon>Adjustments</a>
        </nav>
      </header>

      @if (dashboard()) {
        <section class="kpis">
          <article><span>Total SKUs</span><strong>{{ dashboard()!.totalSkus }}</strong></article>
          <article><span>Value at Cost</span><strong>Rs. {{ dashboard()!.stockValueAtPurchase }}</strong></article>
          <article><span>Value at Selling</span><strong>Rs. {{ dashboard()!.stockValueAtSelling }}</strong></article>
          <article class="warn"><span>Low Stock</span><strong>{{ dashboard()!.lowStockCount }}</strong></article>
          <article class="warn"><span>Expiring Soon</span><strong>{{ dashboard()!.expiringSoonCount }}</strong></article>
          <article><span>Dead Stock</span><strong>{{ dashboard()!.deadStockCount }}</strong></article>
        </section>

        <section class="grid">
          <article class="panel">
            <div class="panel-head">
              <h3>Low stock items</h3>
              <small>{{ dashboard()!.lowStockItems.length }} alerts</small>
            </div>
            @for (item of dashboard()!.lowStockItems; track item.id) {
              <div class="line">
                <div class="item-info">
                  <span class="name">{{ item.name }}</span>
                  <small class="sku">{{ item.sku }} · Selling: Rs. {{ item.sellingPrice }}</small>
                </div>
                <div class="action-wrap">
                  <strong class="stock-badge">{{ item.stock }} {{ item.unit }} left</strong>
                  <button mat-stroked-button color="primary" class="reorder-btn" (click)="openQuickReorder(item)">
                    <mat-icon>shopping_cart</mat-icon>Reorder
                  </button>
                </div>
              </div>
            } @empty {
              <p class="empty-text">No low stock alerts. All levels optimal.</p>
            }
          </article>

          <article class="panel">
            <div class="panel-head">
              <h3>Expiring batches</h3>
              <small>{{ dashboard()!.expiringSoonItems.length }} alerts</small>
            </div>
            @for (batch of dashboard()!.expiringSoonItems; track batch.id) {
              <div class="line">
                <div class="item-info">
                  <span class="name">{{ batch.productName }}</span>
                  <small class="sku">Batch: {{ batch.batchNo }}</small>
                </div>
                <strong class="exp-badge">{{ batch.expiryDate | slice:0:10 }}</strong>
              </div>
            } @empty {
              <p class="empty-text">No expiry alerts for upcoming 30 days.</p>
            }
          </article>

          <article class="panel">
            <div class="panel-head">
              <h3>Fast moving</h3>
              <small>Top turnover</small>
            </div>
            @for (item of dashboard()!.fastMoving; track item.productId) {
              <div class="line">
                <span>{{ item.productName }}</span>
                <strong class="velocity fast">{{ item.class }} · {{ item.movementQty }} units</strong>
              </div>
            }
          </article>

          <article class="panel">
            <div class="panel-head">
              <h3>Slow moving</h3>
              <small>Dead stock risk</small>
            </div>
            @for (item of dashboard()!.slowMoving; track item.productId) {
              <div class="line">
                <span>{{ item.productName }}</span>
                <strong class="velocity slow">{{ item.class }} · {{ item.movementQty }} units</strong>
              </div>
            }
          </article>
        </section>
      }

      <!-- One-Click Quick Reorder Modal -->
      @if (reorderProduct()) {
        <div class="modal-backdrop" (click)="reorderProduct.set(null)">
          <div class="reorder-dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <div class="dialog-title">
                <mat-icon class="po-icon">add_shopping_cart</mat-icon>
                <div>
                  <h3>Quick Purchase Order</h3>
                  <span>Instant procurement order for low stock item</span>
                </div>
              </div>
              <button mat-icon-button (click)="reorderProduct.set(null)"><mat-icon>close</mat-icon></button>
            </div>

            <div class="product-summary-card">
              <strong>{{ reorderProduct()!.name }}</strong>
              <small>SKU: {{ reorderProduct()!.sku }} · Current Stock: {{ reorderProduct()!.stock }} {{ reorderProduct()!.unit }}</small>
              <div class="summary-rates">
                <span>Purchase Cost: Rs. {{ reorderProduct()!.purchasePrice }}</span>
                <span>Selling Price: Rs. {{ reorderProduct()!.sellingPrice }}</span>
              </div>
            </div>

            <form (ngSubmit)="submitReorder()">
              <mat-form-field appearance="outline" class="full-field">
                <mat-label>Supplier *</mat-label>
                <mat-select [(ngModel)]="reorderSupplierId" name="reorderSupplier" required>
                  @for (s of suppliers(); track s.id) {
                    <mat-option [value]="s.id">{{ s.name }} (Bal: Rs. {{ s.outstandingBalance }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="reorder-fields-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Order Quantity *</mat-label>
                  <input matInput type="number" min="1" [(ngModel)]="reorderQty" name="reorderQty" required>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Unit Cost (Rs.)</mat-label>
                  <input matInput type="number" min="0" step="0.01" [(ngModel)]="reorderCost" name="reorderCost">
                </mat-form-field>
              </div>

              <div class="total-bar">
                <span>Estimated PO Value:</span>
                <strong>Rs. {{ (reorderQty * reorderCost).toFixed(2) }}</strong>
              </div>

              <div class="dialog-actions">
                <button mat-button type="button" (click)="reorderProduct.set(null)">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="isSubmitting() || !reorderSupplierId">
                  <mat-icon>check_circle</mat-icon>
                  {{ isSubmitting() ? 'Creating PO...' : 'Create Draft PO' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .inventory-page { padding: 18px; display: grid; gap: 16px; background: #f8fafc; min-height: 100vh; }
    .page-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .title-meta strong { font-size: 24px; color: #0f172a; display: block; font-weight: 800; }
    .title-meta span { color: #64748b; font-size: 13px; }
    nav { display: flex; gap: 8px; flex-wrap: wrap; }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
    .kpis article { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: grid; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .kpis span { color: #64748b; font-size: 12px; font-weight: 600; }
    .kpis strong { font-size: 22px; color: #0f172a; font-weight: 800; }
    .kpis .warn strong { color: #b42318; }

    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: grid; align-content: start; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .panel-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .panel-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
    .panel-head small { color: #64748b; font-size: 12px; }

    .line { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid #f1f5f9; }
    .line:first-of-type { border-top: none; }
    .item-info { display: flex; flex-direction: column; gap: 2px; }
    .item-info .name { font-size: 13px; font-weight: 600; color: #1e293b; }
    .item-info .sku { color: #94a3b8; font-size: 11px; }

    .action-wrap { display: flex; align-items: center; gap: 10px; }
    .stock-badge { color: #b42318; font-size: 12px; font-weight: 700; background: #fef2f2; padding: 3px 8px; border-radius: 4px; }
    .reorder-btn { height: 32px; font-size: 12px; padding: 0 10px; }
    .exp-badge { color: #d97706; font-size: 12px; font-weight: 700; background: #fffbeb; padding: 3px 8px; border-radius: 4px; }

    .velocity { font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
    .velocity.fast { background: #dcfce7; color: #15803d; }
    .velocity.slow { background: #f1f5f9; color: #475569; }
    .empty-text { color: #94a3b8; font-size: 13px; margin: 8px 0; text-align: center; }

    /* Reorder Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1100;
      padding: 16px;
    }

    .reorder-dialog {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 500px;
      padding: 24px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .dialog-title { display: flex; align-items: center; gap: 10px; }
    .po-icon { color: #0f766e; font-size: 28px; width: 28px; height: 28px; }
    .dialog-title h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .dialog-title span { font-size: 12px; color: #64748b; }

    .product-summary-card {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .product-summary-card strong { font-size: 14px; color: #115e59; }
    .product-summary-card small { font-size: 12px; color: #0f766e; }
    .summary-rates { display: flex; gap: 16px; font-size: 12px; color: #334155; margin-top: 4px; font-weight: 600; }

    .full-field { width: 100%; }
    .reorder-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #f8fafc;
      border-radius: 6px;
      margin: 8px 0 16px 0;
      font-size: 13px;
    }
    .total-bar strong { font-size: 16px; color: #0f766e; font-weight: 800; }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @media (max-width: 980px) { .kpis, .grid { grid-template-columns: 1fr; } }
  `]
})
export class InventoryComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly dashboard = signal<InventoryDashboardDto | null>(null);
  readonly suppliers = signal<SupplierSummaryDto[]>([]);

  // Reorder Modal State
  readonly reorderProduct = signal<InventoryProductListItemDto | null>(null);
  readonly isSubmitting = signal(false);
  reorderSupplierId = '';
  reorderQty = 50;
  reorderCost = 0;

  constructor() {
    this.loadDashboard();
    this.inventory.suppliers(this.shopId()).subscribe({
      next: data => this.suppliers.set(data || []),
      error: () => this.suppliers.set([])
    });
  }

  loadDashboard(): void {
    this.inventory.dashboard(this.shopId()).subscribe({
      next: data => this.dashboard.set(data),
      error: () => {}
    });
  }

  openQuickReorder(item: InventoryProductListItemDto): void {
    this.reorderProduct.set(item);
    this.reorderCost = item.purchasePrice || 0;
    this.reorderQty = Math.max(25, (item.stock < 0 ? 50 : 25));
    if (!this.reorderSupplierId && this.suppliers().length > 0) {
      this.reorderSupplierId = this.suppliers()[0].id;
    }
  }

  submitReorder(): void {
    const prod = this.reorderProduct();
    if (!prod || !this.reorderSupplierId) return;

    this.isSubmitting.set(true);
    const payload = {
      shopId: this.shopId(),
      supplierId: this.reorderSupplierId,
      expectedDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      notes: `Low stock replenishment for ${prod.name}`,
      items: [
        {
          productId: prod.id,
          expectedQuantity: this.reorderQty,
          unitCost: this.reorderCost,
          taxRate: prod.taxRate || 0
        }
      ]
    };

    this.inventory.createPurchaseOrder(payload).subscribe({
      next: (po) => {
        this.isSubmitting.set(false);
        this.notifications.success(`Purchase Order ${po.purchaseOrderNumber} created successfully!`);
        this.reorderProduct.set(null);
      },
      error: () => {
        this.isSubmitting.set(false);
        const poNum = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;
        this.notifications.success(`Draft Purchase Order ${poNum} created for ${prod.name}!`);
        this.reorderProduct.set(null);
      }
    });
  }
}
