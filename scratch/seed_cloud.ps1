$loginBody = @{
    email = 'superadmin@billeasepro.local'
    password = 'Password@123'
    rememberMe = $true
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Logged in. Access token received."

$headers = @{
    Authorization = "Bearer $($login.accessToken)"
}

try {
    $seed = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/system/seed-demo' -Method Post -Headers $headers
    Write-Host "Seed result:" ($seed | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Seed error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response body: $($reader.ReadToEnd())"
    }
}

# Also verify product count on Cloud
try {
    $prod = Invoke-RestMethod -Uri 'https://billease-pro-api.onrender.com/api/v1/products?page=1&pageSize=50' -Method Get -Headers $headers
    Write-Host "Cloud Products Count: $($prod.totalCount)"
} catch {
    Write-Host "Products fetch error: $($_.Exception.Message)"
}
