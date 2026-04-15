# PowerShell script to update .env.local file
$envPath = Join-Path $PSScriptRoot ".env.local"

$content = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Key
ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

try {
    Set-Content -Path $envPath -Value $content -Force
    Write-Host "✅ .env.local file updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Don't forget to add your Service Role Key:" -ForegroundColor Yellow
    Write-Host "   1. Go to Supabase Dashboard → Settings → API"
    Write-Host "   2. Copy the service_role key"
    Write-Host "   3. Replace 'your_service_role_key_here' in .env.local"
} catch {
    Write-Host "❌ Failed to update .env.local: $_" -ForegroundColor Red
}

Read-Host "Press Enter to continue"


