import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { ReportChartComponent } from './report-chart.component';
import { AnalyticsDashboardDto, ReportCatalogDto, ReportInfoDto, ReportResultDto } from './reports.models';
import { ReportsService } from './reports.service';

@Component({
  selector: 'be-reports-workspace',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ReportChartComponent],
  template: `
    <section class="reports-page">
      <aside class="sidebar">
        <button type="button" [class.active]="isDashboard()" (click)="showDashboard()"><mat-icon>dashboard</mat-icon>Analytics Dashboard</button>
        @for (category of catalog()?.categories ?? []; track category.key) {
          <h3>{{ category.title }}</h3>
          @for (report of category.reports; track report.key) {
            @if (report.key !== 'dashboard') { <button type="button" [class.active]="selected()?.key === report.key" (click)="selectReport(report)">{{ report.title }}</button> }
          }
        }
      </aside>
      <main>
        <header><div><strong>{{ isDashboard() ? 'Analytics Dashboard' : result()?.title || selected()?.title || 'Reports' }}</strong><span>{{ isDashboard() ? 'Business intelligence overview' : selected()?.description }}</span></div><div class="exports"><button mat-stroked-button type="button" (click)="print()"><mat-icon>print</mat-icon>Print</button><button mat-stroked-button type="button" (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon>PDF</button><button mat-stroked-button type="button" (click)="exportExcel()"><mat-icon>download</mat-icon>Excel</button><button mat-stroked-button type="button" (click)="exportCsv()"><mat-icon>table_view</mat-icon>CSV</button></div></header>
        @if (!isDashboard()) {
          <section class="filters">
            <mat-form-field appearance="outline"><mat-label>Range</mat-label><mat-select [(ngModel)]="preset" (ngModelChange)="applyPreset()"><mat-option value="today">Today</mat-option><mat-option value="yesterday">Yesterday</mat-option><mat-option value="week">This Week</mat-option><mat-option value="month">This Month</mat-option><mat-option value="lastMonth">Last Month</mat-option><mat-option value="custom">Custom</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>From</mat-label><input matInput type="date" [(ngModel)]="from"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>To</mat-label><input matInput type="date" [(ngModel)]="to"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Group</mat-label><mat-select [(ngModel)]="groupBy"><mat-option value="day">Day</mat-option><mat-option value="week">Week</mat-option><mat-option value="month">Month</mat-option><mat-option value="category">Product Category</mat-option><mat-option value="operator">Operator</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Filter</mat-label><input matInput [(ngModel)]="search"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Dead stock days</mat-label><input matInput type="number" [(ngModel)]="deadStockDays"></mat-form-field>
            <button mat-flat-button color="primary" type="button" (click)="run()"><mat-icon>query_stats</mat-icon>Run</button>
          </section>
        }
        @if (isDashboard() && dashboard()) {
          <section class="metrics">@for (metric of dashboard()!.metrics; track metric.label) { <article><span>{{ metric.label }}</span><strong>{{ formatMetric(metric.value, metric.format) }}</strong></article> }<article><span>New Customers</span><strong>{{ dashboard()!.newCustomers }}</strong></article><article><span>Returning Customers</span><strong>{{ dashboard()!.returningCustomers }}</strong></article></section>
          <section class="charts dashboard">@for (chart of dashboard()!.charts; track chart.title) { <article><be-report-chart [chart]="chart" /></article> }</section>
          <section class="heatmap">@for (point of dashboard()!.billHeatmap; track point.date) { <span [title]="point.date + ': ' + point.count" [style.opacity]="heat(point.count)"></span> }</section>
        }
        @if (!isDashboard() && result()) {
          <section class="metrics">@for (metric of result()!.metrics; track metric.label) { <article><span>{{ metric.label }}</span><strong>{{ formatMetric(metric.value, metric.format) }}</strong></article> }</section>
          @if (result()!.charts.length) { <section class="charts">@for (chart of result()!.charts; track chart.title) { <article><be-report-chart [chart]="chart" /></article> }</section> }
          <section class="table-wrap"><table><thead><tr>@for (col of result()!.columns; track col.field) { <th (click)="sort(col.field)">{{ col.header }} <mat-icon>{{ sortField === col.field ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</mat-icon></th> }</tr></thead><tbody>@for (row of sortedRows(); track rowIndex($index)) { <tr [class.negative]="row['marginClass'] === 'negative'">@for (col of result()!.columns; track col.field) { <td>{{ row[col.field] }}</td> }</tr> } @empty { <tr><td [attr.colspan]="result()!.columns.length">No rows for this filter.</td></tr> }</tbody></table></section>
        }
      </main>
    </section>
  `,
  styles: [`.reports-page{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:calc(100vh - 64px)}.sidebar{background:#fff;border-right:1px solid #dfe5ec;padding:14px;display:grid;align-content:start;gap:6px;color:#344054}.sidebar h3{margin:14px 0 4px;font-size:12px;color:#667085;text-transform:uppercase}.sidebar button{border:0;background:transparent;color:#344054;text-align:left;padding:8px 10px;border-radius:6px;cursor:pointer;display:flex;gap:8px;align-items:center;width:100%}.sidebar button mat-icon{color:#667085}.sidebar button.active,.sidebar button:hover{background:#eef7f6;color:#0f766e}.sidebar button.active mat-icon,.sidebar button:hover mat-icon{color:#0f766e}main{padding:14px;display:grid;gap:14px;align-content:start;min-width:0}header,.exports,.filters{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px}header div:first-child{display:grid;gap:3px}header strong{font-size:22px}header span{color:#667085}.filters{justify-content:start;align-items:start}.filters mat-form-field{width:150px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:10px}.metrics article,.charts article,.table-wrap,.heatmap{background:#fff;border:1px solid #dfe5ec;border-radius:8px;color:#19202a}.metrics article{padding:14px;display:grid;gap:4px}.metrics span{color:#667085;font-size:12px}.metrics strong{font-size:22px}.charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.charts article{padding:12px;min-height:310px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:900px}th,td{padding:9px 10px;border-bottom:1px solid #edf1f6;text-align:left}th{background:#f7f9fc;color:#4b5565;font-size:12px;cursor:pointer;white-space:nowrap}th mat-icon{font-size:15px;width:15px;height:15px;vertical-align:middle}tr.negative td{background:#fff1f0;color:#b42318}.heatmap{display:grid;grid-template-columns:repeat(30,14px);gap:4px;padding:14px;width:max-content}.heatmap span{width:14px;height:14px;border-radius:3px;background:#0f766e}@media(max-width:980px){.reports-page{grid-template-columns:1fr}.sidebar{border-right:0;border-bottom:1px solid #dfe5ec}.metrics,.charts{grid-template-columns:1fr}}`]
})
export class ReportsWorkspaceComponent {
  private readonly reports = inject(ReportsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly catalog = signal<ReportCatalogDto | null>(null);
  readonly selected = signal<ReportInfoDto | null>(null);
  readonly result = signal<ReportResultDto | null>(null);
  readonly dashboard = signal<AnalyticsDashboardDto | null>(null);
  readonly dashboardMode = signal(false);
  preset = 'month'; from = ''; to = ''; groupBy = 'day'; search = ''; deadStockDays = 90; sortField = ''; sortDir: 'asc' | 'desc' = 'asc';
  constructor() { this.applyPreset(); this.dashboardMode.set(this.route.snapshot.routeConfig?.path === 'reports/dashboard' || this.route.snapshot.routeConfig?.path === 'reports/analytics'); this.reports.catalog().subscribe(catalog => { this.catalog.set(catalog); if (this.isDashboard()) this.loadDashboard(); else this.selectReport(catalog.categories[0]?.reports[0]); }); }
  isDashboard(): boolean { return this.dashboardMode(); }
  showDashboard(): void { this.dashboardMode.set(true); this.selected.set(null); this.result.set(null); this.loadDashboard(); }
  selectReport(report?: ReportInfoDto): void { if (!report) return; this.dashboardMode.set(false); this.selected.set(report); this.dashboard.set(null); this.run(); }
  run(): void { const report = this.selected(); if (!report) return; this.reports.run({ shopId: this.shopId(), reportKey: report.key, from: new Date(this.from).toISOString(), to: new Date(this.to + 'T23:59:59').toISOString(), groupBy: this.groupBy, search: this.search || null, deadStockDays: this.deadStockDays }).subscribe(result => { this.result.set(result); this.sortField = result.columns[0]?.field ?? ''; }); }
  loadDashboard(): void { this.reports.dashboard(this.shopId()).subscribe(data => this.dashboard.set(data)); }
  applyPreset(): void { const now = new Date(); const start = new Date(now); const end = new Date(now); if (this.preset === 'yesterday') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); } if (this.preset === 'week') start.setDate(now.getDate() - now.getDay()); if (this.preset === 'month') start.setDate(1); if (this.preset === 'lastMonth') { start.setMonth(now.getMonth() - 1, 1); end.setMonth(now.getMonth(), 0); } this.from = start.toISOString().slice(0, 10); this.to = end.toISOString().slice(0, 10); }
  sortedRows(): Record<string, unknown>[] { const rows = [...(this.result()?.rows ?? [])]; if (!this.sortField) return rows; return rows.sort((a, b) => String(a[this.sortField] ?? '').localeCompare(String(b[this.sortField] ?? ''), undefined, { numeric: true }) * (this.sortDir === 'asc' ? 1 : -1)); }
  sort(field: string): void { this.sortDir = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc'; this.sortField = field; }
  rowIndex(index: number): number { return index; }
  formatMetric(value: number, format: string): string { return format === 'currency' ? `Rs. ${value.toFixed(2)}` : String(value); }
  heat(count: number): number { return Math.min(1, 0.2 + count / 10); }
  print(): void { window.print(); }
  exportPdf(): void { const w = window.open('', '_blank', 'width=1000,height=800'); w?.document.write(`<html><body>${document.querySelector('.reports-page main')?.innerHTML ?? ''}</body></html>`); w?.document.close(); w?.print(); }
  exportExcel(): void { this.download('report.xls', 'application/vnd.ms-excel', document.querySelector('.table-wrap')?.innerHTML ?? ''); }
  exportCsv(): void { const result = this.result(); if (!result) return; const csv = [result.columns.map(c => c.header), ...this.sortedRows().map(row => result.columns.map(c => String(row[c.field] ?? '')))].map(row => row.map(x => `"${x.replaceAll('"', '""')}"`).join(',')).join('\n'); this.download('report.csv', 'text/csv;charset=utf-8', csv); }
  private download(filename: string, type: string, content: string): void { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
}
