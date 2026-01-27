# Open Greece API - Quick Test Script
# This script tests the API connectivity using PowerShell

Write-Host "Open Greece API - Connection Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# API Configuration
$pullEndpoint = "https://online.open-greece.com/nsCallWebServices/handlerequest.aspx"
$pushEndpoint = "https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx"
$username = "olympictravel"
$password = "olympic2025!"

# Create Basic Auth header
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username, $password)))
$headers = @{
    "Authorization" = "Basic $base64AuthInfo"
    "Content-Type"  = "text/xml; charset=utf-8"
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Pull Endpoint: $pullEndpoint"
Write-Host "  Push Endpoint: $pushEndpoint"
Write-Host "  Username: $username"
Write-Host ""

# Test 1: Basic connectivity test (HEAD request)
Write-Host "Test 1: Basic Connectivity Test" -ForegroundColor Green
Write-Host "-----------------------------------"
try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method HEAD -Headers $headers -ErrorAction Stop
    Write-Host "SUCCESS: Server is reachable!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host "   Status Description: $($response.StatusDescription)"
}
catch {
    Write-Host "Server response: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   This might be OK - some servers don't support HEAD requests" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Simple XML request (Pull API)
Write-Host "Test 2: XML Request Test (Pull API)" -ForegroundColor Green
Write-Host "---------------------------------------"

# Basic XML request - we're guessing the structure since we don't have docs
$xmlRequest = @"
<?xml version="1.0" encoding="UTF-8"?>
<Request>
    <Authentication>
        <Username>$username</Username>
        <Password>$password</Password>
    </Authentication>
    <Method>GetHotels</Method>
</Request>
"@

Write-Host "Sending XML Request:"
Write-Host $xmlRequest -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method POST -Headers $headers -Body $xmlRequest -ErrorAction Stop
    Write-Host "SUCCESS: Got response from server!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    # Save response to file
    $response.Content | Out-File -FilePath "opengreece-response-test2.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-response-test2.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        # Save error response
        $responseBody | Out-File -FilePath "opengreece-error-test2.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-error-test2.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Alternative XML structure (in case first one was wrong)
Write-Host "Test 3: Alternative XML Structure" -ForegroundColor Green
Write-Host "-------------------------------------"

$xmlRequest2 = @"
<?xml version="1.0" encoding="UTF-8"?>
<nsHubRequest>
    <Credentials>
        <UserName>$username</UserName>
        <Password>$password</Password>
    </Credentials>
    <RequestType>StaticData</RequestType>
</nsHubRequest>
"@

Write-Host "Sending Alternative XML Request:"
Write-Host $xmlRequest2 -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method POST -Headers $headers -Body $xmlRequest2 -ErrorAction Stop
    Write-Host "SUCCESS: Got response from server!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    # Save response to file
    $response.Content | Out-File -FilePath "opengreece-response-test3.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-response-test3.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        # Save error response
        $responseBody | Out-File -FilePath "opengreece-error-test3.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-error-test3.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Push API Test (Delta - Safe)
Write-Host "Test 4: Push API Test (Delta Mode)" -ForegroundColor Green
Write-Host "--------------------------------------"

$xmlPushRequest = @"
<?xml version="1.0" encoding="UTF-8"?>
<StartPushProcessRQ IsFullPush="false">
    <Authentication>
        <Username>$username</Username>
        <Password>$password</Password>
    </Authentication>
</StartPushProcessRQ>
"@

Write-Host "Sending Push Request (Delta):"
Write-Host $xmlPushRequest -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pushEndpoint -Method POST -Headers $headers -Body $xmlPushRequest -ErrorAction Stop
    Write-Host "SUCCESS: Got response from Push API!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    # Save response to file
    $response.Content | Out-File -FilePath "opengreece-response-push.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-response-push.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        # Save error response
        $responseBody | Out-File -FilePath "opengreece-error-push.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-error-push.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check the XML response files to understand the API structure"
Write-Host "  2. If you got error responses, they might contain hints about correct XML format"
Write-Host "  3. Contact NetSemantics support for official documentation"
Write-Host "  4. Once we understand the structure, we can build proper integration"
Write-Host ""
