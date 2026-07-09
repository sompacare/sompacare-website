# Sompacare platform one-time setup (run after Docker Desktop is installed)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "=== Sompacare Platform Setup ===" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker is not installed or not in PATH." -ForegroundColor Red
  Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
  Write-Host "After install, restart this terminal and run this script again." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.platform.example") {
    Copy-Item ".env.platform.example" ".env"
    Write-Host "Created .env from .env.platform.example - add your Clerk secret key if needed." -ForegroundColor Yellow
  } else {
    Write-Host "Missing .env file. Create one with DATABASE_URL before continuing." -ForegroundColor Red
    exit 1
  }
}

Copy-Item ".env" "packages\database\.env" -Force

Write-Host ""
Write-Host "[1/4] Starting Postgres + Redis..." -ForegroundColor Green
docker compose up -d
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[2/4] Generating Prisma client..." -ForegroundColor Green
npm run db:generate

Write-Host ""
Write-Host "[3/4] Running migrations..." -ForegroundColor Green
npm run db:migrate -- --name init

Write-Host ""
Write-Host "[4/4] Seeding demo shifts and users..." -ForegroundColor Green
npm run db:seed

Write-Host ""
Write-Host "=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Start the API:  npm run dev:api" -ForegroundColor White
Write-Host "Nurse portal:   npm run dev --workspace=@sompacare/nurse-portal" -ForegroundColor White
Write-Host 'Link your Clerk account: node scripts/link-clerk-user.mjs --email YOUR_EMAIL' -ForegroundColor White
