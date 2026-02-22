# ============================================================================
# SETUP SERVICE_ROLE_KEY - Automated Supabase Credential Manager
# ============================================================================
# This script helps you get SERVICE_ROLE_KEY from Supabase and save it safely

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔐 SUPABASE SERVICE ROLE KEY SETUP                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env.server exists
$envServerPath = ".env.server"
if (-not (Test-Path $envServerPath)) {
    Write-Host "❌ ERROR: .env.server file not found!" -ForegroundColor Red
    Write-Host "   Expected: $(Get-Location)\.env.server" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 1: RETRIEVE SERVICE_ROLE_KEY from Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Open your browser and navigate to:" -ForegroundColor White
Write-Host "   🔗 https://app.supabase.com/project/fzupyhunlucpjaaxksoi/settings/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  Find the section labeled:" -ForegroundColor White
Write-Host "   📌 'Service role secret' or 'service_role secret'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣  Click the 'Reveal' button (eye icon)" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Copy the entire secret key (it starts with 'eyJ...')" -ForegroundColor White
Write-Host ""

# Prompt user for the key
$serviceRoleKey = Read-Host "5️⃣  Paste your SERVICE_ROLE_KEY here"

# Validate the key
if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "❌ ERROR: No key provided!" -ForegroundColor Red
    exit 1
}

if (-not $serviceRoleKey.StartsWith("eyJ")) {
    Write-Host "⚠️  WARNING: Key doesn't start with 'eyJ' (expected JWT format)" -ForegroundColor Yellow
    Write-Host "   Your key: $($serviceRoleKey.Substring(0, 20))..." -ForegroundColor Yellow
    $confirm = Read-Host "   Continue anyway? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Key received. Length: $($serviceRoleKey.Length) characters" -ForegroundColor Green
Write-Host ""

# Update .env.server
Write-Host "📝 Updating .env.server..." -ForegroundColor Yellow

$envContent = Get-Content $envServerPath -Raw

# Replace the placeholder
$updatedContent = $envContent -replace `
    'SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER_SERVICE_ROLE_KEY', `
    "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"

# Check if replacement was successful
if ($updatedContent -eq $envContent) {
    Write-Host "⚠️  WARNING: No changes made. Check placeholder format." -ForegroundColor Yellow
    Write-Host "   Looking for: SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER_SERVICE_ROLE_KEY" -ForegroundColor Yellow
}

Set-Content -Path $envServerPath -Value $updatedContent

Write-Host "✅ .env.server updated successfully!" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "🔍 Verification:" -ForegroundColor Cyan
$newContent = Get-Content $envServerPath
$keyLine = $newContent | Where-Object { $_ -match "SUPABASE_SERVICE_ROLE_KEY=" } | Select-Object -First 1

if ($null -ne $keyLine -and $keyLine -match "eyJ") {
    Write-Host "   ✅ SERVICE_ROLE_KEY is set" -ForegroundColor Green
    Write-Host "   ✅ Key starts with: $($keyLine.Substring(0, 40))..." -ForegroundColor Green
} else {
    Write-Host "   ❌ SERVICE_ROLE_KEY not found or invalid" -ForegroundColor Red
}

# Set file permissions (read-only for owner on Windows)
Write-Host ""
Write-Host "🔒 Setting file permissions..." -ForegroundColor Yellow
$acl = Get-Acl $envServerPath
$acl.SetAccessRuleProtection($true, $false)
Set-Acl -Path $envServerPath -AclObject $acl
Write-Host "   ✅ File permissions updated" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ SETUP COMPLETE - Ready to download hotels!             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run the download script" -ForegroundColor Cyan
Write-Host "   node download_hotel_content.cjs" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  SECURITY REMINDER:" -ForegroundColor Yellow
Write-Host "   - NEVER share this .env.server file" -ForegroundColor Gray
Write-Host "   - NEVER commit .env.server to Git" -ForegroundColor Gray
Write-Host "   - NEVER share SERVICE_ROLE_KEY on Slack or email" -ForegroundColor Gray
Write-Host ""
