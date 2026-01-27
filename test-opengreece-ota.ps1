# Open Greece API - OTA Format Test
# Testing with proper OTA XML structure

Write-Host "Open Greece API - OTA Format Test" -ForegroundColor Cyan
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

# Test 1: OTA_HotelSearchRQ (Hotel Search Request)
Write-Host "Test 1: OTA_HotelSearchRQ (Hotel Search)" -ForegroundColor Green
Write-Host "-------------------------------------------"

$otaHotelSearchRQ = @"
<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelSearchRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
                   EchoToken="1" 
                   TimeStamp="$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')" 
                   Version="1.0">
  <POS>
    <Source>
      <RequestorID Type="1" ID="$username" MessagePassword="$password"/>
    </Source>
  </POS>
  <Criteria>
    <Criterion>
      <HotelRef HotelCode="*"/>
    </Criterion>
  </Criteria>
</OTA_HotelSearchRQ>
"@

Write-Host "Sending OTA_HotelSearchRQ:"
Write-Host $otaHotelSearchRQ -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method POST -Headers $headers -Body $otaHotelSearchRQ -UseBasicParsing -ErrorAction Stop
    Write-Host "SUCCESS: Got response!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    $response.Content | Out-File -FilePath "opengreece-OTA_HotelSearchRQ.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-OTA_HotelSearchRQ.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        $responseBody | Out-File -FilePath "opengreece-OTA_HotelSearchRQ-error.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-OTA_HotelSearchRQ-error.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 2: OTA_HotelDescriptiveInfoRQ (Hotel Details Request)
Write-Host "Test 2: OTA_HotelDescriptiveInfoRQ (Hotel Details)" -ForegroundColor Green
Write-Host "----------------------------------------------------"

$otaHotelDescriptiveInfoRQ = @"
<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelDescriptiveInfoRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
                            EchoToken="2" 
                            TimeStamp="$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')" 
                            Version="1.0">
  <POS>
    <Source>
      <RequestorID Type="1" ID="$username" MessagePassword="$password"/>
    </Source>
  </POS>
  <HotelDescriptiveInfos>
    <HotelDescriptiveInfo HotelCode="*"/>
  </HotelDescriptiveInfos>
</OTA_HotelDescriptiveInfoRQ>
"@

Write-Host "Sending OTA_HotelDescriptiveInfoRQ:"
Write-Host $otaHotelDescriptiveInfoRQ -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method POST -Headers $headers -Body $otaHotelDescriptiveInfoRQ -UseBasicParsing -ErrorAction Stop
    Write-Host "SUCCESS: Got response!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    $response.Content | Out-File -FilePath "opengreece-OTA_HotelDescriptiveInfoRQ.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-OTA_HotelDescriptiveInfoRQ.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        $responseBody | Out-File -FilePath "opengreece-OTA_HotelDescriptiveInfoRQ-error.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-OTA_HotelDescriptiveInfoRQ-error.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: OTA_HotelAvailRQ (Availability Request)
Write-Host "Test 3: OTA_HotelAvailRQ (Availability)" -ForegroundColor Green
Write-Host "----------------------------------------"

$checkIn = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$checkOut = (Get-Date).AddDays(37).ToString("yyyy-MM-dd")

$otaHotelAvailRQ = @"
<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
                  EchoToken="3" 
                  TimeStamp="$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')" 
                  Version="1.0">
  <POS>
    <Source>
      <RequestorID Type="1" ID="$username" MessagePassword="$password"/>
    </Source>
  </POS>
  <AvailRequestSegments>
    <AvailRequestSegment>
      <StayDateRange Start="$checkIn" End="$checkOut"/>
      <RoomStayCandidates>
        <RoomStayCandidate>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="2"/>
          </GuestCounts>
        </RoomStayCandidate>
      </RoomStayCandidates>
    </AvailRequestSegment>
  </AvailRequestSegments>
</OTA_HotelAvailRQ>
"@

Write-Host "Sending OTA_HotelAvailRQ:"
Write-Host $otaHotelAvailRQ -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pullEndpoint -Method POST -Headers $headers -Body $otaHotelAvailRQ -UseBasicParsing -ErrorAction Stop
    Write-Host "SUCCESS: Got response!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    $response.Content | Out-File -FilePath "opengreece-OTA_HotelAvailRQ.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-OTA_HotelAvailRQ.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        $responseBody | Out-File -FilePath "opengreece-OTA_HotelAvailRQ-error.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-OTA_HotelAvailRQ-error.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: StartPushProcessRQ with OTA-style authentication
Write-Host "Test 4: StartPushProcessRQ (Delta - OTA Auth)" -ForegroundColor Green
Write-Host "-----------------------------------------------"

$startPushProcessRQ = @"
<?xml version="1.0" encoding="UTF-8"?>
<StartPushProcessRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
                    IsFullPush="false"
                    EchoToken="4" 
                    TimeStamp="$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')" 
                    Version="1.0">
  <POS>
    <Source>
      <RequestorID Type="1" ID="$username" MessagePassword="$password"/>
    </Source>
  </POS>
</StartPushProcessRQ>
"@

Write-Host "Sending StartPushProcessRQ (with POS):"
Write-Host $startPushProcessRQ -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $pushEndpoint -Method POST -Headers $headers -Body $startPushProcessRQ -UseBasicParsing -ErrorAction Stop
    Write-Host "SUCCESS: Got response!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    
    $response.Content | Out-File -FilePath "opengreece-StartPushProcessRQ-OTA.xml" -Encoding UTF8
    Write-Host "Response saved to: opengreece-StartPushProcessRQ-OTA.xml" -ForegroundColor Yellow
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        $responseBody | Out-File -FilePath "opengreece-StartPushProcessRQ-OTA-error.xml" -Encoding UTF8
        Write-Host "Error response saved to: opengreece-StartPushProcessRQ-OTA-error.xml" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All OTA tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check the XML response files"
Write-Host "  2. Analyze successful responses to understand data structure"
Write-Host "  3. Build proper TypeScript integration based on working examples"
Write-Host ""
