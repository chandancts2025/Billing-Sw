import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { InventoryDashboardDto } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory',
  standalone: true,
  imports: [RouterLink, SlicePipe, MatButtonModule, MatIconModule],
  template: `
    <section class="inventory-page">
      <header class="page-head">
        <div><strong>Stock Dashboard</strong><span>Inventory value, alerts, expiry risk, and movement velocity.</span></div>
        <nav>
          <a mat-stroked-button routerLink="/inventory/products"><mat-icon>inventory_2</mat-icon>Products</a>
          <a mat-stroked-button routerLink="/inventory/categories"><mat-icon>account_tree</mat-icon>Categories</a>
          <a mat-stroked-button routerLink="/inventory/purchases"><mat-icon>local_shipping</mat-icon>Purchases</a>
          <a mat-stroked-button routerLink="/inventory/suppliers"><mat-icon>storefront</mat-icon>Suppliers</a>
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
            <h3>Low stock items</h3>
            @for (item of dashboard()!.lowStockItems; track item.id) {
              <div class="line"><span>{{ item.name }}</span><strong>{{ item.stock }} {{ item.unit }}</strong></div>
            } @empty { <p>No low stock alerts.</p> }
          </article>
          <article class="panel">
            <h3>Expiring batches</h3>
            @for (batch of dashboard()!.expiringSoonItems; track batch.id) {
              <div class="line"><span>{{ batch.productName }} / {{ batch.batchNo }}</span><strong>{{ batch.expiryDate | slice:0:10 }}</strong></div>
            } @empty { <p>No expiry alerts.</p> }
          </article>
          <article class="panel">
            <h3>Fast moving</h3>
            @for (item of dashboard()!.fastMoving; track item.productId) {
              <div class="line"><span>{{ item.productName }}</span><strong>{{ item.class }} | {{ item.movementQty }}</strong></div>
            }
          </article>
          <article class="panel">
            <h3>Slow moving</h3>
            @for (item of dashboard()!.slowMoving; track item.productId) {
              <div class="line"><span>{{ item.productName }}</span><strong>{{ item.class }} | {{ item.movementQty }}</strong></div>
            }
          </article>
        </section>
      }
    </section>
  `,
  styles: [`
    .inventory-page { padding: 14px; display: grid; gap: 14px; }
    .page-head { display: grid; gap: 12px; }
    .page-head div { display: grid; gap: 3px; }
    .page-head strong { font-size: 22px; }
    .page-head span, p { color: #667085; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; }
    .kpis { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 10px; }
    article { background: white; border: 1px solid #dfe5ec; border-radius: 8px; }
    .kpis article { display: grid; gap: 6px; padding: 14px; }
    .kpis span { color: #667085; font-size: 12px; }
    .kpis strong { font-size: 22px; color: #101828; }
    .kpis .warn strong { color: #b42318; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .panel { padding: 14px; display: grid; align-content: start; gap: 8px; }
    h3 { margin: 0; font-size: 15px; }
    .line { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid #edf1f6; }
    @media (max-width: 980px) { .kpis, .grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 620px) { .kpis, .grid { grid-template-columns: 1fr; } }
  `]
})
export class InventoryComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly dashboard = signal<InventoryDashboardDto | null>(null);

  constructor() {
    this.inventory.dashboard(this.shopId()).subscribe(data => this.dashboard.set(data));
  }
}
