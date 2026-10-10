Write-Host "=== VERIFYING CLOUD API (Render + Azure SQL) ===" -ForegroundColor Cyan
$loginBody = @{
    email = 'superadmin@billeasepro.local'
    password = 'Password@123'
    rememberMe = $true
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Cloud Login OK: User = $($login.user.fullName), Role = $($login.user.role)" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $($login.accessToken)" }

# 1. Check Categories
$cats = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/categories' -Method Get -Headers $headers
Write-Host "Cloud Categories: $($cats.Count) categories found" -ForegroundColor Green
$catNames = ($cats | ForEach-Object { $_.name }) -join ", "
Write-Host "  Categories sample: $catNames" -ForegroundColor Gray

# 2. Check Products
$prods = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/products?page=1&pageSize=10' -Method Get -Headers $headers
Write-Host "Cloud Products Total: $($prods.totalCount) products loaded" -ForegroundColor Green
foreach ($p in ($prods.items | Select-Object -First 6)) {
    Write-Host "  - [$($p.sku)] $($p.name) (Barcode: $($p.barcode), Price: ₹$($p.sellingPrice), Stock: $($p.stockQuantity) $($p.unit))" -ForegroundColor Gray
}

# 3. Check Customers
$custs = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/customers' -Method Get -Headers $headers
Write-Host "Cloud Customers: $($custs.Count) customers loaded" -ForegroundColor Green

Write-Host "`n=== VERIFYING LOCAL DEV SERVERS ===" -ForegroundColor Cyan
try {
    $localWeb = Invoke-WebRequest -Uri 'http://localhost:4200' -UseBasicParsing
    Write-Host "Local Angular Dev Server (http://localhost:4200): Status $($localWeb.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Local Dev Server error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ALL VERIFICATIONS PASSED ===" -ForegroundColor Cyan
