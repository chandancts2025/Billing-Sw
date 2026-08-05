import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { ReportApiService } from '../../core/services/report-api.service';
import { AnalyticsDashboardDto } from '../reports/reports.models';
import { ReportChartComponent } from '../reports/report-chart.component';

@Component({
  selector: 'be-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ReportChartComponent],
  template: `
    <section class="dashboard">
      <header>
        <div>
          <strong>Dashboard</strong>
          <span>Live pulse of sales, inventory, customers, payments, and profit.</span>
        </div>
        <a mat-flat-button color="primary" href="/billing/new"><mat-icon>bolt</mat-icon>Quick Bill</a>
      </header>

      @if (dashboard()) {
        <section class="metrics">
          @for (metric of dashboard()!.metrics; track metric.label) {
            <article><span>{{ metric.label }}</span><strong>{{ format(metric.value, metric.format) }}</strong></article>
          }
          <article><span>New Customers</span><strong>{{ dashboard()!.newCustomers }}</strong></article>
          <article><span>Returning Customers</span><strong>{{ dashboard()!.returningCustomers }}</strong></article>
        </section>
        <section class="charts">
          @for (chart of dashboard()!.charts; track chart.title) {
            <article><be-report-chart [chart]="chart" /></article>
          }
        </section>
        <section class="heatmap">
          @for (point of dashboard()!.billHeatmap; track point.date) {
            <span [title]="point.date + ': ' + point.count" [style.opacity]="Math.min(1, 0.2 + point.count / 10)"></span>
          }
        </section>
      } @else {
        <section class="placeholder">
          <mat-icon>query_stats</mat-icon>
          <strong>Dashboard loading</strong>
          <span>KPIs and charts appear here as soon as the API responds.</span>
        </section>
      }
    </section>
  `,
  styles: [`.dashboard{display:grid;gap:14px;padding:14px}header{display:flex;justify-content:space-between;align-items:center;gap:12px}header div{display:grid;gap:3px}header strong{font-size:24px}header span,.metrics span,.placeholder span{color:#667085}.metrics{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px}.metrics article,.charts article,.placeholder,.heatmap{background:#fff;border:1px solid #dfe5ec;border-radius:8px}.metrics article{padding:14px;display:grid;gap:5px}.metrics strong{font-size:22px}.charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.charts article{padding:12px;min-height:310px}.heatmap{display:grid;grid-template-columns:repeat(30,14px);gap:4px;width:max-content;padding:14px}.heatmap span{width:14px;height:14px;border-radius:3px;background:var(--brand-color,#0f766e)}.placeholder{min-height:300px;display:grid;place-items:center;align-content:center;gap:8px}@media(max-width:960px){.metrics,.charts{grid-template-columns:1fr}}`]
})
export class DashboardComponent {
  private readonly reports = inject(ReportApiService);
  private readonly auth = inject(AuthService);
  private readonly demoShopId = '10000000-0000-0000-0000-000000000001';
  readonly shopId = computed(() => this.auth.user()?.shopId ?? this.demoShopId);
  readonly dashboard = signal<AnalyticsDashboardDto | null>(null);
  readonly Math = Math;

  constructor() {
    this.reports.dashboard(this.shopId()).subscribe(data => this.dashboard.set(data));
  }

  format(value: number, kind: string): string {
    return kind === 'currency' ? `Rs. ${value.toFixed(2)}` : String(value);
  }
}
