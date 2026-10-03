using BillEasePro.Domain.Entities;
using BillEasePro.Domain.Enums;
using BillEasePro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BillEasePro.Infrastructure.Services;

public static class DemoShowcaseSeeder
{
    public static async Task<int> SeedAsync(BillEaseDbContext db, Guid shopId, ILogger? logger = null, CancellationToken cancellationToken = default)
    {
        logger?.LogInformation("Starting Demo Showcase Seeder for ShopId: {ShopId}...", shopId);

        // Verify or create Units of Measure
        var uomPiece = await db.UnitOfMeasures.FirstOrDefaultAsync(u => u.Symbol == "pc", cancellationToken);
        if (uomPiece == null)
        {
            uomPiece = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Piece", Symbol = "pc", UnitType = UnitType.Piece, CreatedBy = "system" };
            db.UnitOfMeasures.Add(uomPiece);
        }

        var uomKg = await db.UnitOfMeasures.FirstOrDefaultAsync(u => u.Symbol == "kg", cancellationToken);
        if (uomKg == null)
        {
            uomKg = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Kilogram", Symbol = "kg", UnitType = UnitType.Kg, CreatedBy = "system" };
            db.UnitOfMeasures.Add(uomKg);
        }

        var uomPack = await db.UnitOfMeasures.FirstOrDefaultAsync(u => u.Symbol == "pack", cancellationToken);
        if (uomPack == null)
        {
            uomPack = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Pack", Symbol = "pack", UnitType = UnitType.Pack, CreatedBy = "system" };
            db.UnitOfMeasures.Add(uomPack);
        }

        var uomLtr = await db.UnitOfMeasures.FirstOrDefaultAsync(u => u.Symbol == "ltr", cancellationToken);
        if (uomLtr == null)
        {
            uomLtr = new UnitOfMeasure { Id = Guid.NewGuid(), Name = "Litre", Symbol = "ltr", UnitType = UnitType.Liter, CreatedBy = "system" };
            db.UnitOfMeasures.Add(uomLtr);
        }

        await db.SaveChangesAsync(cancellationToken);

        // Tax Slabs
        var tax0 = await db.TaxSlabs.FirstOrDefaultAsync(t => t.Rate == 0, cancellationToken)
            ?? new TaxSlab { Id = Guid.NewGuid(), Name = "GST 0% (Exempt)", Rate = 0, TaxRegime = TaxRegime.GST, CreatedBy = "system" };
        var tax5 = await db.TaxSlabs.FirstOrDefaultAsync(t => t.Rate == 5, cancellationToken)
            ?? new TaxSlab { Id = Guid.NewGuid(), Name = "GST 5%", Rate = 5, TaxRegime = TaxRegime.GST, CreatedBy = "system" };
        var tax12 = await db.TaxSlabs.FirstOrDefaultAsync(t => t.Rate == 12, cancellationToken)
            ?? new TaxSlab { Id = Guid.NewGuid(), Name = "GST 12%", Rate = 12, TaxRegime = TaxRegime.GST, CreatedBy = "system" };
        var tax18 = await db.TaxSlabs.FirstOrDefaultAsync(t => t.Rate == 18, cancellationToken)
            ?? new TaxSlab { Id = Guid.NewGuid(), Name = "GST 18%", Rate = 18, TaxRegime = TaxRegime.GST, CreatedBy = "system" };

        if (db.Entry(tax0).State == EntityState.Detached) db.TaxSlabs.Add(tax0);
        if (db.Entry(tax5).State == EntityState.Detached) db.TaxSlabs.Add(tax5);
        if (db.Entry(tax12).State == EntityState.Detached) db.TaxSlabs.Add(tax12);
        if (db.Entry(tax18).State == EntityState.Detached) db.TaxSlabs.Add(tax18);
        await db.SaveChangesAsync(cancellationToken);

        // 1. Categories Definition
        var categoryDefs = new[]
        {
            ("Groceries & Staples", "Rice, pulses, flours, edible oils, and essential grains", "#10b981", CategoryType.Groceries),
            ("Dairy, Bread & Eggs", "Farm fresh milk, butter, cheese, artisan breads, and eggs", "#f59e0b", CategoryType.Groceries),
            ("Snacks & Branded Foods", "Biscuits, savory snacks, noodles, chocolates, and confectionery", "#ef4444", CategoryType.Groceries),
            ("Beverages & Drinks", "Premium tea, roast coffee, natural juices, and soft drinks", "#06b6d4", CategoryType.Groceries),
            ("Personal Care & Hygiene", "Bathing bars, luxury shampoos, oral care, and skincare", "#3b82f6", CategoryType.General),
            ("Pharmacy & Wellness", "OTC medicines, first aid, herbal wellness, and sanitizers", "#14b8a6", CategoryType.Pharmacy),
            ("Fresh Fruits & Vegetables", "Crisp local vegetables, seasonal fruits, and greens", "#84cc16", CategoryType.Groceries),
            ("Electronics & Mobiles", "Charging cables, high-speed adapters, power banks, and audio", "#8b5cf6", CategoryType.Electronics),
            ("Home & Cleaning", "Fabric wash, floor disinfectants, dish cleaners, and tissues", "#ec4899", CategoryType.HomeAndKitchen),
            ("Fashion & Apparel", "Casual t-shirts, cotton socks, innerwear, and lifestyle wear", "#6366f1", CategoryType.Fashion)
        };

        var catMap = new Dictionary<string, Category>(StringComparer.OrdinalIgnoreCase);
        int order = 1;
        foreach (var (name, desc, color, catType) in categoryDefs)
        {
            var existing = await db.Categories.FirstOrDefaultAsync(c => c.ShopId == shopId && c.Name == name, cancellationToken);
            if (existing == null)
            {
                existing = new Category
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    Name = name,
                    Description = desc,
                    ColorHex = color,
                    CategoryType = catType,
                    DisplayOrder = order++,
                    CreatedBy = "demo-seeder"
                };
                db.Categories.Add(existing);
            }
            catMap[name] = existing;
        }
        await db.SaveChangesAsync(cancellationToken);

