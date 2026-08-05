export interface ReportCatalogDto { categories: ReportCategoryDto[]; }
export interface ReportCategoryDto { key: string; title: string; reports: ReportInfoDto[]; }
export interface ReportInfoDto { key: string; title: string; description: string; hasChart: boolean; }
export interface ReportRequestDto { shopId: string; reportKey: string; from: string; to: string; groupBy: string; search?: string | null; deadStockDays: number; }
export interface ReportMetricDto { label: string; value: number; format: string; }
export interface ReportColumnDto { field: string; header: string; type: string; }
export interface ReportDatasetDto { label: string; data: number[]; }
export interface ReportChartDto { type: 'bar' | 'line' | 'pie' | 'doughnut'; title: string; labels: string[]; datasets: ReportDatasetDto[]; }
export interface ReportResultDto { key: string; title: string; category: string; metrics: ReportMetricDto[]; columns: ReportColumnDto[]; rows: Record<string, unknown>[]; charts: ReportChartDto[]; }
export interface CalendarHeatmapPointDto { date: string; count: number; }
export interface AnalyticsDashboardDto { metrics: ReportMetricDto[]; charts: ReportChartDto[]; billHeatmap: CalendarHeatmapPointDto[]; newCustomers: number; returningCustomers: number; }
