import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { AnalyticsDashboardDto, ReportCatalogDto, ReportRequestDto, ReportResultDto } from './reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/reports`;

  catalog() { return this.http.get<ReportCatalogDto>(`${this.base}/catalog`); }
  run(request: ReportRequestDto) { return this.http.post<ReportResultDto>(`${this.base}/run`, request); }
  dashboard(shopId: string) { return this.http.get<AnalyticsDashboardDto>(`${this.base}/dashboard`, { params: { shopId } }); }
}
