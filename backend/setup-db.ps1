# ─── AssetFlow Database Setup Script ─────────────────────────────────────────
# Run this after PostgreSQL is installed.
# It creates the 'admin' user, 'assetflow' database, runs Prisma migrations, and seeds.

$ErrorActionPreference = "Continue"

Write-Host "`n🔧 AssetFlow Database Setup" -ForegroundColor Cyan
Write-Host "──────────────────────────────`n"

# ─── 1. Find PostgreSQL binaries ────────────────────────────────────────────
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin"
)

$pgBin = $null
foreach ($p in $pgPaths) {
    if (Test-Path "$p\psql.exe") {
        $pgBin = $p
        break
    }
}

if (-not $pgBin) {
    Write-Host "❌ PostgreSQL binaries not found. Make sure PostgreSQL is installed." -ForegroundColor Red
    Write-Host "   Expected locations: $($pgPaths -join ', ')"
    exit 1
}

Write-Host "✅ Found PostgreSQL at: $pgBin" -ForegroundColor Green
$env:Path = "$pgBin;$env:Path"

# ─── 2. Check if PostgreSQL service is running ──────────────────────────────
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Write-Host "⏳ Starting PostgreSQL service..."
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
    }
    Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  No PostgreSQL service found. Trying to connect anyway..." -ForegroundColor Yellow
}

# ─── 3. Create admin user and assetflow database ────────────────────────────
Write-Host "`n⏳ Setting up database user and database..."

# Try connecting with default postgres superuser
$env:PGPASSWORD = "postgres"

# Create admin role (if not exists)
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN CREATE ROLE admin WITH LOGIN PASSWORD 'secretpassword' CREATEDB; END IF; END `$`$;" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Could not connect with 'postgres' user. Trying without password..." -ForegroundColor Yellow
    $env:PGPASSWORD = ""
    & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN CREATE ROLE admin WITH LOGIN PASSWORD 'secretpassword' CREATEDB; END IF; END `$`$;" 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Cannot connect to PostgreSQL." -ForegroundColor Red
        Write-Host "   The PostgreSQL superuser password may have been set during installation." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Please run these commands manually:" -ForegroundColor Yellow
        Write-Host "     psql -U postgres" -ForegroundColor White
        Write-Host "     CREATE ROLE admin WITH LOGIN PASSWORD 'secretpassword' CREATEDB;" -ForegroundColor White
        Write-Host "     CREATE DATABASE assetflow OWNER admin;" -ForegroundColor White
        Write-Host "     \q" -ForegroundColor White
        Write-Host ""
        Write-Host "   Then re-run: cd backend && npm run db:push && npm run db:seed" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "✅ Admin role created" -ForegroundColor Green

# Create assetflow database (if not exists)
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'assetflow'" | Out-Null
$dbExists = & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'assetflow'"

if ($dbExists -notmatch "1") {
    & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE assetflow OWNER admin;"
    Write-Host "✅ Database 'assetflow' created" -ForegroundColor Green
} else {
    Write-Host "✅ Database 'assetflow' already exists" -ForegroundColor Green
}

# Grant privileges
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE assetflow TO admin;" 2>$null

# ─── 4. Run Prisma migrations ──────────────────────────────────────────────
Write-Host "`n⏳ Pushing Prisma schema to database..."
Set-Location "$PSScriptRoot"
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Schema push failed" -ForegroundColor Red
    exit 1
}

# ─── 5. Seed the database ──────────────────────────────────────────────────
Write-Host "`n⏳ Seeding database..."
npx tsx prisma/seed.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
    Write-Host "   Admin login: admin@assetflow.com / Admin@123"
    Write-Host "   Employee:    priya@systems.core / Employee@123`n"
} else {
    Write-Host "❌ Seeding failed" -ForegroundColor Red
    exit 1
}