        // 2. Showcase Products (35+ real items across categories)
        var productDefs = new[]
        {
            // Groceries & Staples
            ("Premium Basmati Rice 5kg", "GRO-BAS-5KG", "8901030383011", "Fortune", "Groceries & Staples", uomPack.Id, tax5.Id, 420m, 540m, 599m, "RACK-A1", true, 120m),
            ("Chakki Fresh Whole Wheat Atta 5kg", "GRO-ATTA-5KG", "8901030383028", "Aashirvaad", "Groceries & Staples", uomPack.Id, tax5.Id, 210m, 265m, 290m, "RACK-A2", true, 95m),
            ("Organic Toor Dal 1kg", "GRO-TOOR-1KG", "8901030383035", "Tata Sampann", "Groceries & Staples", uomPack.Id, tax0.Id, 125m, 160m, 180m, "RACK-A3", true, 150m),
            ("Refined Sunflower Oil 1L Pouch", "GRO-OIL-1L", "8901030383042", "Fortune", "Groceries & Staples", uomPack.Id, tax5.Id, 110m, 135m, 150m, "RACK-A4", true, 80m),
            ("Refined Pure Sugar 1kg", "GRO-SUG-1KG", "8901030383059", "Madhur", "Groceries & Staples", uomPack.Id, tax5.Id, 38m, 48m, 55m, "RACK-A5", true, 200m),
            ("Tata Salt Iodized 1kg", "GRO-SALT-1KG", "8901030383066", "Tata", "Groceries & Staples", uomPack.Id, tax0.Id, 18m, 25m, 28m, "RACK-A6", true, 250m),

            // Dairy, Bread & Eggs
            ("Amul Taaza Homogenised Milk 1L", "DAI-MILK-1L", "8901233014010", "Amul", "Dairy, Bread & Eggs", uomPack.Id, tax5.Id, 54m, 68m, 72m, "CHILL-01", true, 60m),
            ("Amul Pasteurised Butter 500g", "DAI-BUTTER-500", "8901233014027", "Amul", "Dairy, Bread & Eggs", uomPack.Id, tax12.Id, 215m, 275m, 285m, "CHILL-02", true, 75m),
            ("Harvest Gold White Bread 400g", "DAI-BREAD-400", "8901233014034", "Harvest Gold", "Dairy, Bread & Eggs", uomPack.Id, tax0.Id, 32m, 45m, 50m, "RACK-B1", true, 40m),
            ("Fresh Farm Eggs Pack of 6", "DAI-EGGS-6PK", "8901233014041", "Eggoz", "Dairy, Bread & Eggs", uomPack.Id, tax0.Id, 45m, 62m, 70m, "RACK-B2", true, 85m),
            ("Amul Malai Paneer 200g", "DAI-PANEER-200", "8901233014058", "Amul", "Dairy, Bread & Eggs", uomPack.Id, tax5.Id, 68m, 89m, 95m, "CHILL-03", true, 50m),

            // Snacks & Branded Foods
            ("Britannia Good Day Butter Biscuits 200g", "SNK-GD-200G", "8901058852019", "Britannia", "Snacks & Branded Foods", uomPack.Id, tax18.Id, 28m, 38m, 45m, "RACK-C1", true, 180m),
            ("Parle-G Gold Biscuits 1kg", "SNK-PARLEG-1KG", "8901058852026", "Parle", "Snacks & Branded Foods", uomPack.Id, tax18.Id, 95m, 120m, 130m, "RACK-C2", true, 110m),
            ("Lay's India's Magic Masala 50g", "SNK-LAYS-50G", "8901058852033", "Lays", "Snacks & Branded Foods", uomPack.Id, tax12.Id, 14m, 20m, 20m, "RACK-C3", true, 200m),
            ("Cadbury Dairy Milk Silk Chocolate 60g", "SNK-CAD-SILK", "8901058852040", "Cadbury", "Snacks & Branded Foods", uomPiece.Id, tax18.Id, 62m, 85m, 90m, "CHILL-04", true, 90m),
            ("Maggi 2-Minute Masala Noodles 280g", "SNK-MAGGI-4PK", "8901058852057", "Nestle", "Snacks & Branded Foods", uomPack.Id, tax12.Id, 42m, 56m, 60m, "RACK-C4", true, 140m),

            // Beverages & Drinks
            ("Tata Tea Gold Premium Blend 500g", "BEV-TEA-500G", "8901725181017", "Tata Tea", "Beverages & Drinks", uomPack.Id, tax5.Id, 240m, 310m, 340m, "RACK-D1", true, 70m),
            ("Nescafe Classic Instant Coffee 100g", "BEV-NES-100G", "8901725181024", "Nescafe", "Beverages & Drinks", uomPiece.Id, tax18.Id, 210m, 280m, 310m, "RACK-D2", true, 65m),
            ("Real Fruit Power Mixed Fruit 1L", "BEV-REAL-1L", "8901725181031", "Real", "Beverages & Drinks", uomPack.Id, tax12.Id, 85m, 115m, 130m, "RACK-D3", true, 80m),
            ("Coca-Cola Original Taste 750ml", "BEV-COKE-750", "8901725181048", "Coca Cola", "Beverages & Drinks", uomPiece.Id, tax18.Id, 28m, 40m, 40m, "CHILL-05", true, 100m),

            // Personal Care & Hygiene
            ("Dettol Original Antiseptic Soap 125g", "PC-DETT-125G", "8901138830018", "Dettol", "Personal Care & Hygiene", uomPiece.Id, tax18.Id, 38m, 52m, 60m, "RACK-E1", true, 150m),
            ("Colgate MaxFresh Spicy Fresh 150g", "PC-COLG-150G", "8901138830025", "Colgate", "Personal Care & Hygiene", uomPiece.Id, tax18.Id, 75m, 98m, 115m, "RACK-E2", true, 110m),
            ("Dove Intense Repair Shampoo 340ml", "PC-DOVE-340", "8901138830032", "Dove", "Personal Care & Hygiene", uomPiece.Id, tax18.Id, 220m, 299m, 340m, "RACK-E3", true, 55m),
            ("Nivea Soft Moisturising Cream 100ml", "PC-NIV-100ML", "8901138830049", "Nivea", "Personal Care & Hygiene", uomPiece.Id, tax18.Id, 135m, 185m, 210m, "RACK-E4", true, 60m),

            // Pharmacy & Wellness
            ("Dolo 650mg Paracetamol Tablets 15s", "MED-DOLO-650", "8901148810014", "Micro Labs", "Pharmacy & Wellness", uomPack.Id, tax12.Id, 22m, 32m, 35m, "PHARM-01", true, 200m),
            ("Dabur Honitus Herbal Cough Syrup 100ml", "MED-HONIT-100", "8901148810021", "Dabur", "Pharmacy & Wellness", uomPiece.Id, tax12.Id, 70m, 98m, 110m, "PHARM-02", true, 75m),
            ("Hansaplast Band-Aid Spot Care 20s", "MED-HANSA-20", "8901148810038", "Hansaplast", "Pharmacy & Wellness", uomPack.Id, tax12.Id, 45m, 65m, 75m, "PHARM-03", true, 120m),
            ("Zincovit Multivitamin & Minerals 15s", "MED-ZINCO-15", "8901148810045", "Apex", "Pharmacy & Wellness", uomPack.Id, tax12.Id, 78m, 112m, 125m, "PHARM-04", true, 90m),
            ("Dettol Instant Hand Sanitizer 200ml", "MED-DET-SANI", "8901148810052", "Dettol", "Pharmacy & Wellness", uomPiece.Id, tax18.Id, 65m, 90m, 100m, "PHARM-05", true, 80m),

            // Fresh Produce
            ("Fresh Shimla Apples 1kg", "FRT-APPL-1KG", "8901999001015", "FreshFarm", "Fresh Fruits & Vegetables", uomKg.Id, tax0.Id, 130m, 180m, 200m, "PROD-01", true, 50m),
            ("Robusta Fresh Bananas 1kg (6-7 pcs)", "FRT-BANA-1KG", "8901999001022", "FreshFarm", "Fresh Fruits & Vegetables", uomKg.Id, tax0.Id, 35m, 50m, 60m, "PROD-02", true, 70m),
            ("Red Nashik Onions 1kg", "VEG-ONION-1KG", "8901999001039", "FreshFarm", "Fresh Fruits & Vegetables", uomKg.Id, tax0.Id, 22m, 35m, 40m, "PROD-03", true, 150m),
            ("Pahadi Potatoes 1kg", "VEG-POT-1KG", "8901999001046", "FreshFarm", "Fresh Fruits & Vegetables", uomKg.Id, tax0.Id, 20m, 30m, 35m, "PROD-04", true, 150m),

            // Electronics & Mobiles
            ("Portronics 65W Fast USB-C Cable 1.2m", "ELE-CABLE-65W", "8904123401018", "Portronics", "Electronics & Mobiles", uomPiece.Id, tax18.Id, 140m, 249m, 399m, "TECH-01", true, 45m),
            ("Boat BassHeads 100 Wired Earphones", "ELE-BOAT-100", "8904123401025", "Boat", "Electronics & Mobiles", uomPiece.Id, tax18.Id, 220m, 399m, 599m, "TECH-02", true, 35m),
            ("Ambrane 10000mAh Power Bank Type-C", "ELE-AMB-10K", "8904123401032", "Ambrane", "Electronics & Mobiles", uomPiece.Id, tax18.Id, 650m, 999m, 1499m, "TECH-03", true, 25m),

            // Home & Cleaning
            ("Surf Excel Easy Wash Detergent 1kg", "HOM-SURF-1KG", "8901030991018", "Surf Excel", "Home & Cleaning", uomPack.Id, tax18.Id, 115m, 145m, 160m, "RACK-F1", true, 80m),
            ("Lizol Disinfectant Surface Cleaner Citrus 500ml", "HOM-LIZ-500", "8901030991025", "Lizol", "Home & Cleaning", uomPiece.Id, tax18.Id, 78m, 105m, 118m, "RACK-F2", true, 60m),
            ("Vim Lemon Dishwash Gel 500ml", "HOM-VIM-500", "8901030991032", "Vim", "Home & Cleaning", uomPiece.Id, tax18.Id, 85m, 115m, 130m, "RACK-F3", true, 70m),

            // Fashion & Apparel
            ("Men's Premium Cotton Crew T-Shirt (L)", "FAS-TSHIRT-L", "8905123411012", "Roadster", "Fashion & Apparel", uomPiece.Id, tax5.Id, 190m, 349m, 499m, "APPAR-01", true, 30m),
            ("Cotton Ankle Socks Pack of 3", "FAS-SOCKS-3PK", "8905123411029", "Jockey", "Fashion & Apparel", uomPack.Id, tax5.Id, 130m, 219m, 299m, "APPAR-02", true, 50m)
        };

