import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { BillingService } from './billing.service';
import {
  BillHistoryRowDto,
  BillQuoteDto,
  CustomerSearchResultDto,
  DiscountValueType,
  PaymentMethod,
  ProductBatchOptionDto,
  ProductSearchResultDto,
  SaleInvoiceDetailDto,
  SaleInvoiceForEditDto
} from './billing.models';

interface BillLine {
  key: string;
  product: ProductSearchResultDto;
  batch?: ProductBatchOptionDto | null;
  quantity: number;
  unitPrice: number;
  discountType: DiscountValueType;
  discountValue: number;
}

@Component({
  selector: 'be-billing-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="pos-container">
      <!-- TOP STATUS & SHORTCUT BAR -->
      <header class="pos-topbar">
        <div class="topbar-left">
          <div class="pos-brand-pill">
            <mat-icon class="brand-icon">point_of_sale</mat-icon>
            <span class="brand-title">Universal Billing POS</span>
            <span class="live-dot" title="System Online"></span>
          </div>

          <div class="pos-context-pill">
            <mat-icon>storefront</mat-icon>
            <span>Counter #1</span>
            <span class="sep">|</span>
            <mat-icon>account_circle</mat-icon>
            <span>{{ cashierName() }}</span>
          </div>

          @if (isAlteringBill()) {
            <div class="mode-pill alter-mode-pill">
              <mat-icon>edit_note</mat-icon>
              <span>Altering Bill: <strong>#{{ alteringInvoiceNumber() }}</strong></span>
              <span class="status-tag" [class.confirmed]="alteringInvoiceStatus() === 'Confirmed'">{{ alteringInvoiceStatus() }}</span>
              <button type="button" class="btn-pill-exit" (click)="exitAlterMode()" title="Exit alteration mode">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @if (resumedDraftId() && !isAlteringBill()) {
            <div class="mode-pill draft-mode-pill">
              <mat-icon>inventory_2</mat-icon>
              <span>Resumed Held Bill</span>
              <button type="button" class="btn-pill-exit" (click)="exitDraftMode()" title="Discard / Close draft">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

        <div class="topbar-right">
          <button type="button" class="topbar-btn" [class.active]="barcodeMode()" (click)="toggleBarcodeMode()" title="Toggle Barcode Scanner Mode (F3)">
            <mat-icon>qr_code_scanner</mat-icon>
            <span>Barcode (F3)</span>
          </button>

          <button type="button" class="topbar-btn" [class.active]="catalogView()" (click)="catalogView.set(!catalogView())" title="Toggle Visual Product Catalog">
            <mat-icon>{{ catalogView() ? 'table_rows' : 'grid_view' }}</mat-icon>
            <span>{{ catalogView() ? 'List View' : 'Visual Catalog' }}</span>
          </button>

          <button type="button" class="topbar-btn drafts-btn" (click)="openDraftsDrawer()" title="View Held / Suspended Bills">
            <mat-icon>inventory_2</mat-icon>
            <span>Held Bills</span>
            @if (draftsCount() > 0) {
              <span class="counter-badge">{{ draftsCount() }}</span>
            }
          </button>

          <button type="button" class="topbar-btn custom-item-btn" (click)="openCustomItemModal()" title="Add Custom Item / Service (F4)">
            <mat-icon>add_shopping_cart</mat-icon>
            <span>Custom (F4)</span>
          </button>
        </div>
      </header>

      <!-- MAIN WORKSPACE: 2-PANEL LAYOUT -->
      <main class="pos-workspace">
        <!-- LEFT PANEL: ITEMS & CART -->
        <section class="cart-panel">
          <!-- SEARCH & QUICK ADD BAR -->
          <div class="search-section">
            <div class="search-input-wrapper">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                #productSearch
                type="text"
                class="main-search-input"
                placeholder="Scan barcode or search by name, SKU, category (Press F2)..."
                [(ngModel)]="productTerm"
                (ngModelChange)="searchProducts()"
                (keydown.enter)="addFirstProduct()"
                autocomplete="off"
              />
              @if (productTerm) {
                <button type="button" class="btn-clear-search" (click)="productTerm = ''; searchProducts()">
                  <mat-icon>close</mat-icon>
                </button>
              }
              <div class="search-kbd-hint"><kbd>F2</kbd></div>

              <!-- ANCHORED SEARCH TYPEAHEAD DROPLIST -->
              @if (productMatches().length > 0) {
                <div class="typeahead-dropdown">
                  <div class="dropdown-header">
                    <span>Search Results ({{ productMatches().length }})</span>
                    <small>Click or press <kbd>Enter</kbd> to add first</small>
                  </div>
                  <div class="dropdown-list">
                    @for (product of productMatches(); track product.productId + product.sku) {
                      <div class="typeahead-item" (click)="addProduct(product)">
                        <div class="item-left">
                          <div class="item-title-row">
                            @if (product.foodType === 'Veg') { <span class="diet-dot veg" title="Vegetarian"></span> }
                            @if (product.foodType === 'NonVeg') { <span class="diet-dot nonveg" title="Non-Vegetarian"></span> }
                            @if (product.foodType === 'Vegan') { <span class="diet-dot vegan" title="Vegan">🌱</span> }
                            <strong class="item-name">{{ product.name }}</strong>
                            @if (product.requiresPrescription) { <span class="badge rx-badge">Rx</span> }
                            @if (product.warrantyMonths) { <span class="badge wty-badge">{{ product.warrantyMonths }}M Wty</span> }
                          </div>
                          <div class="item-sub-meta">
                            <span class="sku-tag">{{ product.sku }}</span>
                            <span class="cat-tag">{{ product.category }}</span>
                            @if (product.packageSize) { <span>{{ product.packageSize }}</span> }
                            @if (product.rackLocation) { <span class="rack-tag">📍 {{ product.rackLocation }}</span> }
                          </div>
                        </div>
                        <div class="item-right">
                          <div class="stock-indicator" [class.low-stock]="product.stockQuantity < 5">
                            {{ product.stockQuantity }} {{ product.unit }} left
                          </div>
                          <div class="price-stack">
                            <strong class="sell-price">₹{{ product.sellingPrice.toFixed(2) }}</strong>
                            @if (product.mrp > product.sellingPrice) {
                              <span class="mrp-strike">MRP ₹{{ product.mrp }}</span>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- VISUAL CATALOG GRID (COLLAPSIBLE) -->
          @if (catalogView()) {
            <div class="catalog-tray">
              <div class="category-tabs">
                @for (cat of categories; track cat) {
                  <button
                    type="button"
                    class="category-tab-btn"
                    [class.active]="selectedCategory() === cat"
                    (click)="filterCatalog(cat)">
                    {{ cat }}
                  </button>
                }
              </div>

              <div class="catalog-cards-grid">
                @for (item of filteredCatalog(); track item.productId) {
                  <div class="catalog-card" (click)="addProduct(item)">
                    <div class="card-top">
                      <span class="card-category">{{ item.category }}</span>
                      <div class="card-badges">
                        @if (item.foodType === 'Veg') { <span class="diet-dot veg"></span> }
                        @if (item.foodType === 'NonVeg') { <span class="diet-dot nonveg"></span> }
                        @if (item.requiresPrescription) { <span class="badge rx-badge">Rx</span> }
                        <span class="card-stock" [class.low]="item.stockQuantity < 10">{{ item.stockQuantity }} {{ item.unit }}</span>
                      </div>
                    </div>
                    <strong class="card-title">{{ item.name }}</strong>
                    <div class="card-sku">{{ item.sku }} {{ item.packageSize ? '· ' + item.packageSize : '' }}</div>
                    @if (item.rackLocation) {
                      <div class="card-rack">📍 {{ item.rackLocation }}</div>
                    }
                    <div class="card-bottom">
                      <div class="card-price-group">
                        <strong class="card-price">₹{{ item.sellingPrice }}</strong>
                        @if (item.mrp > item.sellingPrice) {
                          <span class="card-mrp">₹{{ item.mrp }}</span>
                        }
                      </div>
                      <button type="button" class="btn-card-add">
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- EXPIRY WARNING BANNER -->
          @if (expiringItemsWarning().length > 0 && !expiryAlertDismissed()) {
            <div class="pos-alert-banner expiry-banner">
              <div class="alert-content">
                <mat-icon class="alert-icon">warning_amber</mat-icon>
                <div class="alert-text">
                  <strong>Expiry Radar Notice: {{ expiringItemsWarning().length }} item(s) near or past expiry</strong>
                  <div class="expiry-chips-list">
                    @for (w of expiringItemsWarning(); track w.key) {
                      <span class="expiry-chip" [class.danger]="w.isExpired">
                        {{ w.productName }} [{{ w.batchName }}]: {{ w.statusText }}
                      </span>
                    }
                  </div>
                </div>
              </div>
              <button type="button" class="btn-dismiss-alert" (click)="expiryAlertDismissed.set(true)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          <!-- CART TABLE CONTAINER -->
          <div class="bill-table-wrapper">
            <div class="table-toolbar">
              <div class="table-title">
                <mat-icon class="cart-icon">shopping_bag</mat-icon>
                <span class="title-text">Bill Items</span>
                <span class="count-pill">{{ lines().length }} items</span>
                @if (totalItemQuantity() > 0) {
                  <span class="units-pill">{{ totalItemQuantity() }} units</span>
                }
              </div>

              @if (lines().length > 0) {
                <button type="button" class="btn-empty-cart" (click)="clearAllLines()">
                  <mat-icon>remove_shopping_cart</mat-icon>
                  <span>Empty Cart</span>
                </button>
              }
            </div>

            <!-- TABLE HEADER -->
            <div class="table-header-row">
              <span class="col-item">Product & Batch</span>
              <span class="col-unit">Unit</span>
              <span class="col-qty">Quantity</span>
              <span class="col-mrp">MRP</span>
              <span class="col-rate">Rate (₹)</span>
              <span class="col-disc">Discount</span>
              <span class="col-tax">Tax</span>
              <span class="col-total">Total (₹)</span>
              <span class="col-action">Del</span>
            </div>

            <!-- TABLE ROWS -->
            <div class="table-body">
              @for (line of lines(); track line.key; let idx = $index) {
                <div class="table-row-card" tabindex="0" (keydown.delete)="deleteLine(line.key)">
                  <!-- Product Column -->
                  <div class="col-item">
                    <div class="item-name-row">
                      <span class="row-num">{{ idx + 1 }}</span>
                      @if (line.product.foodType === 'Veg') { <span class="diet-dot veg"></span> }
                      @if (line.product.foodType === 'NonVeg') { <span class="diet-dot nonveg"></span> }
                      @if (line.product.foodType === 'Vegan') { <span class="diet-dot vegan">🌱</span> }
                      <strong class="prod-name">{{ line.product.name }}</strong>
                      @if (line.product.requiresPrescription) { <span class="badge rx-badge">Rx</span> }
                      @if (line.product.warrantyMonths) { <span class="badge wty-badge">{{ line.product.warrantyMonths }}M</span> }
                    </div>
                    <div class="item-meta-row">
                      <span class="sku-text">{{ line.product.sku }}</span>
                      @if (line.product.hsnSacCode) { <span>HSN: {{ line.product.hsnSacCode }}</span> }
                      @if (line.product.rackLocation) { <span>📍 {{ line.product.rackLocation }}</span> }
                      @if (line.batch?.expiryDate) {
                        <span class="batch-exp-pill" [class.expired]="isExpired(line.batch?.expiryDate)" [class.soon]="isExpiringSoon(line.batch?.expiryDate)">
                          {{ getExpiryStatusText(line.batch?.expiryDate) }}
                        </span>
                      }
                    </div>

                    <!-- Batch Selector if applicable -->
                    @if (line.product.requiresBatchSelection) {
                      <div class="batch-selector-row">
                        <label>Batch:</label>
                        <select [ngModel]="line.batch?.productVariantId" (ngModelChange)="selectBatch(line.key, $event)">
                          @for (batch of line.product.batches; track batch.productVariantId) {
                            <option [value]="batch.productVariantId">
                              {{ batch.batchName }} (Qty: {{ batch.stockQuantity }} | Exp: {{ batch.expiryDate ? (batch.expiryDate | date:'mediumDate') : 'None' }})
                            </option>
                          }
                        </select>
                      </div>
                    }
                  </div>

                  <!-- Unit Column -->
                  <div class="col-unit">
                    <span class="unit-tag">{{ line.product.unit }}</span>
                  </div>

                  <!-- Quantity Stepper Column -->
                  <div class="col-qty">
                    <div class="qty-stepper">
                      <button type="button" class="btn-step minus" (click)="decrementQty(line)" title="Decrease quantity">
                        <mat-icon>remove</mat-icon>
                      </button>
                      <input
                        type="number"
                        min="0.01"
                        step="1"
                        class="stepper-input"
                        [(ngModel)]="line.quantity"
                        (ngModelChange)="lineChanged()"
                        (focus)="$any($event.target).select()"
                      />
                      <button type="button" class="btn-step plus" (click)="incrementQty(line)" title="Increase quantity">
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>

                  <!-- MRP Column -->
                  <div class="col-mrp">
                    <span class="mrp-val">₹{{ line.product.mrp }}</span>
                  </div>

                  <!-- Rate / Unit Price Column -->
                  <div class="col-rate">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="cell-input rate-input"
                      [(ngModel)]="line.unitPrice"
                      (ngModelChange)="lineChanged()"
                      (focus)="$any($event.target).select()"
                    />
                  </div>

                  <!-- Discount Column -->
                  <div class="col-disc">
                    <div class="discount-input-group">
                      <select class="disc-type-sel" [(ngModel)]="line.discountType" (ngModelChange)="lineChanged()">
                        <option value="Percentage">%</option>
                        <option value="FlatAmount">₹</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="cell-input disc-input"
                        [(ngModel)]="line.discountValue"
                        (ngModelChange)="lineChanged()"
                        (focus)="$any($event.target).select()"
                      />
                    </div>
                  </div>

                  <!-- Tax Column -->
                  <div class="col-tax">
                    <span class="tax-badge">{{ line.product.taxRate }}%</span>
                  </div>

                  <!-- Total Column -->
                  <div class="col-total">
                    <strong class="line-total-val">₹{{ lineTotal(line).toFixed(2) }}</strong>
                  </div>

                  <!-- Delete Action Column -->
                  <div class="col-action">
                    <button type="button" class="btn-del-row" (click)="deleteLine(line.key)" title="Remove item (Del key)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-cart-state">
                  <div class="empty-icon-ring">
                    <mat-icon>shopping_cart</mat-icon>
                  </div>
                  <h3>No items added to the bill yet</h3>
                  <p>Scan barcode, search products using <kbd>F2</kbd>, or choose from the visual catalog.</p>
                  <div class="empty-shortcuts">
                    <span><kbd>F2</kbd> Product Search</span>
                    <span><kbd>F3</kbd> Barcode Mode</span>
                    <span><kbd>F4</kbd> Custom Item</span>
                    <span><kbd>F5</kbd> Hold Bill</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- RIGHT PANEL: CUSTOMER, SETTLEMENT & TOTALS -->
        <aside class="settlement-panel">
          <!-- CUSTOMER CARD -->
          <div class="settlement-card customer-card">
            <div class="card-heading">
              <div class="heading-title">
                <mat-icon class="heading-icon">person</mat-icon>
                <span>Customer</span>
              </div>
              <button type="button" class="btn-add-cust-link" (click)="openAddCustomerModal()">
                <mat-icon>person_add</mat-icon>
                <span>New Customer</span>
              </button>
            </div>

            <!-- Customer Mode Segmented Control -->
            <div class="segmented-control">
              <button type="button" class="seg-btn" [class.active]="walkIn" (click)="setWalkInMode(true)">
                <mat-icon>storefront</mat-icon>
                <span>Walk-in</span>
              </button>
              <button type="button" class="seg-btn" [class.active]="!walkIn" (click)="setWalkInMode(false)">
                <mat-icon>badge</mat-icon>
                <span>Registered</span>
              </button>
            </div>

            @if (walkIn) {
              <div class="walkin-field">
                <mat-form-field appearance="outline" class="w-full compact-field">
                  <mat-label>Customer Name / Phone (Optional)</mat-label>
                  <input matInput [(ngModel)]="customerTerm" placeholder="Walk-in Customer" />
                </mat-form-field>
              </div>
            } @else {
              <!-- Registered Customer Search -->
              <div class="registered-customer-picker">
                <div class="cust-search-box">
                  <mat-form-field appearance="outline" class="w-full compact-field">
                    <mat-label>Search Customer by Name / Phone</mat-label>
                    <input matInput [(ngModel)]="customerTerm" (ngModelChange)="searchCustomers()" placeholder="Enter name or mobile number" />
                    @if (selectedCustomer()) {
                      <button matSuffix mat-icon-button type="button" (click)="clearSelectedCustomer()">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </mat-form-field>

                  @if (customerMatches().length > 0) {
                    <div class="customer-results-dropdown">
                      @for (cust of customerMatches(); track cust.id) {
                        <div class="cust-result-item" (click)="selectCustomer(cust)">
                          <div>
                            <strong>{{ cust.name }}</strong>
                            <small>{{ cust.phone }}</small>
                          </div>
                          <span class="pts-pill">{{ cust.loyaltyPoints }} Pts</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (selectedCustomer()) {
                  <div class="selected-customer-pill">
                    <div class="cust-info">
                      <strong>{{ selectedCustomer()!.name }}</strong>
                      <span>{{ selectedCustomer()!.phone }}</span>
                    </div>
                    <div class="cust-metrics">
                      <span class="metric-loyalty">⭐ {{ selectedCustomer()!.loyaltyPoints }} Pts</span>
                      @if (selectedCustomer()!.outstandingBalance > 0) {
                        <span class="metric-due">Due: ₹{{ selectedCustomer()!.outstandingBalance }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- BILL TOTALS & DISCOUNTS -->
          <div class="settlement-card totals-card">
            <div class="totals-breakdown">
              <div class="summary-line">
                <span>Sub Total</span>
                <strong>₹{{ (quote()?.totals?.subTotal ?? localSubtotal()).toFixed(2) }}</strong>
              </div>

              @if ((quote()?.totals?.itemDiscountTotal ?? 0) > 0) {
                <div class="summary-line discount-line">
                  <span>Item Discounts</span>
                  <strong>- ₹{{ quote()!.totals.itemDiscountTotal.toFixed(2) }}</strong>
                </div>
              }

              <!-- Bill Discount & Coupon Input Row -->
              <div class="discount-inputs-row">
                <div class="bill-disc-input">
                  <label>Bill Discount</label>
                  <div class="disc-pair">
                    <select [(ngModel)]="billDiscountType" (ngModelChange)="recalculate()">
                      <option [value]="null">None</option>
                      <option value="Percentage">%</option>
                      <option value="FlatAmount">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      [(ngModel)]="billDiscountValue"
                      (ngModelChange)="recalculate()"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div class="coupon-input">
                  <label>Promo Code</label>
                  <div class="coupon-pair">
                    <input type="text" placeholder="CODE" [(ngModel)]="couponCode" />
                    <button type="button" class="btn-apply-coupon" (click)="applyCoupon()">Apply</button>
                  </div>
                </div>
              </div>

              @if (couponMessage()) {
                <div class="coupon-alert-msg" [class.success]="couponMessage().includes('applied')">
                  {{ couponMessage() }}
                </div>
              }

              @if ((quote()?.totals?.billDiscountAmount ?? 0) > 0) {
                <div class="summary-line discount-line">
                  <span>Bill Discount</span>
                  <strong>- ₹{{ quote()!.totals.billDiscountAmount.toFixed(2) }}</strong>
                </div>
              }

              @if ((quote()?.totals?.couponDiscountAmount ?? 0) > 0) {
                <div class="summary-line discount-line">
                  <span>Coupon Discount</span>
                  <strong>- ₹{{ quote()!.totals.couponDiscountAmount.toFixed(2) }}</strong>
                </div>
              }

              <div class="summary-line">
                <span>Taxable Amount</span>
                <span>₹{{ (quote()?.totals?.taxableAmount ?? 0).toFixed(2) }}</span>
              </div>

              <!-- GST Breakdown -->
              @for (tax of quote()?.taxBreakup ?? []; track tax.rate) {
                <div class="tax-detail-row">
                  <span>GST ({{ tax.rate }}%) <small>CGST ₹{{ tax.cgst }} | SGST ₹{{ tax.sgst }}</small></span>
                  <strong>₹{{ tax.totalTax }}</strong>
                </div>
              }

              @if (quote()?.totals?.roundOff) {
                <div class="summary-line">
                  <span>Round Off</span>
                  <span>₹{{ quote()!.totals.roundOff.toFixed(2) }}</span>
                </div>
              }
            </div>

            <!-- HERO GRAND TOTAL DISPLAY -->
            <div class="hero-total-banner">
              <div class="total-label-group">
                <span class="total-caption">TOTAL AMOUNT DUE</span>
                <span class="total-items-sub">{{ lines().length }} items ({{ totalItemQuantity() }} units)</span>
              </div>
              <div class="total-figure">
                <span class="curr-symbol">₹</span>
                <span class="total-digits">{{ currentGrandTotal() }}</span>
              </div>
            </div>
          </div>

          <!-- PAYMENT METHODS & TENDER -->
          <div class="settlement-card payment-card">
            <div class="card-heading">
              <div class="heading-title">
                <mat-icon class="heading-icon">payments</mat-icon>
                <span>Payment Mode</span>
              </div>
              @if (paymentMode === 'UPI') {
                <button type="button" class="btn-qr-modal-link" (click)="openUpiModal()">
                  <mat-icon>qr_code_2</mat-icon>
                  <span>Dynamic QR</span>
                </button>
              }
            </div>

            <!-- VISUAL PAYMENT SELECTOR TABS -->
            <div class="payment-tabs-grid">
              <button
                type="button"
                class="pay-tab"
                [class.selected]="paymentMode === 'Cash'"
                (click)="selectPaymentMode('Cash')">
                <mat-icon>local_atm</mat-icon>
                <span>Cash</span>
              </button>

              <button
                type="button"
                class="pay-tab"
                [class.selected]="paymentMode === 'UPI'"
                (click)="selectPaymentMode('UPI')">
                <mat-icon>qr_code</mat-icon>
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                class="pay-tab"
                [class.selected]="paymentMode === 'Card'"
                (click)="selectPaymentMode('Card')">
                <mat-icon>credit_card</mat-icon>
                <span>Card</span>
              </button>

              <button
                type="button"
                class="pay-tab"
                [class.selected]="paymentMode === 'Credit'"
                (click)="selectPaymentMode('Credit')">
                <mat-icon>account_balance_wallet</mat-icon>
                <span>Store Credit</span>
              </button>

              <button
                type="button"
                class="pay-tab"
                [class.selected]="paymentMode === 'Split'"
                (click)="selectPaymentMode('Split')">
                <mat-icon>call_split</mat-icon>
                <span>Split</span>
              </button>
            </div>

            <!-- CASH ASSISTANT -->
            @if (paymentMode === 'Cash') {
              <div class="cash-tender-section">
                <!-- Denomination Quick Chips -->
                <div class="cash-chips-row">
                  <button type="button" class="cash-chip chip-exact" (click)="setExactCash()">Exact</button>
                  <button type="button" class="cash-chip" (click)="addCash(50)">+50</button>
                  <button type="button" class="cash-chip" (click)="addCash(100)">+100</button>
                  <button type="button" class="cash-chip" (click)="addCash(500)">+500</button>
                  <button type="button" class="cash-chip" (click)="setDenomination(500)">₹500</button>
                  <button type="button" class="cash-chip" (click)="setDenomination(1000)">₹1000</button>
                  <button type="button" class="cash-chip" (click)="setDenomination(2000)">₹2000</button>
                </div>

                <div class="tender-input-row">
                  <label>Cash Tendered (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="tender-input"
                    [(ngModel)]="amountTendered"
                    (ngModelChange)="recalculate()"
                    (focus)="$any($event.target).select()"
                  />
                </div>

                <!-- CHANGE DUE HIGH CONTRAST BANNER -->
                @if (changeDue() > 0) {
                  <div class="change-due-banner">
                    <div class="change-left">
                      <mat-icon>change_circle</mat-icon>
                      <span>CHANGE TO RETURN:</span>
                    </div>
                    <strong class="change-amount">₹{{ changeDue().toFixed(2) }}</strong>
                  </div>
                }
              </div>
            }

            @if (paymentMode === 'UPI' || paymentMode === 'Card') {
              <div class="ref-input-section">
                <mat-form-field appearance="outline" class="w-full compact-field">
                  <mat-label>{{ paymentMode === 'UPI' ? 'UPI UTR / Reference #' : 'Card Auth / Last 4 Digits' }}</mat-label>
                  <input matInput [(ngModel)]="paymentReference" placeholder="e.g. 987654321012" />
                </mat-form-field>
              </div>
            }
          </div>

          <!-- CHECKOUT ACTION BUTTONS -->
          <div class="checkout-actions-card">
            <div class="action-buttons-grid">
              <button type="button" class="pos-act-btn btn-draft" (click)="saveDraft()" title="Hold or save bill as draft (F5)">
                <mat-icon>pause_circle_outline</mat-icon>
                <div class="btn-label-stack">
                  <strong>Hold Bill</strong>
                  <small>F5 Key</small>
                </div>
              </button>

              <button type="button" class="pos-act-btn btn-clear" (click)="cancel()" title="Cancel and clear all (Esc)">
                <mat-icon>close</mat-icon>
                <div class="btn-label-stack">
                  <strong>Clear</strong>
                  <small>Esc Key</small>
                </div>
              </button>

              <button
                type="button"
                class="pos-act-btn btn-pay-print"
                (click)="promptConfirm(true, true)"
                [disabled]="lines().length === 0"
                title="Pay, Confirm & Print Receipt (F6)">
                <mat-icon>print</mat-icon>
                <div class="btn-label-stack">
                  <strong>Pay & Print</strong>
                  <small>F6 Key</small>
                </div>
              </button>

              <button
                type="button"
                class="pos-act-btn btn-confirm"
                (click)="promptConfirm(true, false)"
                [disabled]="lines().length === 0"
                title="Generate & Confirm Invoice (F7)">
                <mat-icon>verified</mat-icon>
                <div class="btn-label-stack">
                  <strong>Confirm Bill</strong>
                  <small>F7 Key</small>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </main>

      <!-- =================================================================== -->
      <!-- UNIFORM MODAL DIALOGS (Strictly Uniform Design System)               -->
      <!-- =================================================================== -->

      <!-- 1. CONFIRM & GENERATE / ALTERATION / PAY & PRINT MODAL -->
      @if (showConfirmModal()) {
        <div class="modal-backdrop" (click)="closeConfirmModal()">
          <div class="modal-card modal-md" (click)="$event.stopPropagation()">
            <!-- Uniform Header -->
            <div class="modal-head">
              <div class="modal-title-wrapper">
                <div class="modal-icon-badge" [class.badge-print]="pendingAction()?.print" [class.badge-alter]="isAlteringBill()">
                  <mat-icon>{{ isAlteringBill() ? 'edit_note' : pendingAction()?.print ? 'print' : 'verified' }}</mat-icon>
                </div>
                <div>
                  <h3>{{ isAlteringBill() ? 'Confirm Alteration of Bill' : pendingAction()?.print ? 'Confirm & Print Invoice' : 'Confirm & Generate Invoice' }}</h3>
                  <small>{{ isAlteringBill() ? 'Updating existing invoice #' + alteringInvoiceNumber() : 'Verify bill details before generating the final invoice' }}</small>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeConfirmModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Uniform Body -->
            <div class="modal-body">
              <div class="uniform-summary-grid">
                <div class="summary-tile">
                  <span class="tile-label">Customer</span>
                  <strong class="tile-val">{{ walkIn ? customerTerm : (selectedCustomer()?.name || 'Walk-in Customer') }}</strong>
                </div>

                <div class="summary-tile">
                  <span class="tile-label">Items / Units</span>
                  <strong class="tile-val">{{ lines().length }} items ({{ totalItemQuantity() }} units)</strong>
                </div>

                <div class="summary-tile">
                  <span class="tile-label">Payment Mode</span>
                  <strong class="tile-val">{{ paymentMode }}</strong>
                </div>

                <div class="summary-tile highlight-emerald">
                  <span class="tile-label">Grand Total</span>
                  <strong class="tile-val-hero">₹{{ currentGrandTotal() }}</strong>
                </div>
              </div>

              @if (paymentMode === 'Cash' && changeDue() > 0) {
                <div class="modal-highlight-box green-box">
                  <mat-icon>payments</mat-icon>
                  <div>
                    <span>Tendered: <strong>₹{{ amountTendered }}</strong></span>
                    <span class="sep-dot">·</span>
                    <span>Change Due: <strong>₹{{ changeDue().toFixed(2) }}</strong></span>
                  </div>
                </div>
              }

              @if (isAlteringBill()) {
                <div class="modal-highlight-box amber-box">
                  <mat-icon>warning_amber</mat-icon>
                  <div>
                    <strong>Alteration Notice:</strong> Bill #{{ alteringInvoiceNumber() }} will be updated. Previous stock deductions will be reconciled with the new quantities.
                  </div>
                </div>
              } @else {
                <div class="modal-highlight-box blue-box">
                  <mat-icon>info</mat-icon>
                  <div>
                    The invoice will be saved and inventory stock will be deducted once you confirm.
                  </div>
                </div>
              }
            </div>

            <!-- Uniform Footer -->
            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="closeConfirmModal()">
                <mat-icon>close</mat-icon>
                <span>Cancel (Esc)</span>
              </button>
              <button type="button" class="btn-modal-primary" (click)="executeConfirmedSave()" [disabled]="isSubmitting()">
                <mat-icon>{{ pendingAction()?.print ? 'print' : 'check_circle' }}</mat-icon>
                <span>{{ isAlteringBill() ? 'Yes, Save Changes (Enter)' : pendingAction()?.print ? 'Yes, Pay & Print (Enter)' : 'Yes, Generate Invoice (Enter)' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 2. HELD BILLS & DRAFTS DRAWER / MODAL -->
      @if (showDraftsDrawer()) {
        <div class="modal-backdrop" (click)="closeDraftsDrawer()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div class="modal-title-wrapper">
                <div class="modal-icon-badge badge-amber">
                  <mat-icon>inventory_2</mat-icon>
                </div>
                <div>
                  <h3>Held Bills & Drafts</h3>
                  <small>Recall a suspended bill onto the billing screen to resume checkout</small>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeDraftsDrawer()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body scrollable-body">
              @if (isLoadingDrafts()) {
                <div class="modal-empty-state">
                  <mat-icon class="spin-icon">sync</mat-icon>
                  <span>Loading held bills...</span>
                </div>
              } @else if (draftBills().length === 0) {
                <div class="modal-empty-state">
                  <mat-icon>drafts</mat-icon>
                  <strong>No Held or Draft Bills</strong>
                  <p>Bills held with <kbd>F5</kbd> will be saved here so you can serve other customers without losing progress.</p>
                </div>
              } @else {
                <div class="draft-cards-list">
                  @for (draft of draftBills(); track draft.id) {
                    <div class="draft-tile">
                      <div class="draft-tile-info">
                        <div class="draft-num-row">
                          <strong class="draft-bill-no">{{ draft.billNo }}</strong>
                          <span class="draft-date">{{ draft.date | date:'short' }}</span>
                        </div>
                        <div class="draft-cust-name">{{ draft.customer || 'Walk-in Customer' }}</div>
                        <div class="draft-submeta">
                          <span>{{ draft.itemsCount }} item(s)</span>
                          <span class="sep-dot">·</span>
                          <strong class="draft-total-text">₹{{ draft.total.toFixed(2) }}</strong>
                        </div>
                      </div>
                      <div class="draft-tile-actions">
                        <button type="button" class="btn-resume-draft" (click)="resumeDraft(draft.id)">
                          <mat-icon>play_arrow</mat-icon>
                          <span>Resume & Proceed</span>
                        </button>
                        <button type="button" class="btn-discard-draft" (click)="discardDraft(draft.id)">
                          <mat-icon>delete_outline</mat-icon>
                          <span>Discard</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="closeDraftsDrawer()">
                <mat-icon>close</mat-icon>
                <span>Close (Esc)</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 3. ADD NEW CUSTOMER MODAL -->
      @if (showAddCustomerModal()) {
        <div class="modal-backdrop" (click)="closeAddCustomerModal()">
          <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div class="modal-title-wrapper">
                <div class="modal-icon-badge badge-blue">
                  <mat-icon>person_add</mat-icon>
                </div>
                <div>
                  <h3>Add New Customer</h3>
                  <small>Register customer to track loyalty points and store credit</small>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeAddCustomerModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Customer Full Name *</mat-label>
                  <input matInput [(ngModel)]="newCustomer.name" placeholder="e.g. Ramesh Kumar" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Mobile Phone Number *</mat-label>
                  <input matInput [(ngModel)]="newCustomer.phone" placeholder="e.g. 9876543210" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email Address (Optional)</mat-label>
                  <input matInput type="email" [(ngModel)]="newCustomer.email" placeholder="e.g. customer@example.com" />
                </mat-form-field>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="closeAddCustomerModal()">
                <mat-icon>close</mat-icon>
                <span>Cancel (Esc)</span>
              </button>
              <button type="button" class="btn-modal-primary" (click)="saveNewCustomer()" [disabled]="!newCustomer.name || !newCustomer.phone">
                <mat-icon>check</mat-icon>
                <span>Save & Select (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 4. CUSTOM ITEM / SERVICE MODAL (F4) -->
      @if (showCustomItemModal()) {
        <div class="modal-backdrop" (click)="closeCustomItemModal()">
          <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div class="modal-title-wrapper">
                <div class="modal-icon-badge badge-purple">
                  <mat-icon>add_shopping_cart</mat-icon>
                </div>
                <div>
                  <h3>Add Custom Item / Service</h3>
                  <small>Add miscellaneous charge, alteration fee, or unlisted item</small>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeCustomItemModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Item / Service Description *</mat-label>
                  <input matInput [(ngModel)]="customItemForm.name" placeholder="e.g. Alteration Charge / Delivery" required />
                </mat-form-field>

                <div class="form-row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Unit Price (₹) *</mat-label>
                    <input matInput type="number" min="0" step="0.01" [(ngModel)]="customItemForm.sellingPrice" required />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Quantity</mat-label>
                    <input matInput type="number" min="1" step="1" [(ngModel)]="customItemForm.quantity" />
                  </mat-form-field>
                </div>

                <div class="form-row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Unit</mat-label>
                    <input matInput [(ngModel)]="customItemForm.unit" placeholder="pc, hr, job" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tax Rate (GST)</mat-label>
                    <mat-select [(ngModel)]="customItemForm.taxRate">
                      <mat-option [value]="0">0% (Exempt)</mat-option>
                      <mat-option [value]="5">5% GST</mat-option>
                      <mat-option [value]="12">12% GST</mat-option>
                      <mat-option [value]="18">18% GST</mat-option>
                      <mat-option [value]="28">28% GST</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="closeCustomItemModal()">
                <mat-icon>close</mat-icon>
                <span>Cancel (Esc)</span>
              </button>
              <button type="button" class="btn-modal-primary" (click)="submitCustomItem()" [disabled]="!customItemForm.name || customItemForm.sellingPrice <= 0">
                <mat-icon>add</mat-icon>
                <span>Add to Bill (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 5. DYNAMIC UPI QR MODAL -->
      @if (showUpiModal()) {
        <div class="modal-backdrop" (click)="closeUpiModal()">
          <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div class="modal-title-wrapper">
                <div class="modal-icon-badge badge-teal">
                  <mat-icon>qr_code_2</mat-icon>
                </div>
                <div>
                  <h3>Scan & Pay via UPI</h3>
                  <small>Customer can scan using any UPI App (GPay, PhonePe, Paytm)</small>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeUpiModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body text-center">
              <div class="upi-display-card">
                <div class="upi-amount-pill">
                  <span>Pay Exactly:</span>
                  <strong>₹{{ currentGrandTotal() }}</strong>
                </div>

                <div class="qr-code-wrapper">
                  <img [src]="getUpiQrUrl()" alt="UPI Payment QR Code" class="upi-qr-image" />
                </div>

                <div class="vpa-text">
                  <span>Merchant VPA:</span>
                  <strong>9000000000&#64;upi</strong>
                </div>

                <div class="supported-apps-row">
                  <span>Supported Apps: Google Pay · PhonePe · Paytm · BHIM</span>
                </div>
              </div>

              <div class="upi-ref-input-box">
                <mat-form-field appearance="outline" class="w-full compact-field">
                  <mat-label>UPI Reference # / UTR (Optional)</mat-label>
                  <input matInput [(ngModel)]="paymentReference" placeholder="Enter 12-digit UPI UTR after payment" />
                </mat-form-field>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="closeUpiModal()">
                <mat-icon>close</mat-icon>
                <span>Cancel (Esc)</span>
              </button>
              <button type="button" class="btn-modal-primary" (click)="confirmUpiPayment()">
                <mat-icon>check_circle</mat-icon>
                <span>Payment Received (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- STICKY MOBILE CHECKOUT DOCK (VISIBLE ON MOBILE/TABLET <= 860px) -->
      @if (lines().length > 0) {
        <aside class="mobile-sticky-checkout">
          <div class="m-checkout-info">
            <span class="m-total-label">TOTAL ({{ lines().length }} items, {{ totalItemQuantity() }} units)</span>
            <strong class="m-total-val">₹{{ currentGrandTotal() }}</strong>
          </div>
          <div class="m-checkout-actions">
            <button type="button" class="btn-m-pay" (click)="promptConfirm(true, true)" title="Pay and Print (F6)">
              <mat-icon>print</mat-icon>
              <span>Pay & Print</span>
            </button>
            <button type="button" class="btn-m-confirm" (click)="promptConfirm(true, false)" title="Confirm Bill (F7)">
              <mat-icon>verified</mat-icon>
              <span>Confirm</span>
            </button>
          </div>
        </aside>
      }
    </div>
  `,
  styles: [`
    /* ==========================================================================
       MODERN ERGONOMIC BILLING POS STYLES
       ========================================================================== */
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
      font-family: Inter, Roboto, "Segoe UI", system-ui, sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      --brand: #0f766e;
      --brand-hover: #0d9488;
      --brand-light: #f0fdfa;
      --brand-border: #99f6e4;
      --accent: #2563eb;
      --amber: #d97706;
      --red: #ef4444;
      --card-bg: #ffffff;
      --border-subtle: #e2e8f0;
      --border-focus: #cbd5e1;
    }

    .pos-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* TOP STATUS & SHORTCUT BAR */
    .pos-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      height: 48px;
      box-sizing: border-box;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .topbar-left, .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pos-brand-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--brand-light);
      border: 1px solid var(--brand-border);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      color: var(--brand);
    }
    .brand-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--brand);
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .pos-context-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      color: #64748b;
    }
    .pos-context-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }
    .pos-context-pill .sep {
      color: #cbd5e1;
    }

    .mode-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      animation: fadeIn 0.2s ease-in;
    }
    .alter-mode-pill {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #9a3412;
    }
    .draft-mode-pill {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }
    .status-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: #fef3c7;
      color: #92400e;
    }
    .status-tag.confirmed {
      background: #dcfce7;
      color: #166534;
    }
    .btn-pill-exit {
      background: transparent;
      border: 0;
      cursor: pointer;
      color: inherit;
      display: flex;
      align-items: center;
      padding: 0;
      margin-left: 2px;
    }
    .btn-pill-exit mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .topbar-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .topbar-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #64748b;
    }
    .topbar-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }
    .topbar-btn.active {
      background: var(--brand-light);
      border-color: var(--brand);
      color: var(--brand);
    }
    .topbar-btn.active mat-icon {
      color: var(--brand);
    }
    .counter-badge {
      background: #ea580c;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 999px;
    }
    .custom-item-btn {
      color: #7c3aed;
      border-color: #ddd6fe;
      background: #f5f3ff;
    }
    .custom-item-btn mat-icon {
      color: #7c3aed;
    }
    .custom-item-btn:hover {
      background: #ede9fe;
    }

    /* POS WORKSPACE 2-PANEL GRID */
    .pos-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 400px;
      gap: 12px;
      padding: 12px;
      height: calc(100vh - 48px);
      box-sizing: border-box;
      overflow: hidden;
    }

    /* LEFT PANEL: CART & SEARCH */
    .cart-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
      height: 100%;
      overflow: hidden;
    }

    /* SEARCH INPUT SECTION */
    .search-section {
      position: relative;
      flex-shrink: 0;
      z-index: 100;
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 2px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0 12px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .search-input-wrapper:focus-within {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
    }
    .search-icon {
      color: #94a3b8;
      font-size: 22px;
      width: 22px;
      height: 22px;
      margin-right: 8px;
    }
    .main-search-input {
      flex: 1;
      height: 44px;
      border: 0;
      outline: 0;
      font-size: 14px;
      font-weight: 500;
      color: #0f172a;
      background: transparent;
    }
    .main-search-input::placeholder {
      color: #94a3b8;
    }
    .btn-clear-search {
      background: transparent;
      border: 0;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 4px;
    }
    .btn-clear-search:hover {
      color: #475569;
    }
    .search-kbd-hint {
      margin-left: 6px;
    }
    kbd {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      border-radius: 5px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      font-family: inherit;
    }

    /* ANCHORED SEARCH TYPEAHEAD DROPLIST */
    .typeahead-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 16px 32px -4px rgba(15, 23, 42, 0.15), 0 4px 8px -2px rgba(15, 23, 42, 0.06);
      overflow: hidden;
      z-index: 1000;
      animation: modalPop 0.15s ease-out;
    }
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }
    .dropdown-header small {
      color: #94a3b8;
      font-weight: 500;
    }
    .dropdown-list {
      max-height: 320px;
      overflow-y: auto;
      padding: 4px;
    }
    .typeahead-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.12s ease;
      border-bottom: 1px solid #f8fafc;
    }
    .typeahead-item:hover {
      background: #f0fdfa;
    }
    .item-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .item-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .item-name {
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .item-sub-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #64748b;
    }
    .sku-tag {
      font-family: monospace;
      font-weight: 600;
      color: #334155;
    }
    .cat-tag {
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .rack-tag {
      color: #0284c7;
      font-weight: 600;
    }
    .item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .stock-indicator {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 1px 6px;
      border-radius: 999px;
    }
    .stock-indicator.low-stock {
      color: #dc2626;
      background: #fef2f2;
    }
    .price-stack {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .sell-price {
      font-size: 15px;
      color: var(--brand);
      font-weight: 700;
    }
    .mrp-strike {
      font-size: 11px;
      color: #94a3b8;
      text-decoration: line-through;
    }

    /* BADGES & DOTS */
    .diet-dot {
      width: 9px;
      height: 9px;
      border-radius: 2px;
      display: inline-block;
      flex-shrink: 0;
    }
    .diet-dot.veg {
      background: #16a34a;
      border: 1px solid #14532d;
    }
    .diet-dot.nonveg {
      background: #b91c1c;
      border: 1px solid #7f1d1d;
    }
    .diet-dot.vegan {
      font-size: 12px;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      line-height: 1.2;
    }
    .rx-badge {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .wty-badge {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    /* VISUAL CATALOG TRAY */
    .catalog-tray {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }
    .category-tabs {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .category-tab-btn {
      border: 1px solid var(--border-subtle);
      background: #f8fafc;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.12s ease;
    }
    .category-tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .category-tab-btn.active {
      background: var(--brand);
      color: #ffffff;
      border-color: var(--brand);
    }
    .catalog-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
      max-height: 190px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .catalog-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .catalog-card:hover {
      border-color: var(--brand);
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .card-category {
      color: #64748b;
      font-weight: 600;
    }
    .card-badges {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .card-stock {
      font-size: 9px;
      color: #059669;
      font-weight: 700;
    }
    .card-stock.low {
      color: #dc2626;
    }
    .card-title {
      font-size: 12px;
      color: #0f172a;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 30px;
    }
    .card-sku {
      font-size: 10px;
      color: #94a3b8;
    }
    .card-rack {
      font-size: 9px;
      color: #0284c7;
      font-weight: 600;
    }
    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .card-price-group {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .card-price {
      font-size: 13px;
      color: var(--brand);
      font-weight: 700;
    }
    .card-mrp {
      font-size: 10px;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .btn-card-add {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      border: 0;
      background: var(--brand-light);
      color: var(--brand);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .btn-card-add mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .catalog-card:hover .btn-card-add {
      background: var(--brand);
      color: #ffffff;
    }

    /* EXPIRY ALERT BANNER */
    .pos-alert-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 10px;
      flex-shrink: 0;
      animation: fadeIn 0.2s ease-in;
    }
    .expiry-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid var(--amber);
    }
    .alert-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .alert-icon {
      color: var(--amber);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .alert-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 12px;
    }
    .alert-text strong {
      color: #92400e;
    }
    .expiry-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .expiry-chip {
      background: #fef3c7;
      color: #b45309;
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .expiry-chip.danger {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
    }
    .btn-dismiss-alert {
      background: transparent;
      border: 0;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
    }
    .btn-dismiss-alert:hover {
      color: #475569;
    }

    /* BILL TABLE CONTAINER */
    .bill-table-wrapper {
      flex: 1;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }
    .table-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cart-icon {
      color: var(--brand);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .title-text {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .count-pill {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .units-pill {
      background: var(--brand-light);
      color: var(--brand);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .btn-empty-cart {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #ef4444;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .btn-empty-cart mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .btn-empty-cart:hover {
      background: #fee2e2;
    }

    /* TABLE HEADER GRID */
    .table-header-row {
      display: grid;
      grid-template-columns: minmax(170px, 2fr) 48px 108px 65px 78px 105px 48px 85px 44px;
      gap: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      flex-shrink: 0;
      align-items: center;
    }
    .col-qty { text-align: center; }
    .col-mrp, .col-rate, .col-total { text-align: right; }
    .col-tax { text-align: center; }
    .col-action { text-align: center; color: var(--red); }

    /* TABLE BODY */
    .table-body {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .table-row-card {
      display: grid;
      grid-template-columns: minmax(170px, 2fr) 48px 108px 65px 78px 105px 48px 85px 44px;
      gap: 8px;
      align-items: center;
      background: #ffffff;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      padding: 8px 10px;
      transition: all 0.15s ease;
    }
    .table-row-card:hover {
      border-color: #cbd5e1;
      background: #fafbfc;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .table-row-card:focus-within {
      border-color: var(--brand-border);
      background: #fdfeff;
    }

    .row-num {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      min-width: 16px;
    }
    .prod-name {
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
    }
    .item-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      flex-wrap: wrap;
    }
    .sku-text {
      font-family: monospace;
      color: #475569;
    }
    .batch-exp-pill {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .batch-exp-pill.soon {
      background: #fef3c7;
      color: #b45309;
    }
    .batch-exp-pill.expired {
      background: #fee2e2;
      color: #b91c1c;
    }

    .batch-selector-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 11px;
    }
    .batch-selector-row label {
      color: #64748b;
      font-weight: 600;
    }
    .batch-selector-row select {
      height: 24px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 11px;
      color: #1e293b;
      background: #ffffff;
      padding: 0 4px;
    }

    .unit-tag {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* QUANTITY STEPPER */
    .qty-stepper {
      display: flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      overflow: hidden;
      height: 32px;
    }
    .btn-step {
      width: 28px;
      height: 100%;
      border: 0;
      background: #f8fafc;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.12s ease;
      padding: 0;
    }
    .btn-step mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-step:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-step.minus:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .btn-step.plus:hover {
      background: #ecfdf5;
      color: #059669;
    }
    .stepper-input {
      flex: 1;
      width: 36px;
      height: 100%;
      border: 0;
      outline: 0;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      background: transparent;
      padding: 0;
    }

    .mrp-val {
      font-size: 12px;
      color: #94a3b8;
      text-decoration: line-through;
    }

    .cell-input {
      height: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      background: #ffffff;
      box-sizing: border-box;
      width: 100%;
      outline: none;
      transition: border-color 0.12s ease;
    }
    .cell-input:focus {
      border-color: var(--brand);
    }
    .rate-input {
      text-align: right;
    }

    .discount-input-group {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 3px;
    }
    .disc-type-sel {
      height: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      padding: 0 2px;
      outline: none;
    }
    .disc-input {
      text-align: right;
    }

    .tax-badge {
      font-size: 11px;
      font-weight: 600;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .line-total-val {
      font-size: 14px;
      font-weight: 800;
      color: var(--brand);
      text-align: right;
      display: block;
    }

    /* RED DELETE PILL BUTTON */
    .btn-del-row {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      margin: 0 auto;
    }
    .btn-del-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .btn-del-row:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
      transform: scale(1.08);
      box-shadow: 0 2px 5px rgba(239, 68, 68, 0.3);
    }

    /* EMPTY CART STATE */
    .empty-cart-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
    }
    .empty-icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 999px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .empty-icon-ring mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #94a3b8;
    }
    .empty-cart-state h3 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .empty-cart-state p {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #64748b;
    }
    .empty-shortcuts {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: #475569;
    }

    /* RIGHT PANEL: SETTLEMENT CARDS */
    .settlement-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      overflow-y: auto;
    }

    .settlement-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex-shrink: 0;
    }

    .card-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .heading-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .heading-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--brand);
    }
    .btn-add-cust-link, .btn-qr-modal-link {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: 0;
      font-size: 11px;
      font-weight: 600;
      color: var(--brand);
      cursor: pointer;
      padding: 0;
    }
    .btn-add-cust-link mat-icon, .btn-qr-modal-link mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    /* SEGMENTED CONTROL */
    .segmented-control {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;
    }
    .seg-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 0;
      background: transparent;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .seg-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .seg-btn.active {
      background: #ffffff;
      color: var(--brand);
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .compact-field {
      width: 100%;
      margin-bottom: -16px;
    }
    .compact-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding: 0 10px;
    }
    .compact-field ::ng-deep .mat-mdc-form-field-infix {
      padding-top: 8px;
      padding-bottom: 8px;
      min-height: 40px;
    }

    /* REGISTERED CUSTOMER PICKER */
    .cust-search-box {
      position: relative;
    }
    .customer-results-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      max-height: 140px;
      overflow-y: auto;
      z-index: 50;
      padding: 4px;
    }
    .cust-result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .cust-result-item:hover {
      background: #f0fdfa;
    }
    .cust-result-item strong {
      display: block;
      color: #0f172a;
    }
    .cust-result-item small {
      color: #64748b;
    }
    .pts-pill {
      background: #fef3c7;
      color: #b45309;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
    }

    .selected-customer-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
    }
    .cust-info strong {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .cust-info span {
      font-size: 11px;
      color: #64748b;
    }
    .cust-metrics {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .metric-loyalty {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
    }
    .metric-due {
      font-size: 11px;
      font-weight: 700;
      color: #dc2626;
    }

    /* TOTALS BREAKDOWN */
    .totals-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: #475569;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .discount-line {
      color: #059669;
      font-weight: 600;
    }
    .discount-inputs-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 6px 0;
      border-top: 1px dashed var(--border-subtle);
      border-bottom: 1px dashed var(--border-subtle);
    }
    .discount-inputs-row label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .disc-pair, .coupon-pair {
      display: flex;
      height: 32px;
    }
    .disc-pair select {
      border: 1px solid var(--border-subtle);
      border-right: 0;
      border-radius: 6px 0 0 6px;
      background: #f8fafc;
      font-size: 11px;
      padding: 0 4px;
      font-weight: 600;
    }
    .disc-pair input {
      flex: 1;
      width: 40px;
      border: 1px solid var(--border-subtle);
      border-radius: 0 6px 6px 0;
      font-size: 12px;
      font-weight: 600;
      padding: 0 6px;
      outline: none;
    }
    .coupon-pair input {
      flex: 1;
      width: 50px;
      border: 1px solid var(--border-subtle);
      border-right: 0;
      border-radius: 6px 0 0 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 0 6px;
      outline: none;
      text-transform: uppercase;
    }
    .btn-apply-coupon {
      border: 1px solid var(--border-subtle);
      border-radius: 0 6px 6px 0;
      background: #f1f5f9;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      padding: 0 8px;
      cursor: pointer;
    }
    .btn-apply-coupon:hover {
      background: #e2e8f0;
    }
    .coupon-alert-msg {
      font-size: 11px;
      font-weight: 600;
      color: #dc2626;
      background: #fef2f2;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .coupon-alert-msg.success {
      color: #059669;
      background: #ecfdf5;
    }
    .tax-detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    .tax-detail-row small {
      color: #94a3b8;
    }

    /* HERO GRAND TOTAL BANNER */
    .hero-total-banner {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
    }
    .total-label-group {
      display: flex;
      flex-direction: column;
    }
    .total-caption {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      opacity: 0.9;
    }
    .total-items-sub {
      font-size: 11px;
      opacity: 0.8;
    }
    .total-figure {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .curr-symbol {
      font-size: 18px;
      font-weight: 700;
      opacity: 0.9;
    }
    .total-digits {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    /* PAYMENT METHOD TABS */
    .payment-tabs-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
    }
    .pay-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      border: 1px solid var(--border-subtle);
      background: #f8fafc;
      border-radius: 8px;
      padding: 6px 2px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      transition: all 0.15s ease;
    }
    .pay-tab mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #64748b;
    }
    .pay-tab:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .pay-tab.selected {
      background: var(--brand-light);
      border-color: var(--brand);
      color: var(--brand);
      font-weight: 700;
    }
    .pay-tab.selected mat-icon {
      color: var(--brand);
    }

    /* CASH TENDER SECTION */
    .cash-tender-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cash-chips-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .cash-chip {
      flex: 1;
      min-width: 44px;
      height: 28px;
      border: 1px solid var(--border-subtle);
      background: #f8fafc;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      padding: 0;
      transition: all 0.12s ease;
    }
    .cash-chip:hover {
      background: #e2e8f0;
    }
    .chip-exact {
      background: var(--brand-light);
      border-color: var(--brand-border);
      color: var(--brand);
      font-weight: 700;
    }
    .tender-input-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .tender-input-row label {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .tender-input {
      width: 120px;
      height: 36px;
      border: 2px solid var(--border-subtle);
      border-radius: 8px;
      padding: 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
      outline: none;
      transition: border-color 0.12s ease;
    }
    .tender-input:focus {
      border-color: var(--brand);
    }

    /* CHANGE DUE BANNER */
    .change-due-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 8px 12px;
      animation: fadeIn 0.15s ease-in;
    }
    .change-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #065f46;
    }
    .change-left mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #059669;
    }
    .change-amount {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
    }

    /* CHECKOUT ACTIONS CARD */
    .checkout-actions-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex-shrink: 0;
    }
    .action-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .pos-act-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      border-radius: 10px;
      cursor: pointer;
      border: 0;
      transition: all 0.15s ease;
      padding: 0 10px;
    }
    .pos-act-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .btn-label-stack {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.1;
    }
    .btn-label-stack strong {
      font-size: 12px;
    }
    .btn-label-stack small {
      font-size: 10px;
      opacity: 0.8;
    }

    .btn-draft {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #c2410c;
    }
    .btn-draft:hover {
      background: #ffedd5;
    }

    .btn-clear {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }
    .btn-clear:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .btn-pay-print {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3);
    }
    .btn-pay-print:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(15, 118, 110, 0.4);
    }
    .btn-pay-print:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-confirm {
      background: #1e293b;
      color: #ffffff;
    }
    .btn-confirm:hover:not(:disabled) {
      background: #0f172a;
      transform: translateY(-1px);
    }
    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ==========================================================================
       UNIFORM MODAL DIALOG DESIGN SYSTEM
       ========================================================================== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      max-height: 90vh;
    }

    .modal-sm { width: 100%; max-width: 440px; }
    .modal-md { width: 100%; max-width: 540px; }
    .modal-lg { width: 100%; max-width: 640px; }

    /* Uniform Modal Header */
    .modal-head {
      padding: 16px 20px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-title-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--brand-light);
      color: var(--brand);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .modal-icon-badge mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .badge-amber { background: #fff7ed; color: #ea580c; }
    .badge-blue { background: #eff6ff; color: #2563eb; }
    .badge-purple { background: #f5f3ff; color: #7c3aed; }
    .badge-teal { background: #f0fdfa; color: #0f766e; }
    .badge-print { background: #ecfdf5; color: #059669; }
    .badge-alter { background: #fff7ed; color: #c2410c; }

    .modal-title-wrapper h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .modal-title-wrapper small {
      color: #64748b;
      font-size: 12px;
    }
    .modal-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 0;
      background: transparent;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .modal-close-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Uniform Modal Body */
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .scrollable-body {
      max-height: 440px;
    }

    /* Uniform Modal Summary Grid */
    .uniform-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .summary-tile {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .summary-tile.highlight-emerald {
      background: #f0fdfa;
      border-color: #99f6e4;
    }
    .tile-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .tile-val {
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .tile-val-hero {
      font-size: 20px;
      color: var(--brand);
      font-weight: 800;
    }

    .modal-highlight-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .modal-highlight-box mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .green-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .green-box mat-icon { color: #059669; }
    .amber-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
    }
    .amber-box mat-icon { color: #d97706; }
    .blue-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }
    .blue-box mat-icon { color: #2563eb; }

    /* Uniform Modal Footer */
    .modal-foot {
      padding: 14px 20px;
      background: #f8fafc;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
    }
    .btn-modal-cancel {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .btn-modal-cancel:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .btn-modal-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 8px;
      border: 0;
      background: var(--brand);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.25);
    }
    .btn-modal-primary:hover:not(:disabled) {
      background: var(--brand-hover);
      transform: translateY(-1px);
    }
    .btn-modal-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* HELD BILLS TILES */
    .draft-cards-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .draft-tile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 12px 14px;
      background: #ffffff;
      transition: all 0.15s ease;
    }
    .draft-tile:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
    .draft-tile-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .draft-num-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .draft-bill-no {
      font-size: 14px;
      color: var(--brand);
    }
    .draft-date {
      font-size: 11px;
      color: #94a3b8;
    }
    .draft-cust-name {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }
    .draft-submeta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }
    .draft-total-text {
      color: var(--brand);
    }
    .draft-tile-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-resume-draft {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--brand);
      color: #ffffff;
      border: 0;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-discard-draft {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #ef4444;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* MODAL FORM GRIDS */
    .modal-form-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* DYNAMIC UPI QR DISPLAY */
    .upi-display-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px dashed var(--brand);
      border-radius: 14px;
      padding: 16px;
    }
    .upi-amount-pill {
      display: flex;
      align-items: baseline;
      gap: 6px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 13px;
      color: #475569;
    }
    .upi-amount-pill strong {
      font-size: 18px;
      color: var(--brand);
    }
    .qr-code-wrapper {
      background: #ffffff;
      padding: 8px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .upi-qr-image {
      width: 140px;
      height: 140px;
      display: block;
    }
    .vpa-text {
      font-size: 12px;
      color: #475569;
    }
    .vpa-text strong {
      color: #0f172a;
    }
    .supported-apps-row {
      font-size: 11px;
      color: #94a3b8;
    }

    .modal-empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .modal-empty-state mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #cbd5e1;
    }

    /* KEYFRAMES */
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalPop {
      from { opacity: 0; transform: scale(0.96) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .spin-icon { animation: spin 1s linear infinite; }
    .sep-dot { margin: 0 4px; color: #cbd5e1; }
    .text-center { text-align: center; }

    /* MOBILE STICKY CHECKOUT BAR (DESKTOP HIDDEN) */
    .mobile-sticky-checkout {
      display: none;
    }

    /* RESPONSIVE LAYOUT */
    @media (max-width: 1100px) {
      .pos-workspace {
        grid-template-columns: 1fr;
        height: auto;
        overflow: visible;
      }
      .pos-container {
        height: auto;
        min-height: 100vh;
        overflow: visible;
      }
      :host {
        height: auto;
        overflow: visible;
      }
      .bill-table-wrapper {
        min-height: 320px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .table-row-card, .table-header-row {
        min-width: 680px;
      }
    }

    @media (max-width: 860px) {
      .pos-container {
        padding-bottom: 88px; /* clearance so sticky mobile dock doesn't obscure content */
      }
      .pos-topbar {
        height: auto;
        min-height: 48px;
        padding: 6px 10px;
        flex-wrap: wrap;
        gap: 8px;
      }
      .topbar-left {
        flex-wrap: wrap;
        gap: 6px;
      }
      .topbar-right {
        gap: 6px;
        flex-wrap: wrap;
      }
      .topbar-btn {
        padding: 6px 10px;
        font-size: 11px;
        min-height: 38px;
      }

      /* Sticky Mobile Checkout Bar Active */
      .mobile-sticky-checkout {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        border-top: 1px solid #cbd5e1;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
        padding: 10px 14px;
        padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
        z-index: 1000;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        animation: fadeIn 0.2s ease-out;
      }
      .m-checkout-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .m-total-label {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .m-total-val {
        font-size: 20px;
        font-weight: 800;
        color: var(--brand);
      }
      .m-checkout-actions {
        display: flex;
        gap: 8px;
      }
      .btn-m-pay, .btn-m-confirm {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: 0;
        min-height: 42px;
        transition: transform 0.1s ease, filter 0.15s ease;
      }
      .btn-m-pay {
        background: #0f766e;
        color: #ffffff;
      }
      .btn-m-pay:hover {
        background: #0d9488;
      }
      .btn-m-confirm {
        background: #047857;
        color: #ffffff;
      }
      .btn-m-confirm:hover {
        background: #059669;
      }

      /* Modals on Mobile & Tablets */
      .modal-card {
        width: min(94vw, 540px) !important;
        max-height: 92vh !important;
        margin: 10px auto;
      }
      .modal-body {
        padding: 14px;
        gap: 12px;
      }
      .modal-head {
        padding: 12px 14px;
      }
      .modal-foot {
        padding: 12px 14px;
        flex-wrap: wrap;
        gap: 8px;
      }
      .modal-foot button {
        flex: 1;
        min-height: 44px;
      }
      .drawer-card {
        width: min(94vw, 480px) !important;
      }
      .uniform-summary-grid {
        grid-template-columns: 1fr;
      }

      /* Payment Mode Tabs on Mobile */
      .payment-tabs-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      /* Pos Act Buttons on Mobile */
      .pos-action-buttons {
        grid-template-columns: 1fr 1fr;
      }
      .btn-pay-print, .btn-confirm {
        min-height: 48px;
      }
    }

    @media (max-width: 580px) {
      .pos-brand-pill .brand-title {
        display: none;
      }
      .pos-context-pill {
        display: none;
      }
      .topbar-btn span {
        display: none;
      }
      .topbar-btn {
        padding: 6px;
        min-width: 38px;
        justify-content: center;
      }
      .search-section {
        padding: 8px 10px;
      }
      .main-search-input {
        font-size: 14px;
      }
      .search-kbd-hint {
        display: none;
      }
      .cart-panel {
        padding: 6px;
      }
      .settlement-panel {
        padding: 6px;
      }
      .payment-tabs-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .cash-chips-row {
        flex-wrap: wrap;
      }
      .cash-chip {
        padding: 6px 10px;
      }
      .btn-m-pay span, .btn-m-confirm span {
        font-size: 12px;
      }
      .btn-m-pay, .btn-m-confirm {
        padding: 8px 10px;
      }
    }
  `]
})
export class BillingNewComponent implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('productSearch') productSearch?: ElementRef<HTMLInputElement>;

  readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly cashierName = computed(() => this.auth.user()?.fullName || 'Chandan Mandal');

  readonly lines = signal<BillLine[]>([]);
  readonly productMatches = signal<ProductSearchResultDto[]>([]);
  readonly customerMatches = signal<CustomerSearchResultDto[]>([]);
  readonly selectedCustomer = signal<CustomerSearchResultDto | null>(null);
  readonly quote = signal<BillQuoteDto | null>(null);
  readonly barcodeMode = signal(false);
  readonly catalogView = signal(false);
  readonly couponMessage = signal('');
  readonly expiryAlertDismissed = signal(false);

  // Alteration & Draft Resumption state
  readonly isAlteringBill = signal(false);
  readonly alteringInvoiceId = signal<string | null>(null);
  readonly alteringInvoiceNumber = signal('');
  readonly alteringInvoiceStatus = signal('');
  readonly resumedDraftId = signal<string | null>(null);

  // UNIFORM MODAL SIGNALS
  readonly showConfirmModal = signal(false);
  readonly showDraftsDrawer = signal(false);
  readonly showAddCustomerModal = signal(false);
  readonly showCustomItemModal = signal(false);
  readonly showUpiModal = signal(false);

  readonly pendingAction = signal<{ confirm: boolean; print: boolean } | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingDrafts = signal(false);
  readonly draftBills = signal<BillHistoryRowDto[]>([]);
  readonly draftsCount = signal(0);

  // Form Models
  productTerm = '';
  customerTerm = 'Walk-in Customer';
  walkIn = true;

  newCustomer = { name: '', phone: '', email: '' };
  customItemForm = {
    name: 'Custom Service / Item',
    sellingPrice: 100,
    quantity: 1,
    unit: 'pc',
    taxRate: 0
  };

  billDiscountType: DiscountValueType | null = null;
  billDiscountValue = 0;
  couponCode = '';

  paymentMode: PaymentMethod = 'Cash';
  paymentReference = '';
  amountTendered = 0;

  private barcodeBuffer = '';
  private lastKeyTime = 0;

  readonly categories = ['All', 'Groceries', 'Electronics', 'Pharmacy', 'Fashion', 'Home & Kitchen', 'General'];
  readonly selectedCategory = signal('All');

  readonly demoCatalog: ProductSearchResultDto[] = [
    { productId: '70000000-0000-0000-0000-000000000001', productVariantId: null, sku: 'MED-PAR-500', barcode: '8901234567890', name: 'Paracetamol 500mg', category: 'Pharmacy', unit: 'pack', stockQuantity: 25, mrp: 20, sellingPrice: 12, taxRate: 12, hsnSacCode: '3004', maxDiscountPercent: 10, requiresBatchSelection: false, batches: [], categoryType: 'Pharmacy', requiresPrescription: true, rackLocation: 'Aisle 1 / Shelf A' },
    { productId: '70000000-0000-0000-0000-000000000002', productVariantId: null, sku: 'MED-VIT-C', barcode: '8901234567891', name: 'Vitamin C Tablets', category: 'Pharmacy', unit: 'pack', stockQuantity: 12, mrp: 140, sellingPrice: 110, taxRate: 12, hsnSacCode: '3004', maxDiscountPercent: 15, requiresBatchSelection: false, batches: [], categoryType: 'Pharmacy', rackLocation: 'Aisle 1 / Shelf B' },
    { productId: '70000000-0000-0000-0000-000000000004', productVariantId: null, sku: 'GRO-RICE', barcode: '8901234567893', name: 'Basmati Rice Premium 5kg', category: 'Groceries', unit: 'bag', stockQuantity: 50, mrp: 450, sellingPrice: 399, taxRate: 5, hsnSacCode: '1006', maxDiscountPercent: 5, requiresBatchSelection: false, batches: [], categoryType: 'Groceries', foodType: 'Veg', packageSize: '5 kg', rackLocation: 'Aisle 3 / Pallet 1' },
    { productId: '70000000-0000-0000-0000-000000000005', productVariantId: null, sku: 'GRO-SUGAR', barcode: '8901234567894', name: 'Refined Pure Sugar 1kg', category: 'Groceries', unit: 'kg', stockQuantity: 80, mrp: 55, sellingPrice: 48, taxRate: 5, hsnSacCode: '1701', maxDiscountPercent: 5, requiresBatchSelection: false, batches: [], categoryType: 'Groceries', foodType: 'Veg', packageSize: '1 kg', rackLocation: 'Aisle 3 / Shelf 2' },
    { productId: '70000000-0000-0000-0000-000000000006', productVariantId: null, sku: 'ELE-CABLE-C', barcode: '8901234567895', name: 'Braided Type-C Fast Cable 65W', category: 'Electronics', unit: 'pc', stockQuantity: 30, mrp: 499, sellingPrice: 299, taxRate: 18, hsnSacCode: '8544', maxDiscountPercent: 15, requiresBatchSelection: false, batches: [], categoryType: 'Electronics', warrantyMonths: 12, rackLocation: 'Rack E / Bin 4' },
    { productId: '70000000-0000-0000-0000-000000000007', productVariantId: null, sku: 'FAS-TSHIRT', barcode: '8901234567896', name: 'Cotton Classic Crew T-Shirt', category: 'Fashion', unit: 'pc', stockQuantity: 20, mrp: 699, sellingPrice: 499, taxRate: 5, hsnSacCode: '6109', maxDiscountPercent: 20, requiresBatchSelection: false, batches: [], categoryType: 'Fashion', rackLocation: 'Apparel Stand 2' }
  ];

  readonly localSubtotal = computed(() => this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  readonly currentGrandTotal = computed(() => (this.quote()?.totals?.grandTotal ?? this.localSubtotal()).toFixed(2));
  readonly changeDue = computed(() => Math.max(0, this.amountTendered - (this.quote()?.totals.grandTotal ?? this.localSubtotal())));
  readonly totalItemQuantity = computed(() => this.lines().reduce((sum, line) => sum + (Number(line.quantity) || 0), 0));

  readonly filteredCatalog = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'All' ? this.demoCatalog : this.demoCatalog.filter(p => p.category.toLowerCase() === cat.toLowerCase());
  });

  readonly expiringItemsWarning = computed(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const list: { key: string; productName: string; batchName: string; expiryDate: string; daysLeft: number; isExpired: boolean; statusText: string }[] = [];

    for (const line of this.lines()) {
      if (line.batch?.expiryDate) {
        const expTime = new Date(line.batch.expiryDate).getTime();
        const diffMs = expTime - now;
        const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        if (diffMs <= thirtyDaysMs) {
          const isExpired = daysLeft <= 0;
          list.push({
            key: line.key,
            productName: line.product.name,
            batchName: line.batch.batchName || 'Batch',
            expiryDate: line.batch.expiryDate.slice(0, 10),
            daysLeft,
            isExpired,
            statusText: isExpired ? `Expired (${Math.abs(daysLeft)}d ago)` : `Expires in ${daysLeft}d`
          });
        }
      }
    }
    return list;
  });

  ngOnInit(): void {
    this.loadDraftsCount();

    this.route.queryParams.subscribe(params => {
      const alterId = params['alterInvoiceId'];
      if (alterId) {
        this.loadInvoiceForAlteration(alterId);
      }
      const draftId = params['draftId'];
      if (draftId) {
        this.resumeDraft(draftId);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    // 1. Trap keys if any uniform modal is currently open
    if (this.showConfirmModal()) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.executeConfirmedSave();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeConfirmModal();
      }
      return;
    }

    if (this.showDraftsDrawer()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeDraftsDrawer();
      }
      return;
    }

    if (this.showAddCustomerModal()) {
      if (event.key === 'Enter' && this.newCustomer.name && this.newCustomer.phone) {
        event.preventDefault();
        this.saveNewCustomer();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeAddCustomerModal();
      }
      return;
    }

    if (this.showCustomItemModal()) {
      if (event.key === 'Enter' && this.customItemForm.name && this.customItemForm.sellingPrice > 0) {
        event.preventDefault();
        this.submitCustomItem();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeCustomItemModal();
      }
      return;
    }

    if (this.showUpiModal()) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.confirmUpiPayment();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeUpiModal();
      }
      return;
    }

    // 2. Main POS keyboard shortcuts
    if (event.key === 'F2') { event.preventDefault(); this.productSearch?.nativeElement.focus(); }
    if (event.key === 'F3') { event.preventDefault(); this.toggleBarcodeMode(); }
    if (event.key === 'F4') { event.preventDefault(); this.openCustomItemModal(); }
    if (event.key === 'F5') { event.preventDefault(); this.saveDraft(); }
    if (event.key === 'F6') { event.preventDefault(); this.promptConfirm(true, true); }
    if (event.key === 'F7') { event.preventDefault(); this.promptConfirm(true, false); }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.productMatches().length > 0) {
        this.productMatches.set([]);
      } else if (this.productTerm) {
        this.productTerm = '';
      } else {
        this.cancel();
      }
    }

    this.captureBarcode(event);
  }

  toggleBarcodeMode(): void {
    this.barcodeMode.set(!this.barcodeMode());
    this.productSearch?.nativeElement.focus();
    this.playChime(600, 'sine', 0.08);
  }

  filterCatalog(cat: string): void {
    this.selectedCategory.set(cat);
  }

  searchProducts(): void {
    const term = this.productTerm.trim();
    if (term.length < 2) {
      this.productMatches.set([]);
      return;
    }
    this.billing.searchProducts(this.shopId(), term).subscribe({
      next: (products) => this.productMatches.set(products),
      error: () => {
        const m = this.demoCatalog.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) || p.sku.toLowerCase().includes(term.toLowerCase()));
        this.productMatches.set(m);
      }
    });
  }

  addFirstProduct(): void {
    const product = this.productMatches()[0];
    if (product) this.addProduct(product);
  }

  addProduct(product: ProductSearchResultDto): void {
    this.playChime(880, 'sine', 0.1);
    this.lines.update(lines => {
      const existing = lines.find(l => l.product.productId === product.productId && l.batch?.productVariantId === (product.batches[0]?.productVariantId ?? null));
      if (existing) {
        return lines.map(l => l.key === existing.key ? { ...l, quantity: +(l.quantity + 1).toFixed(2) } : l);
      }
      return [...lines, {
        key: crypto.randomUUID(),
        product,
        batch: product.requiresBatchSelection ? product.batches[0] ?? null : null,
        quantity: 1,
        unitPrice: product.requiresBatchSelection && product.batches[0] ? product.batches[0].sellingPrice : product.sellingPrice,
        discountType: 'Percentage',
        discountValue: 0
      }];
    });
    this.productTerm = '';
    this.productMatches.set([]);
    this.recalculate();
  }

  incrementQty(line: BillLine): void {
    line.quantity = +(Number(line.quantity || 0) + 1).toFixed(2);
    this.lineChanged();
  }

  decrementQty(line: BillLine): void {
    const current = Number(line.quantity || 0);
    if (current > 1) {
      line.quantity = +(current - 1).toFixed(2);
      this.lineChanged();
    } else {
      this.deleteLine(line.key);
    }
  }

  selectBatch(key: string, batchId: string): void {
    this.lines.update(lines => lines.map(line => {
      if (line.key !== key) return line;
      const batch = line.product.batches.find(x => x.productVariantId === batchId) ?? null;
      return { ...line, batch, unitPrice: batch?.sellingPrice ?? line.unitPrice };
    }));
    this.recalculate();
  }

  deleteLine(key: string): void {
    this.playChime(400, 'triangle', 0.08);
    this.lines.update(lines => lines.filter(line => line.key !== key));
    this.recalculate();
  }

  clearAllLines(): void {
    if (this.lines().length === 0) return;
    this.playChime(350, 'sawtooth', 0.1);
    this.lines.set([]);
    this.recalculate();
  }

  lineChanged(): void {
    this.lines.update(lines => [...lines]);
    this.recalculate();
  }

  lineTotal(line: BillLine): number {
    const gross = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
    const discount = line.discountType === 'Percentage' ? gross * (Number(line.discountValue) || 0) / 100 : (Number(line.discountValue) || 0);
    const taxRate = line.product.taxRate || 0;
    return Math.round((gross - discount) * (1 + taxRate / 100));
  }

  // --- Customer Handling ---
  setWalkInMode(isWalkIn: boolean): void {
    this.walkIn = isWalkIn;
    if (isWalkIn) {
      this.selectedCustomer.set(null);
      this.customerTerm = 'Walk-in Customer';
    } else {
      this.customerTerm = '';
    }
    this.recalculate();
  }

  searchCustomers(): void {
    const term = this.customerTerm.trim();
    if (term.length < 2) { this.customerMatches.set([]); return; }
    this.billing.searchCustomers(this.shopId(), term).subscribe(customers => this.customerMatches.set(customers));
  }

  selectCustomer(customer: CustomerSearchResultDto): void {
    this.selectedCustomer.set(customer);
    this.customerTerm = customer.name;
    this.walkIn = false;
    this.customerMatches.set([]);
    this.recalculate();
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerTerm = '';
    this.recalculate();
  }

  openAddCustomerModal(): void {
    this.newCustomer = { name: '', phone: '', email: '' };
    this.showAddCustomerModal.set(true);
  }

  closeAddCustomerModal(): void {
    this.showAddCustomerModal.set(false);
  }

  saveNewCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.phone) return;
    this.billing.addCustomer(this.shopId(), this.newCustomer.name, this.newCustomer.phone, this.newCustomer.email).subscribe(customer => {
      this.selectCustomer(customer);
      this.closeAddCustomerModal();
      this.playChime(880, 'sine', 0.12);
    });
  }

  // --- Custom Item / Service Modal ---
  openCustomItemModal(): void {
    this.customItemForm = {
      name: 'Custom Service / Item',
      sellingPrice: 100,
      quantity: 1,
      unit: 'pc',
      taxRate: 0
    };
    this.showCustomItemModal.set(true);
  }

  closeCustomItemModal(): void {
    this.showCustomItemModal.set(false);
  }

  submitCustomItem(): void {
    if (!this.customItemForm.name || this.customItemForm.sellingPrice <= 0) return;
    this.playChime(750, 'triangle', 0.12);
    this.addProduct({
      productId: crypto.randomUUID(),
      sku: `CUST-${this.lines().length + 1}`,
      name: this.customItemForm.name,
      category: 'General',
      unit: this.customItemForm.unit || 'pc',
      stockQuantity: 999,
      mrp: this.customItemForm.sellingPrice,
      sellingPrice: this.customItemForm.sellingPrice,
      taxRate: this.customItemForm.taxRate,
      maxDiscountPercent: 100,
      requiresBatchSelection: false,
      batches: []
    });
    this.closeCustomItemModal();
  }

  // --- Discounts & Coupons ---
  applyCoupon(): void {
    if (!this.couponCode.trim()) return;
    this.billing.validateCoupon(this.shopId(), this.couponCode.trim().toUpperCase(), this.quote()?.totals.taxableAmount ?? this.localSubtotal()).subscribe(result => {
      this.couponMessage.set(result.isValid ? `Coupon applied: ₹${result.discountAmount}` : result.message ?? 'Coupon not valid');
      if (result.isValid) {
        this.playChime(950, 'sine', 0.15);
        this.recalculate();
      } else {
        this.playChime(250, 'sawtooth', 0.2);
      }
    });
  }

  recalculate(): void {
    if (!this.lines().length) { this.quote.set(null); return; }
    this.billing.quote({
      shopId: this.shopId(),
      customerId: this.walkIn ? null : this.selectedCustomer()?.id,
      items: this.payloadItems(),
      billDiscountType: this.billDiscountType,
      billDiscountValue: this.billDiscountValue || 0,
      couponCode: this.couponCode || null,
      isInterstate: false
    }).subscribe(quote => this.quote.set(quote));
  }

  // --- Payment Methods & Quick Cash ---
  selectPaymentMode(mode: PaymentMethod): void {
    this.paymentMode = mode;
    if (mode === 'Cash') {
      this.setExactCash();
    } else if (mode === 'UPI') {
      this.openUpiModal();
    }
  }

  setExactCash(): void {
    this.amountTendered = Math.round(this.quote()?.totals?.grandTotal ?? this.localSubtotal());
  }

  addCash(amt: number): void {
    this.amountTendered = (this.amountTendered || 0) + amt;
  }

  setDenomination(denom: number): void {
    this.amountTendered = denom;
  }

  // --- Dynamic UPI QR Modal ---
  openUpiModal(): void {
    this.showUpiModal.set(true);
  }

  closeUpiModal(): void {
    this.showUpiModal.set(false);
  }

  confirmUpiPayment(): void {
    this.closeUpiModal();
    this.playChime(880, 'sine', 0.12);
  }

  getUpiQrUrl(): string {
    const total = this.currentGrandTotal();
    const upiUri = `upi://pay?pa=9000000000@upi&pn=BillEase%20Demo%20Store&am=${total}&tn=BillEase%20POS&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUri)}`;
  }

  // --- Confirmation Safeguard for F6 & F7 ---
  promptConfirm(confirm: boolean, print = false): void {
    if (!this.lines().length) {
      this.productSearch?.nativeElement.focus();
      return;
    }
    this.pendingAction.set({ confirm, print });
    this.showConfirmModal.set(true);
    this.playChime(660, 'sine', 0.1);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.pendingAction.set(null);
  }

  executeConfirmedSave(): void {
    const action = this.pendingAction();
    if (!action) return;
    this.closeConfirmModal();
    this.performSave(action.confirm, action.print);
  }

  saveDraft(): void {
    if (!this.lines().length) return;
    this.performSave(false, false);
  }

  private performSave(confirm: boolean, print = false): void {
    const total = this.quote()?.totals.grandTotal ?? this.localSubtotal();
    const paymentAmount = this.paymentMode === 'Credit' ? 0 : this.amountTendered || total;

    this.isSubmitting.set(true);
    this.playChime(1046.5, 'sine', 0.2);

    const payload = {
      shopId: this.shopId(),
      customerId: this.walkIn ? null : this.selectedCustomer()?.id,
      walkInCustomerName: this.walkIn ? this.customerTerm : null,
      items: this.payloadItems(),
      billDiscountType: this.billDiscountType,
      billDiscountValue: this.billDiscountValue || 0,
      couponCode: this.couponCode || null,
      payments: [{ method: this.paymentMode, amount: paymentAmount, referenceNumber: this.paymentReference || null, details: null }],
      confirm,
      notes: null
    };

    // Case 1: Altering an existing generated invoice
    if (this.isAlteringBill() && this.alteringInvoiceId()) {
      this.billing.alterSale(this.alteringInvoiceId()!, payload).subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          if (print) this.print(result, '80');
          this.exitAlterMode();
          this.router.navigate(['/billing', result.invoice.id]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to alter invoice: ' + (err?.error?.message || err?.message || 'Unknown error'));
        }
      });
      return;
    }

    // Case 2: Resumed a draft and confirming/updating it
    if (this.resumedDraftId()) {
      this.billing.alterSale(this.resumedDraftId()!, payload).subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          if (print) this.print(result, '80');
          this.resumedDraftId.set(null);
          this.cancel();
          this.loadDraftsCount();
          if (confirm) {
            this.router.navigate(['/billing', result.invoice.id]);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to save draft invoice: ' + (err?.error?.message || err?.message || 'Unknown error'));
        }
      });
      return;
    }

    // Case 3: Creating a brand new sale
    this.billing.createSale(payload).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        if (print) this.print(result, '80');
        this.cancel();
        this.loadDraftsCount();
      },
      error: () => {
        this.isSubmitting.set(false);
        if (print) {
          const w = window.open('', '_blank', 'width=800,height=600');
          w?.document.write(`<html><body><h2>BillEase Store</h2><p>Invoice Created</p><p>Total: ₹${total}</p></body></html>`);
          w?.document.close();
          w?.print();
        }
        this.cancel();
        this.loadDraftsCount();
      }
    });
  }

  // --- Held Bills / Drafts Drawer Operations ---
  openDraftsDrawer(): void {
    this.showDraftsDrawer.set(true);
    this.loadDrafts();
  }

  closeDraftsDrawer(): void {
    this.showDraftsDrawer.set(false);
  }

  loadDrafts(): void {
    this.isLoadingDrafts.set(true);
    this.billing.getDrafts(this.shopId()).subscribe({
      next: (drafts) => {
        this.draftBills.set(drafts);
        this.draftsCount.set(drafts.length);
        this.isLoadingDrafts.set(false);
      },
      error: () => {
        this.draftBills.set([]);
        this.isLoadingDrafts.set(false);
      }
    });
  }

  loadDraftsCount(): void {
    this.billing.getDrafts(this.shopId()).subscribe({
      next: (drafts) => this.draftsCount.set(drafts.length),
      error: () => {}
    });
  }

  resumeDraft(draftId: string): void {
    this.closeDraftsDrawer();
    this.billing.getSaleInvoice(draftId).subscribe({
      next: (data) => {
        this.resumedDraftId.set(draftId);
        this.isAlteringBill.set(false);
        this.populateInvoiceData(data);
        this.playChime(880, 'sine', 0.15);
      },
      error: (err) => {
        console.error('Failed to load draft bill', err);
      }
    });
  }

  discardDraft(draftId: string): void {
    if (!confirm('Are you sure you want to discard this held draft bill?')) return;
    this.billing.deleteDraft(draftId).subscribe({
      next: () => {
        if (this.resumedDraftId() === draftId) {
          this.resumedDraftId.set(null);
          this.cancel();
        }
        this.loadDrafts();
        this.loadDraftsCount();
      },
      error: (err) => {
        alert('Could not discard draft: ' + (err?.error?.message || err?.message || 'Error'));
      }
    });
  }

  exitDraftMode(): void {
    this.resumedDraftId.set(null);
    this.cancel();
  }

  // --- Bill Alteration Operations ---
  loadInvoiceForAlteration(invoiceId: string): void {
    this.billing.getSaleInvoice(invoiceId).subscribe({
      next: (data) => {
        this.isAlteringBill.set(true);
        this.alteringInvoiceId.set(invoiceId);
        this.alteringInvoiceNumber.set(data.invoiceNumber);
        this.alteringInvoiceStatus.set(data.status);
        this.resumedDraftId.set(null);
        this.populateInvoiceData(data);
      },
      error: (err) => {
        alert('Could not load bill for alteration: ' + (err?.error?.message || err?.message || 'Not found'));
      }
    });
  }

  exitAlterMode(): void {
    this.isAlteringBill.set(false);
    this.alteringInvoiceId.set(null);
    this.alteringInvoiceNumber.set('');
    this.alteringInvoiceStatus.set('');
    this.cancel();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private populateInvoiceData(data: SaleInvoiceForEditDto): void {
    const lines: BillLine[] = data.items.map(item => ({
      key: crypto.randomUUID(),
      product: {
        productId: item.productId,
        productVariantId: item.productVariantId ?? null,
        sku: item.sku,
        barcode: item.barcode ?? null,
        name: item.name,
        category: item.category,
        unit: item.unit,
        stockQuantity: item.stockQuantity,
        mrp: item.mrp,
        sellingPrice: item.unitPrice,
        taxRate: item.taxRate,
        hsnSacCode: item.hsnSacCode ?? null,
        maxDiscountPercent: 100,
        requiresBatchSelection: !!item.productVariantId,
        batches: item.productVariantId ? [{
          productVariantId: item.productVariantId,
          batchName: item.batchNumber ?? 'Batch',
          sellingPrice: item.unitPrice,
          mrp: item.mrp,
          expiryDate: item.expiryDate ?? null,
          stockQuantity: item.stockQuantity
        }] : [],
        categoryType: item.categoryType,
        rackLocation: item.rackLocation,
        foodType: item.foodType,
        requiresPrescription: item.requiresPrescription,
        warrantyMonths: item.warrantyMonths,
        packageSize: item.packageSize
      },
      batch: item.productVariantId ? {
        productVariantId: item.productVariantId,
        batchName: item.batchNumber ?? 'Batch',
        sellingPrice: item.unitPrice,
        mrp: item.mrp,
        expiryDate: item.expiryDate ?? null,
        stockQuantity: item.stockQuantity
      } : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountType: item.discountType ?? 'Percentage',
      discountValue: item.discountValue
    }));

    this.lines.set(lines);

    if (data.customerId) {
      this.walkIn = false;
      this.selectedCustomer.set({
        id: data.customerId,
        name: data.customerName ?? '',
        phone: data.customerPhone ?? '',
        email: null,
        creditLimit: 0,
        outstandingBalance: 0,
        loyaltyPoints: 0
      });
      this.customerTerm = data.customerName ?? '';
    } else {
      this.walkIn = true;
      this.selectedCustomer.set(null);
      this.customerTerm = data.walkInCustomerName || 'Walk-in Customer';
    }

    this.billDiscountType = data.billDiscountType ?? null;
    this.billDiscountValue = data.billDiscountValue;
    this.couponCode = data.couponCode ?? '';

    if (data.paymentMethod) {
      this.paymentMode = data.paymentMethod;
      this.paymentReference = data.paymentReference ?? '';
      this.amountTendered = data.amountTendered;
    }

    this.recalculate();
  }

  print(result: SaleInvoiceDetailDto, mode: 'a4' | '80' | '58'): void {
    this.billing.printInvoice(result.invoice.id).subscribe(print => {
      const html = mode === 'a4' ? print.a4Html : mode === '80' ? print.thermal80Html : print.thermal58Html;
      const popup = window.open('', '_blank', 'width=900,height=700');
      popup?.document.write(html);
      popup?.document.close();
      popup?.print();
    });
  }

  cancel(): void {
    this.lines.set([]);
    this.quote.set(null);
    this.productTerm = '';
    this.couponCode = '';
    this.couponMessage.set('');
    this.amountTendered = 0;
    this.paymentReference = '';
    this.showUpiModal.set(false);
  }

  isExpired(expiryDate?: string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() <= Date.now();
  }

  isExpiringSoon(expiryDate?: string | null): boolean {
    if (!expiryDate) return false;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }

  getExpiryStatusText(expiryDate?: string | null): string {
    if (!expiryDate) return '';
    const diff = new Date(expiryDate).getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days <= 0) return `Expired ${Math.abs(days)}d ago`;
    if (days <= 30) return `Exp in ${days}d`;
    return `Exp: ${expiryDate.slice(0, 7)}`;
  }

  private payloadItems() {
    return this.lines().map(line => ({
      productId: line.product.productId,
      productVariantId: line.batch?.productVariantId ?? line.product.productVariantId ?? null,
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      discountType: line.discountValue > 0 ? line.discountType : null,
      discountValue: Number(line.discountValue) || 0,
      taxRate: line.product.taxRate
    }));
  }

  private captureBarcode(event: KeyboardEvent): void {
    if (!this.barcodeMode() || (event.key.length !== 1 && event.key !== 'Enter')) return;
    const now = Date.now();
    if (now - this.lastKeyTime > 80) this.barcodeBuffer = '';
    this.lastKeyTime = now;
    if (event.key === 'Enter') {
      const code = this.barcodeBuffer;
      this.barcodeBuffer = '';
      if (code.length >= 4) {
        this.productTerm = code;
        this.searchProducts();
        setTimeout(() => this.addFirstProduct(), 180);
      }
      return;
    }
    this.barcodeBuffer += event.key;
  }

  private playChime(freq = 800, type: OscillatorType = 'sine', duration = 0.1): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }
}
