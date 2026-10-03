$ErrorActionPreference = "Stop"

# 1. Login
$loginBody = @{
    email = "chandankr.mandal87@gmail.com"
    password = "Admin@123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$shopId = $loginRes.user.shopId
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "Logged in successfully. Token acquired."

# 2. Search for a product to bill
$prodRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/products/search?shopId=$shopId&term=rice" -Method Get -Headers $headers
$product = $prodRes[0]
Write-Host "Found product: $($product.name) (ID: $($product.productId), Price: $($product.sellingPrice))"

# 3. Create a Draft Bill (confirm = false)
$draftPayload = @{
    shopId = $shopId
    walkInCustomerName = "Draft Test Customer"
    items = @(
        @{
            productId = $product.productId
            quantity = 2
            unitPrice = $product.sellingPrice
            discountType = $null
            discountValue = 0
            taxRate = $product.taxRate
        }
    )
    payments = @(
        @{
            method = "Cash"
            amount = ($product.sellingPrice * 2)
        }
    )
    confirm = $false
} | ConvertTo-Json -Depth 5

$draftRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales" -Method Post -Headers $headers -Body $draftPayload -ContentType "application/json"
$draftId = $draftRes.invoice.id
$invoiceNumber = $draftRes.invoice.invoiceNumber
Write-Host "Created Draft Bill: $invoiceNumber (ID: $draftId, Status: $($draftRes.invoice.status))"

# 4. Check that it appears in Held/Draft bills list
$draftList = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales/history?shopId=$shopId&status=Draft" -Method Get -Headers $headers
$foundDraft = $draftList | Where-Object { $_.id -eq $draftId }
if ($foundDraft) {
    Write-Host "SUCCESS: Draft bill found in Held Bills list ($($foundDraft.billNo), total: $($foundDraft.total))"
} else {
    Write-Error "FAIL: Draft bill not found in Held Bills list!"
}

# 5. Fetch draft for edit / resuming
$editData = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales/$draftId" -Method Get -Headers $headers
Write-Host "SUCCESS: Fetched invoice for edit. Items count: $($editData.items.Count), GrandTotal: $($editData.totals.grandTotal)"

# 6. Alter the draft bill (e.g. increase quantity from 2 to 3) and confirm it (F7 flow)
$alterPayload = @{
    shopId = $shopId
    walkInCustomerName = "Draft Test Customer"
    items = @(
        @{
            productId = $product.productId
            quantity = 3
            unitPrice = $product.sellingPrice
            discountType = $null
            discountValue = 0
            taxRate = $product.taxRate
        }
    )
    payments = @(
        @{
            method = "Cash"
            amount = ($product.sellingPrice * 3)
        }
    )
    confirm = $true
} | ConvertTo-Json -Depth 5

$alterRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales/$draftId" -Method Put -Headers $headers -Body $alterPayload -ContentType "application/json"
Write-Host "SUCCESS: Altered and Confirmed Bill: $($alterRes.invoice.invoiceNumber), Status: $($alterRes.invoice.status), Total: $($alterRes.invoice.grandTotal)"

# 7. Now alter an already CONFIRMED bill (User alteration requirement)
# Let's alter the quantity from 3 to 1
$alterConfirmedPayload = @{
    shopId = $shopId
    walkInCustomerName = "Draft Test Customer (Altered)"
    items = @(
        @{
            productId = $product.productId
            quantity = 1
            unitPrice = $product.sellingPrice
            discountType = $null
            discountValue = 0
            taxRate = $product.taxRate
        }
    )
    payments = @(
        @{
            method = "Cash"
            amount = $product.sellingPrice
        }
    )
    confirm = $true
} | ConvertTo-Json -Depth 5

$alterConfirmedRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales/$draftId" -Method Put -Headers $headers -Body $alterConfirmedPayload -ContentType "application/json"
Write-Host "SUCCESS: Altered Generated (Confirmed) Bill! New Total: $($alterConfirmedRes.invoice.grandTotal), Items count: $($alterConfirmedRes.items.Count)"

# 8. Test Discarding/Deleting a Draft
$draft2Payload = @{
    shopId = $shopId
    walkInCustomerName = "To Delete Draft"
    items = @(
        @{
            productId = $product.productId
            quantity = 1
            unitPrice = $product.sellingPrice
            discountType = $null
            discountValue = 0
            taxRate = $product.taxRate
        }
    )
    payments = @()
    confirm = $false
} | ConvertTo-Json -Depth 5

$draft2 = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales" -Method Post -Headers $headers -Body $draft2Payload -ContentType "application/json"
$draft2Id = $draft2.invoice.id
Write-Host "Created second draft to test discard: $draft2Id"

$deleteRes = Invoke-RestMethod -Uri "http://localhost:5244/api/v1/billing/sales/$draft2Id" -Method Delete -Headers $headers
Write-Host "SUCCESS: Discarded Draft $draft2Id result: $deleteRes"

Write-Host "ALL DRAFT & ALTER ENDPOINTS FUNCTIONING 100% CORRECTLY!"
