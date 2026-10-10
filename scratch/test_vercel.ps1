$chunk = (Invoke-WebRequest -Uri 'https://billing-sw.vercel.app/chunk-ORT34B7Q.js' -UseBasicParsing).Content
if ($chunk.Contains("localhost:5244")) {
    Write-Host "Chunk has: localhost:5244" -ForegroundColor Yellow
}
if ($chunk.Contains("billease-pro-api.onrender.com")) {
    Write-Host "Chunk has: billease-pro-api.onrender.com" -ForegroundColor Green
}
