import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/auth/auth.service';
import { CategoryTreeNodeDto, CategoryType, SaveCategoryRequest } from './inventory.models';
import { InventoryService } from './inventory.service';

interface DepartmentOption {
  value: CategoryType;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'be-inventory-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule
  ],
  template: `
    <section class="page">
      <header class="page-head">
        <div>
          <strong>Department & Categories</strong>
          <span>Universal multi-vertical category structure for Supermarkets and individual specialty shops.</span>
        </div>
        <div class="head-pill">
          <mat-icon>storefront</mat-icon>
          <span>Multi-Vertical Catalog</span>
        </div>
      </header>

      <!-- Department Quick Filter Tabs -->
      <div class="dept-tabs">
        <button type="button" class="dept-tab" [class.active]="selectedDeptFilter() === 'ALL'" (click)="selectedDeptFilter.set('ALL')">
          <span class="tab-icon">🌐</span> All Departments ({{ totalCategoryCount() }})
        </button>
        @for (d of departments; track d.value) {
          <button type="button" class="dept-tab" [class.active]="selectedDeptFilter() === d.value" (click)="selectedDeptFilter.set(d.value)">
            <span class="tab-icon">{{ d.icon }}</span> {{ d.label }}
          </button>
        }
      </div>

      <section class="layout">
        <aside class="tree">
          <div class="tree-header">
            <h4>Category Hierarchy</h4>
            <button mat-stroked-button color="primary" type="button" (click)="resetForm()">
              <mat-icon>add</mat-icon> Add Root
            </button>
          </div>

          @if (filteredTree().length === 0) {
            <div class="empty-state">
              <mat-icon>category</mat-icon>
              <p>No categories in this department yet.</p>
            </div>
          }

          <div class="tree-list">
            @for (node of filteredTree(); track node.id) {
              <div class="node-group">
                <div class="node" [class.active]="form.id === node.id">
                  <span class="color-dot" [style.background]="node.colorHex || '#0f766e'"></span>
                  <div class="node-info">
                    <div class="node-title-row">
                      <strong>{{ node.name }}</strong>
                      <span class="dept-badge" [style.color]="getDeptColor(node.categoryType)">
                        {{ getDeptIcon(node.categoryType) }} {{ getDeptLabel(node.categoryType) }}
                      </span>
                    </div>
                    @if (node.description) {
                      <small class="node-desc">{{ node.description }}</small>
                    }
                  </div>
                  <div class="node-actions">
                    <button mat-icon-button type="button" title="Add Sub-category" (click)="addSubCategory(node)">
                      <mat-icon>add_circle_outline</mat-icon>
                    </button>
                    <button mat-icon-button type="button" title="Edit" (click)="edit(node, null)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </div>
                </div>

                @for (child of node.children; track child.id) {
                  <div class="node child" [class.active]="form.id === child.id">
                    <span class="color-dot child-dot" [style.background]="child.colorHex || '#94a3b8'"></span>
                    <div class="node-info">
                      <div class="node-title-row">
                        <span>{{ child.name }}</span>
                        @if (child.categoryType && child.categoryType !== node.categoryType) {
                          <span class="dept-badge small">
                            {{ getDeptIcon(child.categoryType) }}
                          </span>
                        }
                      </div>
                      @if (child.description) {
                        <small class="node-desc">{{ child.description }}</small>
                      }
                    </div>
                    <div class="node-actions">
                      <button mat-icon-button type="button" title="Edit" (click)="edit(child, node.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </aside>

        <form class="form" (ngSubmit)="save()">
          <div class="form-title">
            <h3>{{ form.id ? 'Edit Category' : 'Create New Category' }}</h3>
            <span>Configure department type, display ordering, and hierarchical nesting.</span>
          </div>

          <div class="field-grid">
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Category Name</mat-label>
              <input matInput required [(ngModel)]="form.name" name="name" placeholder="e.g. Dairy & Eggs, Smart Watches, Men's T-Shirts">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Department / Vertical</mat-label>
              <mat-select [(ngModel)]="form.categoryType" name="categoryType">
                @for (d of departments; track d.value) {
                  <mat-option [value]="d.value">
                    {{ d.icon }} {{ d.label }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Parent Category (Hierarchy)</mat-label>
              <mat-select [(ngModel)]="form.parentCategoryId" name="parentCategoryId">
                <mat-option [value]="null">★ Root Level Category</mat-option>
                @for (node of tree(); track node.id) {
                  @if (node.id !== form.id) {
                    <mat-option [value]="node.id">{{ node.name }} ({{ getDeptLabel(node.categoryType) }})</mat-option>
                  }
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Description / POS Subtext</mat-label>
              <input matInput [(ngModel)]="form.description" name="description" placeholder="Brief note or POS tag for cashiers">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Image URL / Banner Icon</mat-label>
              <input matInput [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://...">
            </mat-form-field>

            <div class="color-order-row">
              <mat-form-field appearance="outline" class="color-field">
                <mat-label>Accent Color</mat-label>
                <input matInput type="color" [(ngModel)]="form.colorHex" name="colorHex">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Display Order</mat-label>
                <input matInput type="number" [(ngModel)]="form.displayOrder" name="displayOrder">
              </mat-form-field>
            </div>
          </div>

          <div class="form-actions">
            @if (message()) {
              <span class="status-msg">{{ message() }}</span>
            }
            <div class="btn-group">
              <button mat-button type="button" (click)="resetForm()">Reset</button>
              <button mat-flat-button color="primary" type="submit">
                <mat-icon>save</mat-icon> {{ form.id ? 'Update Category' : 'Save Category' }}
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .page { padding: 18px; display: grid; gap: 14px; background: #fafbfc; min-height: 100vh; }
    .page-head { display: flex; justify-content: space-between; align-items: center; }
    .page-head strong { font-size: 24px; color: #101828; display: block; }
    .page-head span { color: #667085; font-size: 13px; }
    .head-pill { display: flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    
    .dept-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .dept-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: #475467;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease-in-out;
    }
    .dept-tab:hover { background: #f8fafc; border-color: #cbd5e1; }
    .dept-tab.active {
      background: #0f766e;
      color: #ffffff;
      border-color: #0f766e;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.25);
    }
    .tab-icon { font-size: 14px; }

    .layout { display: grid; grid-template-columns: 420px 1fr; gap: 16px; }
    .tree, .form { background: white; border: 1px solid #dfe5ec; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05); }
    .tree-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 10px; }
    .tree-header h4 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }

    .tree-list { max-height: calc(100vh - 240px); overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .empty-state { text-align: center; padding: 32px 16px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }

    .node-group { border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden; }
    .node {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #ffffff;
      transition: background 0.15s;
    }
    .node:hover, .node.active { background: #f0fdfa; }
    .color-dot { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
    .node-info { flex: 1; min-width: 0; }
    .node-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .node-title-row strong { font-size: 13px; color: #0f172a; }
    .node-title-row span { font-size: 13px; color: #334155; }
    .node-desc { display: block; font-size: 11px; color: #64748b; margin-top: 1px; }

    .dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #f8fafc;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .dept-badge.small { font-size: 10px; padding: 1px 4px; }

    .node-actions { display: flex; gap: 2px; }
    .node-actions button { width: 32px; height: 32px; line-height: 32px; color: #64748b; }
    .node-actions button mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .child {
      margin-left: 20px;
      border-top: 1px dashed #f1f5f9;
      background: #fafbfc;
    }
    .child-dot { width: 8px; height: 8px; border-radius: 2px; }

    /* Form Styles */
    .form { display: flex; flex-direction: column; gap: 16px; align-content: start; }
    .form-title h3 { margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #0f172a; }
    .form-title span { font-size: 13px; color: #64748b; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .col-span-2 { grid-column: span 2; }
    .color-order-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .color-field input[type="color"] { height: 36px; cursor: pointer; padding: 2px; }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
      margin-top: 8px;
    }
    .status-msg { color: #0f766e; font-weight: 600; font-size: 13px; }
    .btn-group { display: flex; gap: 8px; margin-left: auto; }

    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .field-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
    }

    @media (max-width: 640px) {
      .page { padding: 10px; gap: 10px; }
      .page-head { flex-direction: column; align-items: flex-start; gap: 8px; }
      .head-pill { display: none; }
      .tree-list { max-height: 380px; }
      .color-order-row { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; gap: 10px; align-items: stretch; }
      .btn-group { width: 100%; justify-content: space-between; }
    }
  `]
})
export class InventoryCategoriesComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);

  readonly departments: DepartmentOption[] = [
    { value: 'Groceries', label: 'Groceries & Daily Needs', icon: '🥦', color: '#16a34a' },
    { value: 'Electronics', label: 'Mobiles & Electronics', icon: '📱', color: '#0284c7' },
    { value: 'Pharmacy', label: 'Pharmacy & Healthcare', icon: '💊', color: '#dc2626' },
    { value: 'Fashion', label: 'Clothing & Fashion', icon: '👗', color: '#9333ea' },
    { value: 'HomeAndKitchen', label: 'Home & Kitchen', icon: '🍳', color: '#ea580c' },
    { value: 'General', label: 'General Merchandise', icon: '📦', color: '#475467' }
  ];

  readonly selectedDeptFilter = signal<string>('ALL');
  readonly tree = signal<CategoryTreeNodeDto[]>([]);
  readonly message = signal('');

  readonly totalCategoryCount = computed(() => {
    let count = 0;
    for (const node of this.tree()) {
      count += 1 + (node.children?.length || 0);
    }
    return count;
  });

  readonly filteredTree = computed(() => {
    const filter = this.selectedDeptFilter();
    if (filter === 'ALL') return this.tree();
    return this.tree().filter(n => (n.categoryType ?? 'General') === filter);
  });

  form: SaveCategoryRequest = this.blank();

  constructor() {
    this.load();
  }

  load(): void {
    this.inventory.categoryTree(this.shopId()).subscribe(tree => this.tree.set(tree));
  }

  edit(node: CategoryTreeNodeDto, parentCategoryId: string | null): void {
    this.form = {
      id: node.id,
      shopId: this.shopId(),
      parentCategoryId,
      name: node.name,
      description: node.description,
      imageUrl: node.imageUrl,
      colorHex: node.colorHex ?? '#0f766e',
      displayOrder: node.displayOrder,
      categoryType: node.categoryType ?? 'General'
    };
    this.message.set('');
  }

  addSubCategory(parent: CategoryTreeNodeDto): void {
    this.form = {
      ...this.blank(),
      parentCategoryId: parent.id,
      categoryType: parent.categoryType ?? 'General',
      colorHex: parent.colorHex ?? '#0f766e'
    };
    this.message.set(`Creating sub-category under ${parent.name}`);
  }

  resetForm(): void {
    this.form = this.blank();
    this.message.set('');
  }

  save(): void {
    this.inventory.saveCategory({ ...this.form, shopId: this.shopId() }).subscribe({
      next: cat => {
        this.message.set(`Saved category "${cat.name}".`);
        this.resetForm();
        this.load();
      },
      error: () => this.message.set('Failed to save category.')
    });
  }

  getDeptLabel(type?: CategoryType): string {
    return this.departments.find(d => d.value === type)?.label ?? 'General';
  }

  getDeptIcon(type?: CategoryType): string {
    return this.departments.find(d => d.value === type)?.icon ?? '📦';
  }

  getDeptColor(type?: CategoryType): string {
    return this.departments.find(d => d.value === type)?.color ?? '#475467';
  }

  private blank(): SaveCategoryRequest {
    return {
      shopId: this.shopId(),
      parentCategoryId: null,
      name: '',
      description: null,
      imageUrl: null,
      colorHex: '#0f766e',
      displayOrder: this.tree().length + 1,
      categoryType: 'General'
    };
  }
}
