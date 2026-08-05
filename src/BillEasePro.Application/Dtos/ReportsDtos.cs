namespace BillEasePro.Application.Dtos;

public sealed record ReportCatalogDto(IReadOnlyList<ReportCategoryDto> Categories);
public sealed record ReportCategoryDto(string Key, string Title, IReadOnlyList<ReportInfoDto> Reports);
public sealed record ReportInfoDto(string Key, string Title, string Description, bool HasChart);
public sealed record ReportRequestDto(Guid ShopId, string ReportKey, DateTimeOffset From, DateTimeOffset To, string GroupBy, string? Search, int DeadStockDays);
public sealed record ReportResultDto(string Key, string Title, string Category, IReadOnlyList<ReportMetricDto> Metrics, IReadOnlyList<ReportColumnDto> Columns, IReadOnlyList<IReadOnlyDictionary<string, object?>> Rows, IReadOnlyList<ReportChartDto> Charts);
public sealed record ReportMetricDto(string Label, decimal Value, string Format);
public sealed record ReportColumnDto(string Field, string Header, string Type);
public sealed record ReportChartDto(string Type, string Title, IReadOnlyList<string> Labels, IReadOnlyList<ReportDatasetDto> Datasets);
public sealed record ReportDatasetDto(string Label, IReadOnlyList<decimal> Data);
public sealed record AnalyticsDashboardDto(IReadOnlyList<ReportMetricDto> Metrics, IReadOnlyList<ReportChartDto> Charts, IReadOnlyList<CalendarHeatmapPointDto> BillHeatmap, int NewCustomers, int ReturningCustomers);
public sealed record CalendarHeatmapPointDto(DateOnly Date, int Count);
