$body = @{
    email = "superadmin@billeasepro.local"
    password = "Password@123"
    rememberMe = $true
} | ConvertTo-Json

try {
    Write-Host "Sending login request to https://billease-pro-api.onrender.com/api/v1/auth/login ..."
    $response = Invoke-RestMethod -Method Post -Uri "https://billease-pro-api.onrender.com/api/v1/auth/login" -ContentType "application/json" -Body $body
    Write-Host "SUCCESS! Logged in to Live Render API:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "FAILED with error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errBody = $reader.ReadToEnd()
        Write-Host "Response Body: $errBody" -ForegroundColor Yellow
    }
}