        int productsAdded = 0;
        foreach (var def in productDefs)
        {
            var category = catMap[def.Item5];
            var prod = await db.Products.FirstOrDefaultAsync(p => p.ShopId == shopId && (p.Sku == def.Item2 || p.Barcode == def.Item3), cancellationToken);
            if (prod == null)
            {
                prod = new Product
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    Name = def.Item1,
                    Sku = def.Item2,
                    Barcode = def.Item3,
                    Brand = def.Item4,
                    CategoryId = category.Id,
                    UnitOfMeasureId = def.Item6,
                    TaxSlabId = def.Item7,
                    CostPrice = def.Item8,
                    SellingPrice = def.Item9,
                    Mrp = def.Item10,
                    RackLocation = def.Item11,
                    IsStockTracked = def.Item12,
                    MinSellingPrice = def.Item8,
                    LowStockThreshold = 10,
                    MaxStockThreshold = 500,
                    ReorderQuantity = 20,
                    IsActive = true,
                    CreatedBy = "demo-seeder"
                };
                db.Products.Add(prod);
                productsAdded++;

                // Add inventory stock
                var stock = new InventoryStock
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    ProductId = prod.Id,
                    QuantityOnHand = def.Item13,
                    QuantityReserved = 0,
                    ReorderLevel = 10,
                    LastMovementAt = DateTimeOffset.UtcNow,
                    CreatedBy = "demo-seeder"
                };
                db.InventoryStocks.Add(stock);
            }
            else
            {
                // Ensure stock exists
                var stock = await db.InventoryStocks.FirstOrDefaultAsync(s => s.ShopId == shopId && s.ProductId == prod.Id, cancellationToken);
                if (stock == null)
                {
                    db.InventoryStocks.Add(new InventoryStock
                    {
                        Id = Guid.NewGuid(),
                        ShopId = shopId,
                        ProductId = prod.Id,
                        QuantityOnHand = def.Item13,
                        QuantityReserved = 0,
                        ReorderLevel = 10,
                        LastMovementAt = DateTimeOffset.UtcNow,
                        CreatedBy = "demo-seeder"
                    });
                }
                else if (stock.QuantityOnHand < 10)
                {
                    stock.QuantityOnHand = def.Item13;
                }
            }
        }
        await db.SaveChangesAsync(cancellationToken);

        // 3. Showcase Customers
        var customerDefs = new[]
        {
            ("Rajesh Sharma", "9876543210", "rajesh.sharma@example.com", "Flat 402, Green Valley Apts, Mumbai", 180m),
            ("Priya Patel", "9823456789", "priya.patel@example.com", "12, Shanti Nagar, Ahmedabad", 420m),
            ("Amit Verma", "9712345678", "amit.verma@example.com", "Sector 14, DLF Phase 2, Gurugram", 95m),
            ("Sneha Reddy", "9654321098", "sneha.reddy@example.com", "Banjara Hills, Road No 10, Hyderabad", 260m),
            ("Vikram Singh", "9543210987", "vikram.singh@example.com", "4th Block, Koramangala, Bengaluru", 310m)
        };

        var custMap = new List<Customer>();
        foreach (var (cName, cPhone, cEmail, cAddr, cLoyalty) in customerDefs)
        {
            var cust = await db.Customers.FirstOrDefaultAsync(c => c.ShopId == shopId && c.Phone == cPhone, cancellationToken);
            if (cust == null)
            {
                cust = new Customer
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    Name = cName,
                    Phone = cPhone,
                    Email = cEmail,
                    BillingAddress = cAddr,
                    LoyaltyPoints = cLoyalty,
                    CreditLimit = 5000,
                    CreatedBy = "demo-seeder"
                };
                db.Customers.Add(cust);
            }
            custMap.Add(cust);
        }
        await db.SaveChangesAsync(cancellationToken);

        // 4. Showcase Suppliers
        var supplierDefs = new[]
        {
            ("Metro Wholesale FMCG Dist.", "Anand Joshi", "9123456780", "orders@metrowholesale.in", "27AABCM1234F1Z5", "Bhiwandi Logistics Hub, Mumbai"),
            ("Apex Health & Pharma Supply", "Dr. Sunita Rao", "9234567891", "supply@apexpharma.in", "27AACCA9876E1Z2", "MIDC Industrial Estate, Pune"),
            ("GreenField Agro & Farm Produce", "Mohan Lal", "9345678902", "contact@greenfieldagro.in", "27AABBF5432D1Z9", "Vashi APMC Market, Navi Mumbai"),
            ("Global Tech & Electronics Ltd", "Rohan Gupta", "9456789013", "sales@globaltechdist.in", "27AADEG7654C1Z1", "Lamington Road, Mumbai")
        };

        foreach (var (sName, sContact, sPhone, sEmail, sGst, sAddr) in supplierDefs)
        {
            var supp = await db.Suppliers.FirstOrDefaultAsync(s => s.ShopId == shopId && s.Name == sName, cancellationToken);
            if (supp == null)
            {
                supp = new Supplier
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    Name = sName,
                    ContactPerson = sContact,
                    Phone = sPhone,
                    Email = sEmail,
                    TaxRegistrationNumber = sGst,
                    Address = sAddr,
                    CreditDays = 30,
                    CreatedBy = "demo-seeder"
                };
                db.Suppliers.Add(supp);
            }
        }
        await db.SaveChangesAsync(cancellationToken);

        // 5. Sample Completed Invoices for Bill History Showcase
        var existingInvoicesCount = await db.SalesInvoices.CountAsync(i => i.ShopId == shopId, cancellationToken);
        if (existingInvoicesCount < 3)
        {
            var allProds = await db.Products.Where(p => p.ShopId == shopId).Take(12).ToListAsync(cancellationToken);
            if (allProds.Count >= 4)
            {
                var now = DateTimeOffset.UtcNow;
                var sampleBills = new[]
                {
                    (custMap[0], PaymentMethod.UPI, now.AddHours(-1), 1),
                    (custMap[1], PaymentMethod.Cash, now.AddHours(-4), 2),
                    (custMap[2], PaymentMethod.Card, now.AddDays(-1).AddHours(2), 3),
                    (custMap[3], PaymentMethod.UPI, now.AddDays(-2), 4),
                    (custMap[4], PaymentMethod.Split, now.AddDays(-3), 5)
                };

                int billSeq = 1001;
                foreach (var (cust, payMethod, billDate, seedIdx) in sampleBills)
                {
                    var p1 = allProds[(seedIdx * 2) % allProds.Count];
                    var p2 = allProds[(seedIdx * 2 + 1) % allProds.Count];

                    var item1Sub = p1.SellingPrice * 2;
                    var item2Sub = p2.SellingPrice * 1;
                    var total = item1Sub + item2Sub;

                    var invoice = new SalesInvoice
                    {
                        Id = Guid.NewGuid(),
                        ShopId = shopId,
                        CustomerId = cust.Id,
                        InvoiceNumber = $"INV-{billDate:yyyyMMdd}-{billSeq++:D4}",
                        InvoiceDate = billDate,
                        Status = SalesInvoiceStatus.Confirmed,
                        PaymentStatus = PaymentStatus.Paid,
                        SubTotal = total,
                        DiscountTotal = 0,
                        TaxableAmount = total * 0.95m,
                        TaxTotal = total * 0.05m,
                        GrandTotal = total,
                        Notes = "Demonstration Showcase Bill",
                        CreatedBy = "demo-seeder",
                        CreatedAt = billDate
                    };

                    invoice.Items.Add(new SalesInvoiceItem
                    {
                        Id = Guid.NewGuid(),
                        SalesInvoiceId = invoice.Id,
                        ProductId = p1.Id,
                        Description = p1.Name,
                        Quantity = 2,
                        UnitPrice = p1.SellingPrice,
                        LineTotal = item1Sub,
                        TaxRate = 5,
                        TaxAmount = item1Sub * 0.05m,
                        CreatedBy = "demo-seeder",
                        CreatedAt = billDate
                    });

                    invoice.Items.Add(new SalesInvoiceItem
                    {
                        Id = Guid.NewGuid(),
                        SalesInvoiceId = invoice.Id,
                        ProductId = p2.Id,
                        Description = p2.Name,
                        Quantity = 1,
                        UnitPrice = p2.SellingPrice,
                        LineTotal = item2Sub,
                        TaxRate = 5,
                        TaxAmount = item2Sub * 0.05m,
                        CreatedBy = "demo-seeder",
                        CreatedAt = billDate
                    });

                    invoice.Payments.Add(new Payment
                    {
                        Id = Guid.NewGuid(),
                        ShopId = shopId,
                        SalesInvoiceId = invoice.Id,
                        Method = payMethod,
                        Amount = total,
                        ReferenceNumber = payMethod == PaymentMethod.UPI ? "UPI/DEMO/982348" : payMethod == PaymentMethod.Card ? "CARD/DEMO/4421" : null,
                        PaidAt = billDate,
                        CreatedBy = "demo-seeder",
                        CreatedAt = billDate
                    });

                    db.SalesInvoices.Add(invoice);
                }
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        logger?.LogInformation("Demo Showcase Seeding finished successfully. Added {Count} new products.", productsAdded);
        return productsAdded;
    }
}
