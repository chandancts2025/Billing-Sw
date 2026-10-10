param (
    [string]$baseUrl = 'https://billease-pro-api.onrender.com'
)

$loginBody = @{
    email = 'superadmin@billeasepro.local'
    password = 'Password@123'
    rememberMe = $true
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
    Write-Host "Target: $baseUrl"
    Write-Host "Authenticated as: $($loginRes.user.fullName) ($($loginRes.user.role))"
    
    $headers = @{
        'Authorization' = "Bearer $($loginRes.accessToken)"
    }
    
    $shopId = $loginRes.user.shopId
    $products = Invoke-RestMethod -Uri "$baseUrl/api/v1/inventory/products?shopId=$shopId" -Headers $headers
    Write-Host "Products in DB: $($products.Count)"
    foreach ($p in $products) {
        Write-Host " - [$($p.sku)] $($p.name) (Price: Rs. $($p.sellingPrice))"
    }

    $categories = Invoke-RestMethod -Uri "$baseUrl/api/v1/categories" -Headers $headers
    Write-Host "Categories in DB: $($categories.items.Count)"

    Write-Host "`nALL SYSTEMS OPERATIONAL!"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "Details: $($reader.ReadToEnd())"
        }
    }
}
