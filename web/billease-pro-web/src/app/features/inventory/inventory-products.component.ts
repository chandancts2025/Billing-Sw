import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { InventoryLookupDto, InventoryProductListItemDto, SaveProductRequest, SaveProductVariantRequest } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory-products',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="products-page">
      <header class="page-head">
        <div><strong>Products</strong><span>Manage SKUs, pricing, taxes, variants, pharmacy, restaurant, and media fields.</span></div>
        <button mat-flat-button color="primary" type="button" (click)="newProduct()"><mat-icon>add</mat-icon>New Product</button>
      </header>

      <section class="content">
        <aside class="list">
          <mat-form-field appearance="outline">
            <mat-label>Search product, code, barcode</mat-label>
            <input matInput [(ngModel)]="search" (ngModelChange)="loadProducts()" autocomplete="off">
          </mat-form-field>
          @for (product of products(); track product.id) {
            <button type="button" [class.active]="form.id === product.id" (click)="edit(product)">
              <strong>{{ product.name }}</strong>
              <span>{{ product.sku }} | {{ product.stock }} {{ product.unit }} | Rs. {{ product.sellingPrice }}</span>
            </button>
          }
        </aside>

        <form class="form" (ngSubmit)="save()">
          <h3>Basic</h3>
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput required [(ngModel)]="form.name" name="name"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="form.sku" name="sku" placeholder="Auto if blank"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Barcode</mat-label><input matInput [(ngModel)]="form.barcode" name="barcode"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select required [(ngModel)]="form.categoryId" name="categoryId">@for (c of lookup()?.categories ?? []; track c.id) { <mat-option [value]="c.id">{{ c.name }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Sub-category</mat-label><input matInput [(ngModel)]="form.subCategory" name="subCategory"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Brand</mat-label><input matInput [(ngModel)]="form.brand" name="brand"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>HSN/SAC</mat-label><input matInput [(ngModel)]="form.hsnSacCode" name="hsnSacCode"></mat-form-field>
          </div>

          <h3>Pricing & Tax</h3>
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Purchase Price</mat-label><input matInput type="number" [(ngModel)]="form.costPrice" name="costPrice"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Selling Price</mat-label><input matInput type="number" [(ngModel)]="form.sellingPrice" name="sellingPrice"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>MRP</mat-label><input matInput type="number" [(ngModel)]="form.mrp" name="mrp"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Wholesale Price</mat-label><input matInput type="number" [(ngModel)]="form.wholesalePrice" name="wholesalePrice"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Tax Slab</mat-label><mat-select [(ngModel)]="form.taxSlabId" name="taxSlabId">@for (tax of lookup()?.taxSlabs ?? []; track tax.id) { <mat-option [value]="tax.id">{{ tax.name }} ({{ tax.rate }}%)</mat-option> }</mat-select></mat-form-field>
            <mat-checkbox [(ngModel)]="form.isTaxInclusive" name="isTaxInclusive">Tax Inclusive</mat-checkbox>
          </div>

          <h3>Stock</h3>
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Unit</mat-label><mat-select [(ngModel)]="form.unitOfMeasureId" name="unitOfMeasureId">@for (u of lookup()?.units ?? []; track u.id) { <mat-option [value]="u.id">{{ u.name }} ({{ u.symbol }})</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Min Stock</mat-label><input matInput type="number" [(ngModel)]="form.lowStockThreshold" name="lowStockThreshold"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Max Stock</mat-label><input matInput type="number" [(ngModel)]="form.maxStockThreshold" name="maxStockThreshold"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Opening Stock</mat-label><input matInput type="number" [(ngModel)]="form.openingStock" name="openingStock"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Reorder Qty</mat-label><input matInput type="number" [(ngModel)]="form.reorderQuantity" name="reorderQuantity"></mat-form-field>
          </div>

          <h3>Variants</h3>
          <div class="variant-tools">
            <input placeholder="Sizes comma separated" [(ngModel)]="sizes" name="sizes">
            <input placeholder="Colors comma separated" [(ngModel)]="colors" name="colors">
            <button mat-stroked-button type="button" (click)="generateVariants()">Generate Size x Color</button>
          </div>
          <div class="chips">@for (variant of form.variants; track variant.size + '-' + variant.color) { <span>{{ variant.size }} / {{ variant.color }}</span> }</div>

          <h3>Industry Extras</h3>
          <div class="grid">
            <mat-checkbox [(ngModel)]="form.batchTracking" name="batchTracking">Batch tracking</mat-checkbox>
            <mat-checkbox [(ngModel)]="form.expiryTracking" name="expiryTracking">Expiry tracking</mat-checkbox>
            <mat-checkbox [(ngModel)]="form.requiresPrescription" name="requiresPrescription">Requires Prescription</mat-checkbox>
            <mat-form-field appearance="outline"><mat-label>Composition</mat-label><input matInput [(ngModel)]="form.composition" name="composition"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Manufacturer</mat-label><input matInput [(ngModel)]="form.manufacturer" name="manufacturer"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Food type</mat-label><mat-select [(ngModel)]="form.foodType" name="foodType"><mat-option value="NotApplicable">N/A</mat-option><mat-option value="Veg">Veg</mat-option><mat-option value="NonVeg">Non-Veg</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Prep time</mat-label><input matInput type="number" [(ngModel)]="form.preparationTimeMinutes" name="preparationTimeMinutes"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Recipe cost</mat-label><input matInput type="number" [(ngModel)]="form.recipeCost" name="recipeCost"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Portion size</mat-label><input matInput [(ngModel)]="form.portionSize" name="portionSize"></mat-form-field>
          </div>

          <h3>Status & Media</h3>
          <div class="grid">
            <input type="file" accept="image/*" (change)="imageSelected($event)">
            <mat-checkbox [(ngModel)]="form.isActive" name="isActive">Active</mat-checkbox>
            <mat-checkbox [(ngModel)]="form.isFeatured" name="isFeatured">Featured</mat-checkbox>
          </div>
          @if (message()) { <p class="message">{{ message() }}</p> }
          <div class="actions"><button mat-flat-button color="primary" type="submit"><mat-icon>save</mat-icon>Save Product</button></div>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .products-page { padding: 14px; display: grid; gap: 14px; }
    .page-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .page-head div { display: grid; gap: 3px; } .page-head strong { font-size: 22px; } .page-head span { color: #667085; }
    .content { display: grid; grid-template-columns: 330px minmax(0,1fr); gap: 14px; }
    .list, .form { background: white; border: 1px solid #dfe5ec; border-radius: 8px; padding: 14px; }
    .list { display: grid; align-content: start; gap: 8px; }
    .list button { border: 1px solid #e4e8ef; border-radius: 6px; background: #fff; padding: 10px; display: grid; text-align: left; gap: 3px; cursor: pointer; }
    .list button.active { border-color: #0f766e; background: #effcf8; }
    .list span, .message { color: #667085; font-size: 12px; }
    .form { display: grid; gap: 12px; }
    h3 { margin: 8px 0 0; font-size: 15px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap: 10px; align-items: center; }
    .variant-tools { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
    input { min-height: 36px; border: 1px solid #cfd6e1; border-radius: 5px; padding: 0 8px; box-sizing: border-box; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chips span { border: 1px solid #d0d5dd; border-radius: 999px; padding: 4px 8px; font-size: 12px; }
    .actions { display: flex; justify-content: flex-end; }
    @media (max-width: 1040px) { .content, .grid, .variant-tools { grid-template-columns: 1fr; } }
  `]
})
export class InventoryProductsComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly lookup = signal<InventoryLookupDto | null>(null);
  readonly products = signal<InventoryProductListItemDto[]>([]);
  readonly message = signal('');
  search = '';
  sizes = '';
  colors = '';
  form = this.blank();

  constructor() {
    this.inventory.lookup(this.shopId()).subscribe(data => {
      this.lookup.set(data);
      this.form.categoryId = data.categories[0]?.id ?? '';
      this.form.unitOfMeasureId = data.units[0]?.id ?? '';
      this.form.taxSlabId = data.taxSlabs[0]?.id ?? '';
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.inventory.products(this.shopId(), this.search).subscribe(rows => this.products.set(rows));
  }

  newProduct(): void { this.form = this.blank(); this.message.set(''); }

  edit(product: InventoryProductListItemDto): void {
    this.inventory.product(product.id).subscribe(detail => {
      this.form = { ...detail, imageDataUrl: null, variants: detail.variants.map(v => ({ size: v.size, color: v.color, sellingPrice: v.sellingPrice, mrp: v.mrp })) };
    });
  }

  generateVariants(): void {
    const sizes = this.sizes.split(',').map(x => x.trim()).filter(Boolean);
    const colors = this.colors.split(',').map(x => x.trim()).filter(Boolean);
    this.form.variants = sizes.flatMap(size => colors.map(color => ({ size, color, sellingPrice: this.form.sellingPrice, mrp: this.form.mrp } satisfies SaveProductVariantRequest)));
  }

  imageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) { this.message.set('Compress image to 200KB or less before upload.'); return; }
    const reader = new FileReader();
    reader.onload = () => this.form.imageDataUrl = String(reader.result);
    reader.readAsDataURL(file);
  }

  save(): void {
    this.inventory.saveProduct({ ...this.form, shopId: this.shopId() }).subscribe({
      next: product => { this.message.set(`Saved ${product.name}.`); this.loadProducts(); },
      error: () => this.message.set('Could not save product. Check required fields and image size.')
    });
  }

  private blank(): SaveProductRequest {
    return { shopId: this.shopId(), name: '', sku: null, barcode: null, categoryId: this.lookup()?.categories[0]?.id ?? '', subCategory: null, brand: null, hsnSacCode: null, unitOfMeasureId: this.lookup()?.units[0]?.id ?? '', taxSlabId: this.lookup()?.taxSlabs[0]?.id ?? '', costPrice: 0, sellingPrice: 0, mrp: 0, wholesalePrice: 0, lowStockThreshold: 0, maxStockThreshold: 0, openingStock: 0, reorderQuantity: 0, isTaxInclusive: false, expiryTracking: false, batchTracking: false, requiresPrescription: false, composition: null, manufacturer: null, foodType: 'NotApplicable', preparationTimeMinutes: null, recipeCost: 0, portionSize: null, imageDataUrl: null, isActive: true, isFeatured: false, variants: [] };
  }
}
