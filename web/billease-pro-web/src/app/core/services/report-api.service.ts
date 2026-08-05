import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AnalyticsDashboardDto, ReportCatalogDto, ReportRequestDto, ReportResultDto } from '../../features/reports/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportApiService extends ApiService {
  catalog() { return this.http.get<ReportCatalogDto>(this.url('reports/catalog')); }
  run(request: ReportRequestDto) { return this.http.post<ReportResultDto>(this.url('reports/run'), request); }
  dashboard(shopId: string) { return this.http.get<AnalyticsDashboardDto>(this.url('reports/dashboard'), { params: this.params({ shopId }) }); }
  export(request: ReportRequestDto, format: 'pdf' | 'excel' | 'csv') { return this.http.post(this.url('reports/run'), { ...request, format }); }
}
