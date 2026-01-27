# Deploy TCT Proxy Edge Function

Write-Host "🚀 Deploying TCT Proxy Edge Function..." -ForegroundColor Cyan

# 1. Check if Supabase CLI is installed
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI is not installed!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# 2. Check if logged in
Write-Host "Checking Supabase login status..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1

if ($loginStatus -like "*not logged in*") {
    Write-Host "❌ Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Login with: supabase login" -ForegroundColor Yellow
    exit 1
}

# 3. Deploy function
Write-Host "Deploying tct-proxy function..." -ForegroundColor Yellow
supabase functions deploy tct-proxy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    
    # 4. Set environment variables
    Write-Host "`nSetting environment variables..." -ForegroundColor Yellow
    Write-Host "⚠️  You need to set these secrets manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "supabase secrets set TCT_USERNAME=your-tct-username" -ForegroundColor Cyan
    Write-Host "supabase secrets set TCT_PASSWORD=your-tct-password" -ForegroundColor Cyan
    Write-Host "supabase secrets set TCT_API_SOURCE=B2B" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Note: These credentials will be ONLY on the server!" -ForegroundColor Green
    Write-Host "📝 Frontend will NEVER see them!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Done!" -ForegroundColor Green
