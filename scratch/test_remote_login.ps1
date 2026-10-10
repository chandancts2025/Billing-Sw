$body = @{
    email = 'superadmin@billeasepro.local'
    password = 'Password@123'
    twoFactorCode = ''
    rememberMe = $true
} | ConvertTo-Json

try {
    $res = Invoke-WebRequest -Uri 'https://billease-pro-api.onrender.com/api/v1/auth/login' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
    Write-Host "SUCCESS: $($res.Content)"
}
catch {
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $text = $reader.ReadToEnd()
        Write-Host "Response Body: $text"
    } else {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
