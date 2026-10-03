using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillEasePro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogEnhancements : Migration
    {
        /// <inheritdoc />
        private static void SafeAddColumn(MigrationBuilder mb, string table, string column, string type, bool nullable = true, string defaultValue = null)
        {
            var nullClause = nullable ? "NULL" : "NOT NULL";
            var defaultClause = defaultValue != null ? $" DEFAULT {defaultValue}" : "";
            mb.Sql($@"IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[{table}]') AND name = N'{column}')
BEGIN
    ALTER TABLE [{table}] ADD [{column}] {type} {nullClause}{defaultClause};
END");
        }

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            SafeAddColumn(migrationBuilder, "Products", "CountryOfOrigin", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "CustomAttributesJson", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "DosageForm", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "DrugSchedule", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "FitType", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "FssaiLicenseNo", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "GenderTarget", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "IsNarcotic", "bit", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "IsOrganic", "bit", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "IsPerishable", "bit", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "IsSerialTracked", "bit", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "IsWeighingScaleItem", "bit", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "MaterialFabric", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "MinSellingPrice", "decimal(18,2)", false, "0");
            SafeAddColumn(migrationBuilder, "Products", "ModelNumber", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "NetWeight", "decimal(18,2)");
            SafeAddColumn(migrationBuilder, "Products", "PackageSize", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "PackagingDetails", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "PartNumber", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "PluCode", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "RackLocation", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "ReturnWindowDays", "int");
            SafeAddColumn(migrationBuilder, "Products", "Season", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "SecondaryBarcodes", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "ShelfLifeDays", "int");
            SafeAddColumn(migrationBuilder, "Products", "StorageCondition", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "StorageTemperature", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "StyleCode", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "TechnicalSpecifications", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "WarrantyMonths", "int");
            SafeAddColumn(migrationBuilder, "Products", "WarrantyType", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Products", "WeightUnit", "nvarchar(max)");
            SafeAddColumn(migrationBuilder, "Categories", "CategoryType", "int", false, "0");

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 12, 578, DateTimeKind.Unspecified).AddTicks(3819), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 12, 777, DateTimeKind.Unspecified).AddTicks(1848), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 12, 960, DateTimeKind.Unspecified).AddTicks(3385), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000001"),
                columns: new[] { "CategoryType", "CreatedAt" },
                values: new object[] { 6, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1588), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000002"),
                columns: new[] { "CategoryType", "CreatedAt" },
                values: new object[] { 6, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1604), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000003"),
                columns: new[] { "CategoryType", "CreatedAt" },
                values: new object[] { 6, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1609), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "DiscountTypes",
                keyColumn: "Id",
                keyValue: new Guid("60000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1439), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "DiscountTypes",
                keyColumn: "Id",
                keyValue: new Guid("60000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1497), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000001"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2055), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000002"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2082), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000003"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2091), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000004"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2099), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000005"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2121), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000006"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2129), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000007"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2144), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000008"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2153), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000009"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2160), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000010"),
                columns: new[] { "CountryOfOrigin", "CreatedAt", "CustomAttributesJson", "DosageForm", "DrugSchedule", "FitType", "FssaiLicenseNo", "GenderTarget", "IsNarcotic", "IsOrganic", "IsPerishable", "IsSerialTracked", "IsWeighingScaleItem", "MaterialFabric", "MinSellingPrice", "ModelNumber", "NetWeight", "PackageSize", "PackagingDetails", "PartNumber", "PluCode", "RackLocation", "ReturnWindowDays", "Season", "SecondaryBarcodes", "ShelfLifeDays", "StorageCondition", "StorageTemperature", "StyleCode", "TechnicalSpecifications", "WarrantyMonths", "WarrantyType", "WeightUnit" },
                values: new object[] { null, new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(2167), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, null, null, false, false, false, false, false, null, 0m, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Shops",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"),
                columns: new[] { "CreatedAt", "IndustryType" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 12, 578, DateTimeKind.Unspecified).AddTicks(3385), new TimeSpan(0, 0, 0, 0, 0)), 8 });

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000000"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1266), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000005"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1282), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000012"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1297), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000018"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1301), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000028"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1306), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1132), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1143), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 10, 3, 12, 42, 13, 147, DateTimeKind.Unspecified).AddTicks(1148), new TimeSpan(0, 0, 0, 0, 0)));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryOfOrigin",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CustomAttributesJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DosageForm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DrugSchedule",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FitType",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FssaiLicenseNo",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "GenderTarget",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsNarcotic",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsOrganic",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsPerishable",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsSerialTracked",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsWeighingScaleItem",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MaterialFabric",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MinSellingPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ModelNumber",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NetWeight",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackageSize",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackagingDetails",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PartNumber",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PluCode",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RackLocation",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReturnWindowDays",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Season",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SecondaryBarcodes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShelfLifeDays",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StorageCondition",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StorageTemperature",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StyleCode",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TechnicalSpecifications",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WarrantyMonths",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WarrantyType",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WeightUnit",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CategoryType",
                table: "Categories");

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 589, DateTimeKind.Unspecified).AddTicks(3345), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 726, DateTimeKind.Unspecified).AddTicks(7009), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "AppUsers",
                keyColumn: "Id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 847, DateTimeKind.Unspecified).AddTicks(2552), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(162), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(166), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(169), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "DiscountTypes",
                keyColumn: "Id",
                keyValue: new Guid("60000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(103), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "DiscountTypes",
                keyColumn: "Id",
                keyValue: new Guid("60000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(124), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(216), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(227), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(229), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000004"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(231), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000005"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(233), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000006"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(235), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000007"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(247), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000008"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(251), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000009"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(253), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: new Guid("70000000-0000-0000-0000-000000000010"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(254), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Shops",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"),
                columns: new[] { "CreatedAt", "IndustryType" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 589, DateTimeKind.Unspecified).AddTicks(3128), new TimeSpan(0, 0, 0, 0, 0)), 6 });

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000000"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(38), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000005"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(49), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000012"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(57), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000018"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(58), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "TaxSlabs",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000028"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(59), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 966, DateTimeKind.Unspecified).AddTicks(9998), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(3), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "UnitOfMeasures",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTimeOffset(new DateTime(2026, 8, 2, 14, 15, 5, 967, DateTimeKind.Unspecified).AddTicks(4), new TimeSpan(0, 0, 0, 0, 0)));
        }
    }
}
