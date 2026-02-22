# TCT API Credentials Setup Script
# This script adds TCT API credentials to your .env file

Write-Host "Olympic Hub - TCT API Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Done!" -ForegroundColor Green
}

# Read current .env content
$envContent = Get-Content ".env" -Raw

# TCT Credentials
$tctUrl = "https://imc-dev.tct.travel"
$tctUsername = "nenad.tomic@olympic.rs"
$tctPassword = "689b54e328f3e759abfdced76ad8e8d0"
$tctApiSource = "B2B"

# Check if TCT credentials already exist
if ($envContent -match "VITE_TCT_API_URL") {
    Write-Host "TCT credentials already exist in .env file" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update them? (y/n)"
    if ($response -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
    
    # Remove old TCT credentials
    $envContent = $envContent -replace "VITE_TCT_API_URL=.*`r?`n", ""
    $envContent = $envContent -replace "VITE_TCT_USERNAME=.*`r?`n", ""
    $envContent = $envContent -replace "VITE_TCT_PASSWORD=.*`r?`n", ""
    $envContent = $envContent -replace "VITE_TCT_API_SOURCE=.*`r?`n", ""
}

# Add TCT credentials
$tctConfig = "`r`n# TCT API Configuration (Travel Connection Technology)`r`nVITE_TCT_API_URL=$tctUrl`r`nVITE_TCT_USERNAME=$tctUsername`r`nVITE_TCT_PASSWORD=$tctPassword`r`nVITE_TCT_API_SOURCE=$tctApiSource`r`n"

$envContent = $envContent.TrimEnd() + $tctConfig

# Save to .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "SUCCESS! TCT API credentials added!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  API URL: $tctUrl" -ForegroundColor White
Write-Host "  Username: $tctUsername" -ForegroundColor White
Write-Host "  Password: ********** (hidden)" -ForegroundColor White
Write-Host "  API Source: $tctApiSource" -ForegroundColor White
Write-Host ""
Write-Host "Security Note:" -ForegroundColor Yellow
Write-Host "  Your .env file is protected by .gitignore" -ForegroundColor White
Write-Host "  Credentials will NOT be pushed to GitHub" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Test TCT connection in the app" -ForegroundColor White
Write-Host ""
