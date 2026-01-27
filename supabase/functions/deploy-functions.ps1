# Supabase Edge Functions Deployment Script (PowerShell)
# Usage: .\deploy-functions.ps1 [function-name]

param(
    [string]$FunctionName = ""
)

Write-Host "🚀 Olympic Hub - Email Functions Deployment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "📦 Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = supabase projects list 2>&1
} catch {
    Write-Host "❌ Not logged in to Supabase" -ForegroundColor Red
    Write-Host "🔐 Login with: supabase login" -ForegroundColor Yellow
    exit 1
}

# Function to deploy a single function
function Deploy-Function {
    param([string]$Name)
    
    Write-Host ""
    Write-Host "📤 Deploying $Name..." -ForegroundColor Yellow
    
    try {
        supabase functions deploy $Name
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Name deployed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to deploy $Name" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Failed to deploy $Name : $_" -ForegroundColor Red
        return $false
    }
}

# If specific function is provided, deploy only that
if ($FunctionName -ne "") {
    $success = Deploy-Function -Name $FunctionName
    Write-Host ""
    if ($success) {
        Write-Host "✨ Deployment complete!" -ForegroundColor Green
        exit 0
    } else {
        exit 1
    }
}

# Otherwise, deploy all email functions
Write-Host ""
Write-Host "📋 Deploying all email functions..." -ForegroundColor Cyan

$functions = @(
    "send-email",
    "fetch-emails",
    "test-email-connection"
)

$failed = @()

foreach ($func in $functions) {
    $success = Deploy-Function -Name $func
    if (-not $success) {
        $failed += $func
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan

if ($failed.Count -eq 0) {
    Write-Host "✅ All functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test functions with: supabase functions logs <function-name>"
    Write-Host "   2. Configure email accounts in Olympic Hub"
    Write-Host "   3. Send your first email!"
} else {
    Write-Host "⚠️  Some functions failed to deploy:" -ForegroundColor Yellow
    foreach ($func in $failed) {
        Write-Host "   - $func" -ForegroundColor Red
    }
    exit 1
}
