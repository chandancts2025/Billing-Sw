import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import {
  CategoryDto,
  CategoryType,
  FoodType,
  InventoryLookupDto,
  InventoryProductListItemDto,
  SaveProductRequest,
  SaveProductVariantRequest
} from './inventory.models';
import { InventoryService } from './inventory.service';

export type OperatingMode = 'SUPERMARKET' | 'GROCERY' | 'ELECTRONICS' | 'FASHION' | 'PHARMACY' | 'GENERAL';

interface OperatingModeOption {
  key: OperatingMode;
  title: string;
  shortName: string;
  icon: string;
  categoryType: CategoryType | null;
  description: string;
  themeColor: string;
}

@Component({
  selector: 'be-inventory-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <section class="products-page">
      <!-- Top Header & Operating Mode Switcher -->
      <header class="page-head">
        <div class="head-title">
          <div class="title-with-badge">
            <strong>Universal Product Catalog</strong>
            <span class="mode-badge" [style.background]="currentModeConfig().themeColor + '18'" [style.color]="currentModeConfig().themeColor">
              {{ currentModeConfig().icon }} {{ currentModeConfig().shortName }} Mode
            </span>
          </div>
          <span class="subtext">
            Adaptive multi-vertical inventory engine for hypermarkets, groceries, electronics, apparel, and pharmacy stores.
          </span>
        </div>

        <div class="head-actions">
          <button mat-stroked-button type="button" class="btn-tool" (click)="openBarcodeModal()">
            <mat-icon>qr_code_2</mat-icon> Barcode & Shelf Labels
          </button>
          <button mat-flat-button color="primary" type="button" class="btn-create" (click)="newProduct()">
            <mat-icon>add</mat-icon> New Product
          </button>
        </div>
      </header>

      <!-- Shop Operating Mode Selector Ribbon -->
      <div class="mode-ribbon">
        <div class="ribbon-label">
          <mat-icon>tune</mat-icon>
          <span>Store Preset:</span>
        </div>
        <div class="mode-pills">
          @for (m of operatingModes; track m.key) {
            <button
              type="button"
              class="mode-pill"
              [class.active]="activeOperatingMode() === m.key"
              (click)="setOperatingMode(m.key)"
              [matTooltip]="m.description"
            >
              <span class="pill-icon">{{ m.icon }}</span>
              <span class="pill-text">{{ m.title }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Main Layout: Search/List Column + Product Form Column -->
      <section class="content">
        <!-- Products Sidebar List -->
        <aside class="list-card">
          <div class="list-search">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search SKU, name, barcode, aisle</mat-label>
              <input matInput [(ngModel)]="search" (ngModelChange)="loadProducts()" autocomplete="off">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <!-- Department Quick Filter inside list -->
            <div class="dept-quick-filters">
              <button
                type="button"
                class="filter-chip"
                [class.active]="listDeptFilter() === 'ALL'"
                (click)="listDeptFilter.set('ALL')"
              >
                All ({{ products().length }})
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.active]="listDeptFilter() === 'Groceries'"
                (click)="listDeptFilter.set('Groceries')"
              >
                🥦 Grocery
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.active]="listDeptFilter() === 'Electronics'"
                (click)="listDeptFilter.set('Electronics')"
              >
                📱 Electronics
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.active]="listDeptFilter() === 'Pharmacy'"
                (click)="listDeptFilter.set('Pharmacy')"
              >
                💊 Pharmacy
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.active]="listDeptFilter() === 'Fashion'"
                (click)="listDeptFilter.set('Fashion')"
              >
                👗 Fashion
              </button>
            </div>
          </div>

          <div class="products-scroll">
            @for (product of filteredProductList(); track product.id) {
              <div class="product-item" [class.active]="form.id === product.id">
                <button type="button" class="prod-btn" (click)="edit(product)">
                  <div class="prod-top">
                    <span class="prod-name" [title]="product.name">{{ product.name }}</span>
                    <span class="dept-tag" [style.color]="getDeptColor(product.categoryType)">
                      {{ getDeptIcon(product.categoryType) }}
                    </span>
                  </div>
                  <div class="prod-meta">
                    <span class="sku-code">{{ product.sku }}</span>
                    <span class="stock-pill" [class.low]="product.stock <= 5">
                      {{ product.stock }} {{ product.unit }}
                    </span>
                    <strong class="price">Rs. {{ product.sellingPrice }}</strong>
                  </div>
                  @if (product.rackLocation) {
                    <div class="prod-loc">
                      <mat-icon>pin_drop</mat-icon>
                      <span>{{ product.rackLocation }}</span>
                    </div>
                  }
                </button>
                <button
                  mat-icon-button
                  type="button"
                  class="tag-btn"
                  title="Print barcode label"
                  (click)="openBarcodeForProduct(product, $event)"
                >
                  <mat-icon>local_offer</mat-icon>
                </button>
              </div>
            }

            @if (filteredProductList().length === 0) {
              <div class="empty-list">
                <mat-icon>search_off</mat-icon>
                <p>No products match your search or filter.</p>
              </div>
            }
          </div>
        </aside>

        <!-- Product Details Form -->
        <form class="product-form" (ngSubmit)="save()">
          <div class="form-header-bar">
            <div class="form-title-group">
              <h3>{{ form.id ? 'Edit Product: ' + form.name : 'Add New Product' }}</h3>
              <span class="form-mode-hint">
                @if (activeOperatingMode() === 'SUPERMARKET') {
                  <span>✨ <strong>Smart Supermarket Mode:</strong> Form auto-adapts based on selected category ({{ detectedCategoryType() }}).</span>
                } @else {
                  <span>🎯 <strong>{{ currentModeConfig().title }}:</strong> Showing specialized fields tailored for your business.</span>
                }
              </span>
            </div>

            <!-- Profit Margin & Floor Price Feedback Pill -->
            <div class="margin-badge-card" [class]="marginStatusClass()">
              <div class="margin-metric">
                <span class="metric-title">Gross Margin</span>
                <strong class="metric-val">{{ profitMarginPercent() }}%</strong>
              </div>
              <div class="margin-sub">
                <span>Profit: Rs. {{ profitAmount() }}</span>
                <span class="markup-note">Markup: {{ markupPercent() }}%</span>
              </div>
            </div>
          </div>

          <!-- Section 1: Basic Product Identity -->
          <div class="form-section">
            <div class="section-title">
              <mat-icon class="sec-icon">inventory_2</mat-icon>
              <h4>1. Core Product Details</h4>
            </div>

            <div class="field-grid">
              <mat-form-field appearance="outline" class="col-2">
                <mat-label>Product Name</mat-label>
                <input matInput required [(ngModel)]="form.name" name="name" placeholder="e.g. Fortune Sunlite Sunflower Oil 1L / Samsung Galaxy A54">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Category / Department</mat-label>
                <mat-select required [(ngModel)]="form.categoryId" name="categoryId" (selectionChange)="onCategorySelected($event.value)">
                  @for (c of lookup()?.categories ?? []; track c.id) {
                    <mat-option [value]="c.id">
                      {{ getDeptIcon(c.categoryType) }} {{ c.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Brand / Manufacturer</mat-label>
                <input matInput [(ngModel)]="form.brand" name="brand" placeholder="e.g. Amul, Apple, Nestle, Zara">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>SKU / Item Code</mat-label>
                <input matInput [(ngModel)]="form.sku" name="sku" placeholder="Auto-generated if empty">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Primary EAN / Barcode</mat-label>
                <input matInput [(ngModel)]="form.barcode" name="barcode" placeholder="Scan or type barcode (e.g. 8901030...">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Sub-category</mat-label>
                <input matInput [(ngModel)]="form.subCategory" name="subCategory" placeholder="e.g. Edible Oils, Smartphones">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>HSN / SAC Code</mat-label>
                <input matInput [(ngModel)]="form.hsnSacCode" name="hsnSacCode" placeholder="e.g. 1512 / 8517">
              </mat-form-field>
            </div>
          </div>

          <!-- Section 2: Supermarket Shelf Locator & Multi-Pricing -->
          <div class="form-section highlight-sec">
            <div class="section-title">
              <mat-icon class="sec-icon">storefront</mat-icon>
              <h4>2. Pricing, Multi-Tier Limits & Shelf Locator</h4>
            </div>

            <div class="field-grid">
              <mat-form-field appearance="outline">
                <mat-label>Purchase Cost (₹)</mat-label>
                <input matInput type="number" min="0" step="0.01" [(ngModel)]="form.costPrice" name="costPrice" (ngModelChange)="recalcMargin()">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Retail Selling Price (₹)</mat-label>
                <input matInput required type="number" min="0" step="0.01" [(ngModel)]="form.sellingPrice" name="sellingPrice" (ngModelChange)="recalcMargin()">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>MRP (Max Retail Price ₹)</mat-label>
                <input matInput type="number" min="0" step="0.01" [(ngModel)]="form.mrp" name="mrp">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Wholesale / B2B Price (₹)</mat-label>
                <input matInput type="number" min="0" step="0.01" [(ngModel)]="form.wholesalePrice" name="wholesalePrice">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Floor Price (Min Selling ₹)</mat-label>
                <input matInput type="number" min="0" step="0.01" [(ngModel)]="form.minSellingPrice" name="minSellingPrice" placeholder="Cannot discount below this">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tax Slab Rate</mat-label>
                <mat-select [(ngModel)]="form.taxSlabId" name="taxSlabId">
                  @for (tax of lookup()?.taxSlabs ?? []; track tax.id) {
                    <mat-option [value]="tax.id">{{ tax.name }} ({{ tax.rate }}%)</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <!-- Supermarket Shelf Locator -->
              <mat-form-field appearance="outline" class="col-2">
                <mat-label>Aisle & Shelf Locator</mat-label>
                <input matInput [(ngModel)]="form.rackLocation" name="rackLocation" placeholder="e.g. Aisle 3 / Rack B / Shelf 2 (Helps cashiers & pickers)">
                <mat-icon matPrefix>pin_drop</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Secondary Barcodes / Outer Box</mat-label>
                <input matInput [(ngModel)]="form.secondaryBarcodes" name="secondaryBarcodes" placeholder="Carton barcodes, pack codes (comma separated)">
              </mat-form-field>

              <div class="checkbox-box">
                <mat-checkbox [(ngModel)]="form.isTaxInclusive" name="isTaxInclusive">Tax Inclusive Price</mat-checkbox>
                <mat-checkbox [(ngModel)]="form.isFeatured" name="isFeatured">Featured / Hot Deal</mat-checkbox>
              </div>
            </div>
          </div>

          <!-- Section 3: Inventory Units & Stock Tracking -->
          <div class="form-section">
            <div class="section-title">
              <mat-icon class="sec-icon">warehouse</mat-icon>
              <h4>3. Stock Units & Reorder Automation</h4>
            </div>

            <div class="field-grid">
              <mat-form-field appearance="outline">
                <mat-label>Base Unit of Measure</mat-label>
                <mat-select required [(ngModel)]="form.unitOfMeasureId" name="unitOfMeasureId">
                  @for (u of lookup()?.units ?? []; track u.id) {
                    <mat-option [value]="u.id">{{ u.name }} ({{ u.symbol }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Current Opening Stock</mat-label>
                <input matInput type="number" [(ngModel)]="form.openingStock" name="openingStock">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Low Stock Warning Alert</mat-label>
                <input matInput type="number" [(ngModel)]="form.lowStockThreshold" name="lowStockThreshold">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Auto-Reorder Quantity</mat-label>
                <input matInput type="number" [(ngModel)]="form.reorderQuantity" name="reorderQuantity">
              </mat-form-field>

              <div class="col-2 checkbox-row">
                <mat-checkbox [(ngModel)]="form.batchTracking" name="batchTracking">Batch / Lot Tracking</mat-checkbox>
                <mat-checkbox [(ngModel)]="form.expiryTracking" name="expiryTracking">Expiry Date Monitoring</mat-checkbox>
              </div>
            </div>
          </div>

          <!-- Section 4: DYNAMIC VERTICAL SECTION: GROCERIES & FMCG -->
          @if (isVerticalVisible('Groceries')) {
            <div class="form-section vertical-sec grocery-theme">
              <div class="section-title">
                <span class="v-badge grocery">🥦 Groceries, Food & Supermarket Produce</span>
                <span class="v-hint">Packaging sizes, dietary markers, FSSAI compliance, weighing scales</span>
              </div>

              <div class="field-grid">
                <div class="dietary-selector col-2">
                  <label class="field-label">Dietary Classification:</label>
                  <div class="dietary-options">
                    <label class="diet-radio" [class.selected]="form.foodType === 'Veg'">
                      <input type="radio" name="foodType" value="Veg" [(ngModel)]="form.foodType">
                      <span class="diet-dot veg"></span> Veg
                    </label>
                    <label class="diet-radio" [class.selected]="form.foodType === 'NonVeg'">
                      <input type="radio" name="foodType" value="NonVeg" [(ngModel)]="form.foodType">
                      <span class="diet-dot nonveg"></span> Non-Veg
                    </label>
                    <label class="diet-radio" [class.selected]="form.foodType === 'Egg'">
                      <input type="radio" name="foodType" value="Egg" [(ngModel)]="form.foodType">
                      <span class="diet-dot egg"></span> Contains Egg
                    </label>
                    <label class="diet-radio" [class.selected]="form.foodType === 'Vegan'">
                      <input type="radio" name="foodType" value="Vegan" [(ngModel)]="form.foodType">
                      <span class="diet-dot vegan">🌱</span> 100% Vegan
                    </label>
                    <label class="diet-radio" [class.selected]="form.foodType === 'NotApplicable'">
                      <input type="radio" name="foodType" value="NotApplicable" [(ngModel)]="form.foodType">
                      N/A
                    </label>
                  </div>
                </div>

                <mat-form-field appearance="outline">
                  <mat-label>Pack Size (e.g. 500g, 1L, Pack of 4)</mat-label>
                  <input matInput [(ngModel)]="form.packageSize" name="packageSize">
                </mat-form-field>

                <div class="weight-group">
                  <mat-form-field appearance="outline" class="flex-2">
                    <mat-label>Net Weight / Volume</mat-label>
                    <input matInput type="number" step="0.01" [(ngModel)]="form.netWeight" name="netWeight">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Unit</mat-label>
                    <mat-select [(ngModel)]="form.weightUnit" name="weightUnit">
                      <mat-option value="g">g</mat-option>
                      <mat-option value="kg">kg</mat-option>
                      <mat-option value="ml">ml</mat-option>
                      <mat-option value="L">L</mat-option>
                      <mat-option value="pcs">pcs</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline">
                  <mat-label>Weighing Scale PLU Code</mat-label>
                  <input matInput [(ngModel)]="form.pluCode" name="pluCode" placeholder="Scale lookup (e.g. 101, 204)">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>FSSAI Food License No</mat-label>
                  <input matInput [(ngModel)]="form.fssaiLicenseNo" name="fssaiLicenseNo" placeholder="14-digit FSSAI #">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Shelf Life (in Days)</mat-label>
                  <input matInput type="number" [(ngModel)]="form.shelfLifeDays" name="shelfLifeDays" placeholder="e.g. 180">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Storage Temperature</mat-label>
                  <mat-select [(ngModel)]="form.storageTemperature" name="storageTemperature">
                    <mat-option value="Ambient">Ambient Room Temp</mat-option>
                    <mat-option value="Cool (15-25°C)">Cool & Dry (15-25°C)</mat-option>
                    <mat-option value="Refrigerated (2-8°C)">Refrigerated Chiller (2-8°C)</mat-option>
                    <mat-option value="Frozen (-18°C)">Deep Freeze (-18°C)</mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="col-2 checkbox-row">
                  <mat-checkbox [(ngModel)]="form.isWeighingScaleItem" name="isWeighingScaleItem">
                    ⚖️ Weighing Scale Item (Barcode embeds weight at POS)
                  </mat-checkbox>
                  <mat-checkbox [(ngModel)]="form.isOrganic" name="isOrganic">
                    🌱 Certified Organic Produce
                  </mat-checkbox>
                  <mat-checkbox [(ngModel)]="form.isPerishable" name="isPerishable">
                    ⚠️ Highly Perishable (Daily Rotation)
                  </mat-checkbox>
                </div>
              </div>
            </div>
          }

          <!-- Section 5: DYNAMIC VERTICAL SECTION: ELECTRONICS & MOBILES -->
          @if (isVerticalVisible('Electronics')) {
            <div class="form-section vertical-sec electronics-theme">
              <div class="section-title">
                <span class="v-badge electronics">📱 Electronics, Mobiles & Hardware Appliances</span>
                <span class="v-hint">Serial/IMEI number tracking, warranties, model numbers, and technical specifications</span>
              </div>

              <div class="field-grid">
                <div class="col-2 serial-highlight-card">
                  <mat-checkbox [(ngModel)]="form.isSerialTracked" name="isSerialTracked">
                    <strong>Enable IMEI / Serial Number Tracking at Checkout</strong>
                  </mat-checkbox>
                  <small>Cashiers will be prompted to scan or enter unique device serial numbers upon billing.</small>
                </div>

                <mat-form-field appearance="outline">
                  <mat-label>Warranty Period (Months)</mat-label>
                  <input matInput type="number" [(ngModel)]="form.warrantyMonths" name="warrantyMonths" placeholder="e.g. 12, 24, 36">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Warranty Type</mat-label>
                  <mat-select [(ngModel)]="form.warrantyType" name="warrantyType">
                    <mat-option value="Brand Warranty">Official Brand Warranty</mat-option>
                    <mat-option value="Seller / Store Warranty">Store / Seller Warranty</mat-option>
                    <mat-option value="International Warranty">International Warranty</mat-option>
                    <mat-option value="No Warranty">No Warranty (As-Is)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Model Number</mat-label>
                  <input matInput [(ngModel)]="form.modelNumber" name="modelNumber" placeholder="e.g. SM-A546BZKDINS">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Part / MPN Number</mat-label>
                  <input matInput [(ngModel)]="form.partNumber" name="partNumber" placeholder="Manufacturer Part #">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Return / Replacement Window (Days)</mat-label>
                  <input matInput type="number" [(ngModel)]="form.returnWindowDays" name="returnWindowDays" placeholder="e.g. 7 days replacement">
                </mat-form-field>

                <mat-form-field appearance="outline" class="col-2">
                  <mat-label>Technical Specifications Summary</mat-label>
                  <input matInput [(ngModel)]="form.technicalSpecifications" name="technicalSpecifications" placeholder="e.g. 8GB RAM, 128GB ROM, 5000mAh Battery, 6.4 FHD+ AMOLED">
                </mat-form-field>
              </div>
            </div>
          }

          <!-- Section 6: DYNAMIC VERTICAL SECTION: PHARMACY & HEALTHCARE -->
          @if (isVerticalVisible('Pharmacy')) {
            <div class="form-section vertical-sec pharmacy-theme">
              <div class="section-title">
                <span class="v-badge pharmacy">💊 Pharmacy & Healthcare Specialization</span>
                <span class="v-hint">Active drug salts, drug scheduling, dosage formats, and prescription rules</span>
              </div>

              <div class="field-grid">
                <div class="col-2 rx-card" [class.rx-active]="form.requiresPrescription">
                  <mat-checkbox [(ngModel)]="form.requiresPrescription" name="requiresPrescription">
                    <strong>🩺 Doctor's Prescription (Rx) Mandatory at Billing</strong>
                  </mat-checkbox>
                  <small>Flags prescription verification for pharmacists during sale invoice generation.</small>
                </div>

                <mat-form-field appearance="outline" class="col-2">
                  <mat-label>Active Salt / Generic Composition</mat-label>
                  <input matInput [(ngModel)]="form.composition" name="composition" placeholder="e.g. Paracetamol 500mg + Phenylephrine HCl 5mg">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Drug Schedule Category</mat-label>
                  <mat-select [(ngModel)]="form.drugSchedule" name="drugSchedule">
                    <mat-option value="OTC">OTC (Over the Counter)</mat-option>
                    <mat-option value="Schedule H">Schedule H (Prescription)</mat-option>
                    <mat-option value="Schedule H1">Schedule H1 (High Alert Antibiotics)</mat-option>
                    <mat-option value="Schedule X">Schedule X (Psychotropic / Controlled)</mat-option>
                    <mat-option value="Schedule G">Schedule G (Medical Supervision)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Dosage Form</mat-label>
                  <mat-select [(ngModel)]="form.dosageForm" name="dosageForm">
                    <mat-option value="Tablet">Tablet</mat-option>
                    <mat-option value="Capsule">Capsule</mat-option>
                    <mat-option value="Syrup / Liquid">Syrup / Suspension</mat-option>
                    <mat-option value="Injection / IV">Injection / IV</mat-option>
                    <mat-option value="Ointment / Gel">Ointment / Gel</mat-option>
                    <mat-option value="Drops (Eye/Ear)">Drops (Eye/Ear)</mat-option>
                    <mat-option value="Inhaler / Respule">Inhaler / Respule</mat-option>
                    <mat-option value="Sachet / Powder">Sachet / Powder</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Packaging Unit Details</mat-label>
                  <input matInput [(ngModel)]="form.packagingDetails" name="packagingDetails" placeholder="e.g. Strip of 10 Tablets, 100ml Bottle">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Storage Condition Warning</mat-label>
                  <input matInput [(ngModel)]="form.storageCondition" name="storageCondition" placeholder="e.g. Store below 25°C, Protect from sunlight">
                </mat-form-field>

                <div class="col-2">
                  <mat-checkbox [(ngModel)]="form.isNarcotic" name="isNarcotic">
                    ⚠️ Habit-Forming / Narcotic Controlled Drug (Logs buyer ID in register)
                  </mat-checkbox>
                </div>
              </div>
            </div>
          }

          <!-- Section 7: DYNAMIC VERTICAL SECTION: FASHION & APPAREL -->
          @if (isVerticalVisible('Fashion')) {
            <div class="form-section vertical-sec fashion-theme">
              <div class="section-title">
                <span class="v-badge fashion">👗 Clothing, Footwear & Fashion Matrix</span>
                <span class="v-hint">Gender profiling, fabric materials, fit styles, and size/color SKU generator</span>
              </div>

              <div class="field-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Target Demographic</mat-label>
                  <mat-select [(ngModel)]="form.genderTarget" name="genderTarget">
                    <mat-option value="Men">Men</mat-option>
                    <mat-option value="Women">Women</mat-option>
                    <mat-option value="Unisex">Unisex</mat-option>
                    <mat-option value="Boys">Boys (Kids)</mat-option>
                    <mat-option value="Girls">Girls (Kids)</mat-option>
                    <mat-option value="Infants">Infants (0-2Y)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fabric / Material</mat-label>
                  <input matInput [(ngModel)]="form.materialFabric" name="materialFabric" placeholder="e.g. 100% Pure Cotton, Denim, Silk, Linen">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Cut / Fit Type</mat-label>
                  <mat-select [(ngModel)]="form.fitType" name="fitType">
                    <mat-option value="Slim Fit">Slim Fit</mat-option>
                    <mat-option value="Regular Fit">Regular Fit</mat-option>
                    <mat-option value="Relaxed / Oversized">Relaxed / Oversized</mat-option>
                    <mat-option value="Skinny">Skinny</mat-option>
                    <mat-option value="Tailored">Tailored</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Season Collection</mat-label>
                  <mat-select [(ngModel)]="form.season" name="season">
                    <mat-option value="All Season">All Season</mat-option>
                    <mat-option value="Spring / Summer">Spring / Summer</mat-option>
                    <mat-option value="Autumn / Winter">Autumn / Winter</mat-option>
                    <mat-option value="Festive / Wedding">Festive / Wedding</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="col-2">
                  <mat-label>Style / Article Code</mat-label>
                  <input matInput [(ngModel)]="form.styleCode" name="styleCode" placeholder="e.g. SS26-DEN-004">
                </mat-form-field>
              </div>

              <!-- Interactive Variant Matrix Builder -->
              <div class="variant-matrix-card">
                <div class="variant-head">
                  <div class="vhead-text">
                    <strong>Interactive Size & Color Matrix Generator</strong>
                    <small>Generate multiple SKU variants with independent pricing in 1 click.</small>
                  </div>
                  <button mat-flat-button color="primary" type="button" (click)="generateVariants()">
                    <mat-icon>auto_awesome</mat-icon> Generate Matrix
                  </button>
                </div>

                <!-- Quick Presets -->
                <div class="quick-preset-bar">
                  <span class="preset-label">Quick Presets:</span>
                  <button type="button" class="preset-btn" (click)="applySizePreset('S, M, L, XL, XXL')">Apparel (S-XXL)</button>
                  <button type="button" class="preset-btn" (click)="applySizePreset('28, 30, 32, 34, 36, 38')">Waist (28-38)</button>
                  <button type="button" class="preset-btn" (click)="applySizePreset('UK 6, UK 7, UK 8, UK 9, UK 10')">Shoes (UK 6-10)</button>
                  <button type="button" class="preset-btn" (click)="applyColorPreset('Black, Navy Blue, White, Grey')">Core Colors</button>
                </div>

                <div class="matrix-inputs">
                  <mat-form-field appearance="outline">
                    <mat-label>Sizes (comma separated)</mat-label>
                    <input matInput [(ngModel)]="sizes" name="sizes" placeholder="e.g. S, M, L, XL">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Colors (comma separated)</mat-label>
                    <input matInput [(ngModel)]="colors" name="colors" placeholder="e.g. Black, Navy, Olive">
                  </mat-form-field>
                </div>

                @if (form.variants.length > 0) {
                  <div class="generated-variants">
                    <span class="gen-count">{{ form.variants.length }} Generated Variants:</span>
                    <div class="chips-wrap">
                      @for (v of form.variants; track $index) {
                        <div class="variant-chip">
                          <span class="v-name">{{ v.size || '-' }} / {{ v.color || '-' }}</span>
                          <span class="v-price">₹{{ v.sellingPrice }}</span>
                          <button type="button" class="chip-del" (click)="removeVariant($index)">&times;</button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Cross-Vertical Details Toggle (For mixed retail stores) -->
          @if (activeOperatingMode() !== 'SUPERMARKET') {
            <div class="cross-vertical-toggle">
              <button mat-button type="button" (click)="toggleCrossVertical()">
                <mat-icon>{{ showCrossVertical() ? 'expand_less' : 'add_circle' }}</mat-icon>
                {{ showCrossVertical() ? 'Hide Additional Department Fields' : '+ Show Cross-Department Fields (Groceries, Electronics, Fashion)' }}
              </button>
            </div>
          }

          <!-- Section 8: Product Media & Status -->
          <div class="form-section">
            <div class="section-title">
              <mat-icon class="sec-icon">image</mat-icon>
              <h4>4. Media & Availability</h4>
            </div>

            <div class="media-row">
              <div class="upload-box">
                <input type="file" id="prodImg" accept="image/*" (change)="imageSelected($event)">
                <label for="prodImg" class="file-label">
                  <mat-icon>cloud_upload</mat-icon>
                  <span>Choose product photo (&lt; 200KB)</span>
                </label>
              </div>

              @if (form.imageDataUrl) {
                <div class="preview-box">
                  <img [src]="form.imageDataUrl" alt="Product preview">
                  <button type="button" class="del-img" (click)="form.imageDataUrl = null">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }

              <div class="status-toggles">
                <mat-checkbox [(ngModel)]="form.isActive" name="isActive">Active for Sale & POS Billing</mat-checkbox>
              </div>
            </div>
          </div>

          <!-- Bottom Form Actions -->
          <div class="form-actions-bar">
            @if (message()) {
              <div class="status-toast" [class.error]="isError()">
                <mat-icon>{{ isError() ? 'error' : 'check_circle' }}</mat-icon>
                <span>{{ message() }}</span>
              </div>
            }
            <div class="btn-group">
              <button mat-stroked-button type="button" (click)="newProduct()">Clear Form</button>
              <button mat-flat-button color="primary" type="submit" class="save-btn">
                <mat-icon>save</mat-icon> {{ form.id ? 'Update Product' : 'Save Product' }}
              </button>
            </div>
          </div>
        </form>
      </section>

      <!-- Barcode Labels Generator Modal -->
      @if (showBarcodeModal()) {
        <div class="modal-backdrop" (click)="showBarcodeModal.set(false)">
          <div class="barcode-dialog print-target" (click)="$event.stopPropagation()">
            <div class="dialog-header no-print">
              <div class="dialog-title-block">
                <mat-icon class="title-icon">qr_code_2</mat-icon>
                <div>
                  <h2>Barcode Label & Shelf Tag Generator</h2>
                  <span>Generate sticky price tags for retail shelves or direct thermal sticker rolls.</span>
                </div>
              </div>
              <button mat-icon-button (click)="showBarcodeModal.set(false)"><mat-icon>close</mat-icon></button>
            </div>

            <!-- Controls Panel -->
            <div class="barcode-controls no-print">
              <div class="ctrl-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Product</mat-label>
                  <mat-select [ngModel]="barcodeProduct()?.id" (ngModelChange)="onBarcodeProductChange($event)">
                    @for (p of products(); track p.id) {
                      <mat-option [value]="p.id">{{ p.name }} ({{ p.sku }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Label Format</mat-label>
                  <mat-select [(ngModel)]="labelSheetFormat">
                    <mat-option value="sheet24">A4 Sheet (24 Labels - 3x8)</mat-option>
                    <mat-option value="sheet48">A4 Sheet (48 Labels - 4x12)</mat-option>
                    <mat-option value="thermal">Thermal Roll (50mm x 25mm)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Labels Count</mat-label>
                  <input matInput type="number" min="1" max="240" [(ngModel)]="labelCount">
                </mat-form-field>
              </div>

              <div class="toggle-row">
                <mat-checkbox [(ngModel)]="showStoreName">Store Name</mat-checkbox>
                <mat-checkbox [(ngModel)]="showMrp">Show MRP</mat-checkbox>
                <mat-checkbox [(ngModel)]="showPrice">Selling Price</mat-checkbox>
                <mat-checkbox [(ngModel)]="showSku">SKU Code</mat-checkbox>
                <mat-checkbox [(ngModel)]="showRack">Aisle / Shelf</mat-checkbox>
              </div>
            </div>

            <!-- Live Printable Labels Preview -->
            <div class="labels-preview-wrap">
              <div class="labels-container" [class]="labelSheetFormat">
                @for (i of labelsArray(); track $index) {
                  <div class="barcode-label-card">
                    @if (showStoreName) {
                      <div class="lbl-store">{{ storeName }}</div>
                    }
                    <div class="lbl-name">{{ activeLabelProduct().name }}</div>
                    
                    <div class="lbl-barcode-box">
                      <svg viewBox="0 0 100 24" preserveAspectRatio="none" class="barcode-svg">
                        @for (bar of barcodeBars(); track $index) {
                          <rect [attr.x]="$index * 1.58" y="0" [attr.width]="bar ? '1.1' : '0'" height="24" fill="#000" />
                        }
                      </svg>
                      @if (showSku) {
                        <span class="lbl-code">{{ activeLabelProduct().sku }}</span>
                      }
                    </div>

                    <div class="lbl-price-row">
                      @if (showMrp && activeLabelProduct().mrp) {
                        <span class="lbl-mrp">MRP: Rs.{{ activeLabelProduct().mrp }}</span>
                      }
                      @if (showPrice) {
                        <strong class="lbl-price">Rs. {{ activeLabelProduct().sellingPrice }}</strong>
                      }
                    </div>

                    @if (showRack && activeLabelProduct().rackLocation) {
                      <div class="lbl-loc">{{ activeLabelProduct().rackLocation }}</div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="dialog-footer no-print">
              <span class="print-hint">Tip: Set Margins to "None" in printer settings for exact label alignment.</span>
              <div class="btn-group">
                <button mat-button (click)="showBarcodeModal.set(false)">Close</button>
                <button mat-flat-button color="primary" (click)="printLabels()">
                  <mat-icon>print</mat-icon> Print {{ labelCount }} Labels
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .products-page { padding: 18px; display: grid; gap: 14px; background: #f8fafc; min-height: 100vh; font-family: inherit; }
    
    /* Top Header */
    .page-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .title-with-badge { display: flex; align-items: center; gap: 10px; }
    .page-head strong { font-size: 24px; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; }
    .mode-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid currentColor; }
    .subtext { color: #64748b; font-size: 13px; display: block; margin-top: 2px; }
    .head-actions { display: flex; gap: 10px; }
    .btn-tool { border-color: #cbd5e1; color: #334155; }
    .btn-create { background: #0f766e; }

    /* Store Operating Mode Ribbon */
    .mode-ribbon {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow-x: auto;
    }
    .ribbon-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .ribbon-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #0f766e; }
    .mode-pills { display: flex; gap: 8px; flex-wrap: nowrap; }
    .mode-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      background: #ffffff;
      font-size: 12px;
      font-weight: 600;
      color: #475467;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease-in-out;
    }
    .mode-pill:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .mode-pill.active {
      background: #0f766e;
      color: #ffffff;
      border-color: #0f766e;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.25);
    }
    .pill-icon { font-size: 14px; }

    /* Content Layout */
    .content { display: grid; grid-template-columns: 340px 1fr; gap: 16px; }

    /* Sidebar List */
    .list-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: calc(100vh - 180px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .search-field { width: 100%; margin-bottom: -10px; }
    .dept-quick-filters { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
    .filter-chip {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
    }
    .filter-chip.active { background: #0f766e; color: #ffffff; border-color: #0f766e; }
    .products-scroll { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; flex: 1; }

    .product-item {
      display: flex;
      align-items: center;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      background: #ffffff;
      transition: all 0.15s;
    }
    .product-item:hover, .product-item.active { background: #f0fdfa; border-color: #5eead4; }
    .prod-btn {
      flex: 1;
      text-align: left;
      background: transparent;
      border: none;
      padding: 8px 10px;
      cursor: pointer;
      display: grid;
      gap: 3px;
    }
    .prod-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .prod-name { font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
    .dept-tag { font-size: 13px; }
    .prod-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748b; }
    .sku-code { font-family: monospace; color: #475467; font-weight: 600; }
    .stock-pill { background: #ecfdf5; color: #047857; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
    .stock-pill.low { background: #fef2f2; color: #b91c1c; }
    .price { margin-left: auto; color: #0f766e; font-size: 12px; }
    .prod-loc { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #0369a1; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; width: fit-content; }
    .prod-loc mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .tag-btn { color: #64748b; }
    .empty-list { text-align: center; padding: 32px 16px; color: #94a3b8; }

    /* Product Form */
    .product-form {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      max-height: calc(100vh - 180px);
      overflow-y: auto;
    }
    .form-header-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; gap: 14px; }
    .form-title-group h3 { margin: 0 0 2px 0; font-size: 18px; font-weight: 800; color: #0f172a; }
    .form-mode-hint { font-size: 12px; color: #64748b; }

    /* Gross Margin Badge */
    .margin-badge-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
    }
    .margin-badge-card.profit { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .margin-badge-card.low { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .margin-badge-card.loss { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .margin-metric { display: flex; flex-direction: column; }
    .metric-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-val { font-size: 18px; font-weight: 800; }
    .margin-sub { display: flex; flex-direction: column; font-size: 11px; font-weight: 600; text-align: right; }
    .markup-note { opacity: 0.8; font-size: 10px; }

    /* Form Sections */
    .form-section {
      background: #fafbfc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-section.highlight-sec { background: #f0fdfa; border-color: #ccfbf1; }
    .section-title { display: flex; align-items: center; gap: 8px; }
    .sec-icon { color: #0f766e; font-size: 20px; width: 20px; height: 20px; }
    .section-title h4 { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.03em; }

    .field-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .col-2 { grid-column: span 2; }
    .weight-group { display: flex; gap: 6px; }
    .flex-2 { flex: 2; }
    .flex-1 { flex: 1; }
    .checkbox-box { display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .checkbox-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }

    /* Vertical Specialized Styles */
    .vertical-sec { border-width: 2px; }
    .grocery-theme { background: #f0fdf4; border-color: #86efac; }
    .electronics-theme { background: #f0f9ff; border-color: #7dd3fc; }
    .pharmacy-theme { background: #fff1f2; border-color: #fecdd3; }
    .fashion-theme { background: #faf5ff; border-color: #e9d5ff; }

    .v-badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      color: #ffffff;
    }
    .v-badge.grocery { background: #16a34a; }
    .v-badge.electronics { background: #0284c7; }
    .v-badge.pharmacy { background: #e11d48; }
    .v-badge.fashion { background: #9333ea; }
    .v-hint { font-size: 12px; color: #64748b; margin-left: 8px; }

    /* Dietary Radio Selector */
    .dietary-selector { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 600; color: #475467; }
    .dietary-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .diet-radio {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .diet-radio input { display: none; }
    .diet-radio.selected { border-color: #16a34a; background: #dcfce7; color: #14532d; font-weight: 700; }
    .diet-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
    .diet-dot.veg { background: #16a34a; border: 1px solid #14532d; }
    .diet-dot.nonveg { background: #b91c1c; border: 1px solid #7f1d1d; }
    .diet-dot.egg { background: #f59e0b; border: 1px solid #b45309; }
    .diet-dot.vegan { font-size: 12px; }

    /* Electronics Serial Card */
    .serial-highlight-card {
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* Pharmacy Rx Card */
    .rx-card {
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* Fashion Variant Matrix Builder */
    .variant-matrix-card {
      background: #ffffff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .variant-head { display: flex; justify-content: space-between; align-items: center; }
    .vhead-text strong { font-size: 13px; color: #581c87; display: block; }
    .vhead-text small { color: #7e22ce; font-size: 11px; }
    .quick-preset-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .preset-label { font-size: 11px; font-weight: 700; color: #64748b; }
    .preset-btn {
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #d8b4fe;
      background: #faf5ff;
      color: #7e22ce;
      font-size: 11px;
      cursor: pointer;
    }
    .matrix-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .variant-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f3e8ff;
      border: 1px solid #d8b4fe;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    .v-name { font-weight: 700; color: #581c87; }
    .v-price { color: #0f766e; font-weight: 600; }
    .chip-del { background: transparent; border: none; font-size: 16px; color: #9333ea; cursor: pointer; padding: 0 2px; }

    /* Cross-Vertical Toggle */
    .cross-vertical-toggle { text-align: center; }
    .cross-vertical-toggle button { color: #0f766e; font-weight: 600; }

    /* Media Upload */
    .media-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .upload-box input { display: none; }
    .file-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #475467;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .preview-box { position: relative; width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; }
    .preview-box img { width: 100%; height: 100%; object-fit: cover; }
    .del-img { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 2px; }
    .del-img mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Form Actions Bar */
    .form-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      gap: 12px;
    }
    .status-toast { display: flex; align-items: center; gap: 6px; color: #0f766e; font-size: 13px; font-weight: 700; }
    .status-toast.error { color: #b91c1c; }
    .btn-group { display: flex; gap: 10px; margin-left: auto; }
    .save-btn { min-width: 140px; background: #0f766e; }

    /* Barcode Labels Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1200;
      padding: 16px;
    }
    .barcode-dialog {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 840px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .dialog-header { padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
    .dialog-title-block { display: flex; align-items: center; gap: 12px; }
    .title-icon { color: #0f766e; font-size: 32px; width: 32px; height: 32px; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .dialog-header span { font-size: 13px; color: #64748b; }
    .barcode-controls { padding: 16px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
    .ctrl-grid { display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 12px; }
    .toggle-row { display: flex; gap: 18px; flex-wrap: wrap; }
    .labels-preview-wrap { flex: 1; padding: 20px 24px; overflow-y: auto; background: #f1f5f9; }
    .labels-container { display: grid; gap: 10px; margin: 0 auto; background: #ffffff; padding: 14px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
    .labels-container.sheet24 { grid-template-columns: repeat(3, 1fr); max-width: 640px; }
    .labels-container.sheet48 { grid-template-columns: repeat(4, 1fr); max-width: 700px; }
    .labels-container.thermal { grid-template-columns: 1fr; max-width: 260px; }
    .barcode-label-card { border: 1px dashed #cbd5e1; padding: 8px 10px; text-align: center; border-radius: 4px; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80px; }
    .lbl-store { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .lbl-name { font-size: 11px; font-weight: 700; color: #0f172a; margin: 2px 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lbl-barcode-box { width: 100%; max-width: 140px; margin: 3px 0; display: flex; flex-direction: column; align-items: center; }
    .barcode-svg { width: 100%; height: 22px; display: block; }
    .lbl-code { font-family: monospace; font-size: 9px; letter-spacing: 1px; color: #1e293b; margin-top: 1px; }
    .lbl-price-row { display: flex; justify-content: center; align-items: baseline; gap: 6px; font-size: 11px; margin-top: 2px; }
    .lbl-mrp { font-size: 10px; color: #64748b; text-decoration: line-through; }
    .lbl-price { font-size: 12px; font-weight: 800; color: #0f766e; }
    .lbl-loc { font-size: 9px; font-weight: 600; color: #0369a1; margin-top: 2px; }
    .dialog-footer { padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; background: #ffffff; }
    .print-hint { font-size: 12px; color: #64748b; }

    @media print {
      body * { visibility: hidden; }
      .print-target, .print-target * { visibility: visible; }
      .print-target { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; border: none; box-shadow: none; padding: 0; }
      .labels-preview-wrap { background: transparent; padding: 0; }
      .labels-container { box-shadow: none; padding: 0; border: none; }
      .barcode-label-card { border: 1px solid #e2e8f0; page-break-inside: avoid; }
      .no-print { display: none !important; }
    }

    @media (max-width: 1100px) {
      .content { grid-template-columns: 1fr; }
      .field-grid { grid-template-columns: 1fr 1fr; }
      .list-card, .product-form { max-height: none; }
    }
    @media (max-width: 680px) {
      .products-page { padding: 10px; }
      .page-head { flex-direction: column; align-items: flex-start; gap: 10px; }
      .head-actions { width: 100%; display: flex; gap: 8px; }
      .head-actions button { flex: 1; }
      .mode-pills { overflow-x: auto; width: 100%; padding-bottom: 4px; }
      .field-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .ctrl-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InventoryProductsComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);

  // Store Operating Mode Presets
  readonly operatingModes: OperatingModeOption[] = [
    {
      key: 'SUPERMARKET',
      title: 'Supermarket / Hypermarket',
      shortName: 'Supermarket',
      icon: '🛒',
      categoryType: null,
      description: 'Smart multi-department mode. Form automatically adapts to selected category.',
      themeColor: '#0f766e'
    },
    {
      key: 'GROCERY',
      title: 'Grocery & Superstore',
      shortName: 'Grocery',
      icon: '🥦',
      categoryType: 'Groceries',
      description: 'Optimized for FMCG, food items, dietary labels, weighing scales, and FSSAI.',
      themeColor: '#16a34a'
    },
    {
      key: 'ELECTRONICS',
      title: 'Mobile & Electronics Store',
      shortName: 'Electronics',
      icon: '📱',
      categoryType: 'Electronics',
      description: 'Optimized for IMEI tracking, warranties, model specs, and serial numbers.',
      themeColor: '#0284c7'
    },
    {
      key: 'FASHION',
      title: 'Clothing & Fashion Boutique',
      shortName: 'Fashion',
      icon: '👗',
      categoryType: 'Fashion',
      description: 'Optimized for sizes, colors, fabric, fit, season, and variant matrices.',
      themeColor: '#9333ea'
    },
    {
      key: 'PHARMACY',
      title: 'Pharmacy & Healthcare Chemist',
      shortName: 'Pharmacy',
      icon: '💊',
      categoryType: 'Pharmacy',
      description: 'Optimized for Doctor Rx, active drug salts, dosage forms, and schedules.',
      themeColor: '#e11d48'
    },
    {
      key: 'GENERAL',
      title: 'General Retail & Mart',
      shortName: 'General',
      icon: '📦',
      categoryType: 'General',
      description: 'Clean, standard retail form without specialized vertical overhead.',
      themeColor: '#475467'
    }
  ];

  readonly activeOperatingMode = signal<OperatingMode>(
    (localStorage.getItem('billease_operating_mode') as OperatingMode) || 'SUPERMARKET'
  );

  readonly currentModeConfig = computed(() =>
    this.operatingModes.find(m => m.key === this.activeOperatingMode()) ?? this.operatingModes[0]
  );

  readonly lookup = signal<InventoryLookupDto | null>(null);
  readonly products = signal<InventoryProductListItemDto[]>([]);
  readonly message = signal('');
  readonly isError = signal(false);

  search = '';
  listDeptFilter = signal<string>('ALL');
  sizes = '';
  colors = '';
  form = this.blank();
  showCrossVertical = signal(false);

  // Barcode Labels Generator State
  readonly showBarcodeModal = signal(false);
  readonly barcodeProduct = signal<InventoryProductListItemDto | null>(null);
  labelCount = 24;
  labelSheetFormat = 'sheet24';
  showStoreName = true;
  showMrp = true;
  showPrice = true;
  showSku = true;
  showRack = true;
  storeName = 'BillEase Pro Supermarket';

  // Derived Category Department
  readonly detectedCategoryType = computed<CategoryType>(() => {
    const catId = this.form.categoryId;
    const cat = this.lookup()?.categories.find(c => c.id === catId);
    return cat?.categoryType ?? 'General';
  });

  // Profit Margin & Real-time Calculations
  readonly profitAmount = computed(() => {
    const cost = Number(this.form.costPrice) || 0;
    const sell = Number(this.form.sellingPrice) || 0;
    return Math.round((sell - cost) * 100) / 100;
  });

  readonly profitMarginPercent = computed(() => {
    const cost = Number(this.form.costPrice) || 0;
    const sell = Number(this.form.sellingPrice) || 0;
    if (sell <= 0) return 0;
    return Math.round(((sell - cost) / sell) * 1000) / 10;
  });

  readonly markupPercent = computed(() => {
    const cost = Number(this.form.costPrice) || 0;
    const sell = Number(this.form.sellingPrice) || 0;
    if (cost <= 0) return 0;
    return Math.round(((sell - cost) / cost) * 1000) / 10;
  });

  readonly marginStatusClass = computed(() => {
    const m = this.profitMarginPercent();
    if (m < 0) return 'loss';
    if (m < 15) return 'low';
    return 'profit';
  });

  // Filtered Products for List
  readonly filteredProductList = computed(() => {
    const list = this.products();
    const filter = this.listDeptFilter();
    if (filter === 'ALL') return list;
    return list.filter(p => (p.categoryType ?? 'General') === filter);
  });

  readonly activeLabelProduct = computed(() => {
    const sel = this.barcodeProduct();
    if (sel) return sel;
    if (this.form.name) {
      return {
        id: this.form.id || 'curr',
        name: this.form.name,
        sku: this.form.sku || this.form.barcode || '8901234567890',
        mrp: this.form.mrp,
        sellingPrice: this.form.sellingPrice,
        unit: 'pcs',
        category: '',
        purchasePrice: this.form.costPrice,
        wholesalePrice: this.form.wholesalePrice,
        taxRate: 0,
        isTaxInclusive: true,
        expiryTracking: false,
        isActive: true,
        isFeatured: false,
        stock: 100,
        rackLocation: this.form.rackLocation
      };
    }
    const first = this.products()[0];
    return first || {
      id: 'demo',
      name: 'Supermarket Demo Item',
      sku: '8901234567890',
      mrp: 299,
      sellingPrice: 249,
      unit: 'pcs',
      category: '',
      purchasePrice: 180,
      wholesalePrice: 220,
      taxRate: 18,
      isTaxInclusive: true,
      expiryTracking: false,
      isActive: true,
      isFeatured: false,
      stock: 50,
      rackLocation: 'Aisle 1'
    };
  });

  readonly barcodeBars = computed(() => {
    const code = this.activeLabelProduct().sku || '8901234567890';
    let seed = [...code].reduce((sum, c) => sum + c.charCodeAt(0), 17);
    return Array.from({ length: 64 }, (_, idx) => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return idx === 0 || idx === 1 || idx === 62 || idx === 63 || (seed % 3 !== 0);
    });
  });

  readonly labelsArray = computed(() => Array.from({ length: Math.max(1, Math.min(this.labelCount, 240)) }));

  constructor() {
    this.inventory.lookup(this.shopId()).subscribe(data => {
      this.lookup.set(data);
      this.form.categoryId = data.categories[0]?.id ?? '';
      this.form.unitOfMeasureId = data.units[0]?.id ?? '';
      this.form.taxSlabId = data.taxSlabs[0]?.id ?? '';
    });
    this.loadProducts();
  }

  setOperatingMode(mode: OperatingMode): void {
    this.activeOperatingMode.set(mode);
    localStorage.setItem('billease_operating_mode', mode);
    const targetType = this.currentModeConfig().categoryType;
    if (targetType) {
      const match = this.lookup()?.categories.find(c => c.categoryType === targetType);
      if (match) {
        this.form.categoryId = match.id;
      }
    }
  }

  isVerticalVisible(vertical: 'Groceries' | 'Electronics' | 'Pharmacy' | 'Fashion'): boolean {
    if (this.showCrossVertical()) return true;

    const mode = this.activeOperatingMode();
    if (mode === 'SUPERMARKET') {
      return this.detectedCategoryType() === vertical;
    }
    if (mode === 'GROCERY' && vertical === 'Groceries') return true;
    if (mode === 'ELECTRONICS' && vertical === 'Electronics') return true;
    if (mode === 'PHARMACY' && vertical === 'Pharmacy') return true;
    if (mode === 'FASHION' && vertical === 'Fashion') return true;

    return false;
  }

  toggleCrossVertical(): void {
    this.showCrossVertical.update(v => !v);
  }

  loadProducts(): void {
    this.inventory.products(this.shopId(), this.search).subscribe(rows => this.products.set(rows));
  }

  newProduct(): void {
    this.form = this.blank();
    const targetType = this.currentModeConfig().categoryType;
    if (targetType) {
      const match = this.lookup()?.categories.find(c => c.categoryType === targetType);
      if (match) this.form.categoryId = match.id;
    }
    this.message.set('');
    this.isError.set(false);
  }

  edit(product: InventoryProductListItemDto): void {
    this.inventory.product(product.id).subscribe(detail => {
      this.form = {
        ...detail,
        imageDataUrl: null,
        variants: (detail.variants ?? []).map(v => ({
          size: v.size,
          color: v.color,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp
        }))
      };
      this.message.set('');
      this.isError.set(false);
    });
  }

  onCategorySelected(categoryId: string): void {
    // If grocery category chosen, default foodType to Veg
    const cat = this.lookup()?.categories.find(c => c.id === categoryId);
    if (cat?.categoryType === 'Groceries' && this.form.foodType === 'NotApplicable') {
      this.form.foodType = 'Veg';
    }
  }

  recalcMargin(): void {
    // Handled by signal computations
  }

  applySizePreset(presetString: string): void {
    this.sizes = presetString;
  }

  applyColorPreset(presetString: string): void {
    this.colors = presetString;
  }

  generateVariants(): void {
    const sizes = this.sizes.split(',').map(x => x.trim()).filter(Boolean);
    const colors = this.colors.split(',').map(x => x.trim()).filter(Boolean);
    if (sizes.length === 0 && colors.length === 0) return;

    const listSizes = sizes.length > 0 ? sizes : [null];
    const listColors = colors.length > 0 ? colors : [null];

    this.form.variants = listSizes.flatMap(size =>
      listColors.map(color => ({
        size: size || undefined,
        color: color || undefined,
        sellingPrice: this.form.sellingPrice,
        mrp: this.form.mrp
      } satisfies SaveProductVariantRequest))
    );
  }

  removeVariant(index: number): void {
    this.form.variants.splice(index, 1);
  }

  imageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      this.message.set('Compress image to 200KB or less before upload.');
      this.isError.set(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => (this.form.imageDataUrl = String(reader.result));
    reader.readAsDataURL(file);
  }

  save(): void {
    this.isError.set(false);
    this.inventory.saveProduct({ ...this.form, shopId: this.shopId() }).subscribe({
      next: product => {
        this.message.set(`Saved "${product.name}" successfully.`);
        this.isError.set(false);
        this.loadProducts();
      },
      error: err => {
        this.message.set(err?.error?.message || 'Could not save product. Verify required fields and image size.');
        this.isError.set(true);
      }
    });
  }

  openBarcodeModal(): void {
    if (!this.barcodeProduct() && this.products().length > 0) {
      this.barcodeProduct.set(this.products()[0]);
    }
    this.showBarcodeModal.set(true);
  }

  openBarcodeForProduct(product: InventoryProductListItemDto, event: Event): void {
    event.stopPropagation();
    this.barcodeProduct.set(product);
    this.showBarcodeModal.set(true);
  }

  onBarcodeProductChange(id: string): void {
    const prod = this.products().find(p => p.id === id);
    if (prod) this.barcodeProduct.set(prod);
  }

  printLabels(): void {
    window.print();
  }

  getDeptIcon(type?: CategoryType): string {
    switch (type) {
      case 'Groceries': return '🥦';
      case 'Electronics': return '📱';
      case 'Pharmacy': return '💊';
      case 'Fashion': return '👗';
      case 'HomeAndKitchen': return '🍳';
      default: return '📦';
    }
  }

  getDeptColor(type?: CategoryType): string {
    switch (type) {
      case 'Groceries': return '#16a34a';
      case 'Electronics': return '#0284c7';
      case 'Pharmacy': return '#dc2626';
      case 'Fashion': return '#9333ea';
      case 'HomeAndKitchen': return '#ea580c';
      default: return '#475467';
    }
  }

  private blank(): SaveProductRequest {
    return {
      shopId: this.shopId(),
      name: '',
      sku: null,
      barcode: null,
      categoryId: this.lookup()?.categories[0]?.id ?? '',
      subCategory: null,
      brand: null,
      hsnSacCode: null,
      unitOfMeasureId: this.lookup()?.units[0]?.id ?? '',
      taxSlabId: this.lookup()?.taxSlabs[0]?.id ?? '',
      costPrice: 0,
      sellingPrice: 0,
      mrp: 0,
      wholesalePrice: 0,
      lowStockThreshold: 5,
      maxStockThreshold: 100,
      openingStock: 0,
      reorderQuantity: 10,
      isTaxInclusive: false,
      expiryTracking: false,
      batchTracking: false,
      requiresPrescription: false,
      composition: null,
      manufacturer: null,
      foodType: 'NotApplicable',
      preparationTimeMinutes: null,
      recipeCost: 0,
      portionSize: null,
      imageDataUrl: null,
      isActive: true,
      isFeatured: false,
      variants: [],

      // Universal Supermarket & Locators
      rackLocation: null,
      secondaryBarcodes: null,
      minSellingPrice: 0,

      // Groceries
      packageSize: null,
      netWeight: null,
      weightUnit: 'g',
      isWeighingScaleItem: false,
      pluCode: null,
      fssaiLicenseNo: null,
      shelfLifeDays: null,
      storageTemperature: 'Ambient',
      isOrganic: false,
      isPerishable: false,
      countryOfOrigin: 'India',

      // Electronics
      isSerialTracked: false,
      warrantyMonths: null,
      warrantyType: 'Brand Warranty',
      modelNumber: null,
      partNumber: null,
      technicalSpecifications: null,
      returnWindowDays: 7,

      // Pharmacy
      drugSchedule: 'OTC',
      dosageForm: 'Tablet',
      packagingDetails: null,
      isNarcotic: false,
      storageCondition: null,

      // Fashion
      genderTarget: 'Unisex',
      materialFabric: null,
      fitType: 'Regular Fit',
      season: 'All Season',
      styleCode: null,
      customAttributesJson: null
    };
  }
}
