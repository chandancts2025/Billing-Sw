import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { CategoryTreeNodeDto, SaveCategoryRequest } from './inventory.models';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'be-inventory-categories',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header><strong>Categories</strong><span>Two-level POS category tree with color, image, and reorder position.</span></header>
      <section class="layout">
        <aside class="tree">
          @for (node of tree(); track node.id) {
            <div class="node"><span [style.background]="node.colorHex || '#2aa198'"></span><strong>{{ node.name }}</strong><button mat-icon-button type="button" (click)="edit(node, null)"><mat-icon>edit</mat-icon></button></div>
            @for (child of node.children; track child.id) {
              <div class="node child"><span [style.background]="child.colorHex || '#98a2b3'"></span>{{ child.name }}<button mat-icon-button type="button" (click)="edit(child, node.id)"><mat-icon>edit</mat-icon></button></div>
            }
          }
        </aside>
        <form class="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput required [(ngModel)]="form.name" name="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Parent</mat-label><mat-select [(ngModel)]="form.parentCategoryId" name="parentCategoryId"><mat-option [value]="null">Root</mat-option>@for (node of tree(); track node.id) { <mat-option [value]="node.id">{{ node.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" name="description"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Image URL</mat-label><input matInput [(ngModel)]="form.imageUrl" name="imageUrl"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Color</mat-label><input matInput type="color" [(ngModel)]="form.colorHex" name="colorHex"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Order</mat-label><input matInput type="number" [(ngModel)]="form.displayOrder" name="displayOrder"></mat-form-field>
          <button mat-flat-button color="primary" type="submit"><mat-icon>save</mat-icon>Save Category</button>
        </form>
      </section>
    </section>
  `,
  styles: [`.page{padding:14px;display:grid;gap:14px}header{display:grid;gap:3px}header strong{font-size:22px}header span{color:#667085}.layout{display:grid;grid-template-columns:360px 1fr;gap:14px}.tree,.form{background:white;border:1px solid #dfe5ec;border-radius:8px;padding:14px}.form{display:grid;gap:10px;align-content:start}.node{display:grid;grid-template-columns:16px 1fr 40px;gap:8px;align-items:center;border-bottom:1px solid #edf1f6;padding:8px}.node span{width:14px;height:14px;border-radius:3px}.child{margin-left:24px;color:#475467}@media(max-width:860px){.layout{grid-template-columns:1fr}}`]
})
export class InventoryCategoriesComponent {
  private readonly inventory = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly tree = signal<CategoryTreeNodeDto[]>([]);
  form: SaveCategoryRequest = this.blank();
  constructor() { this.load(); }
  load(): void { this.inventory.categoryTree(this.shopId()).subscribe(tree => this.tree.set(tree)); }
  edit(node: CategoryTreeNodeDto, parentCategoryId: string | null): void { this.form = { id: node.id, shopId: this.shopId(), parentCategoryId, name: node.name, description: node.description, imageUrl: node.imageUrl, colorHex: node.colorHex ?? '#2aa198', displayOrder: node.displayOrder }; }
  save(): void { this.inventory.saveCategory({ ...this.form, shopId: this.shopId() }).subscribe(() => { this.form = this.blank(); this.load(); }); }
  private blank(): SaveCategoryRequest { return { shopId: this.shopId(), parentCategoryId: null, name: '', description: null, imageUrl: null, colorHex: '#2aa198', displayOrder: this.tree().length + 1 }; }
}
