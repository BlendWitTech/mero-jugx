# Mero Jugx - Migration Revert Script (PowerShell)
# Interactive script to revert migrations

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Migration Revert" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Show current migrations
Write-Host "Fetching migration status..." -ForegroundColor Blue
typeorm-ts-node-commonjs migration:show -d src/database/migrations/DataSource.ts
Write-Host ""

Write-Host "How many migrations would you like to revert?" -ForegroundColor Yellow
Write-Host "  Enter a number (e.g., 1, 2, 3) or 'all' to revert all migrations" -ForegroundColor White
Write-Host ""

$input = Read-Host "Enter your choice"

if ($input -eq "all") {
    Write-Host ""
    Write-Host "WARNING: This will revert ALL migrations!" -ForegroundColor Red
    $confirm = Read-Host "Are you absolutely sure? Type 'yes' to continue"
    if ($confirm -eq "yes") {
        Write-Host ""
        Write-Host "Reverting all migrations..." -ForegroundColor Blue
        # Revert one by one until none left
        while ($true) {
            typeorm-ts-node-commonjs migration:revert -d src/database/migrations/DataSource.ts
            if ($LASTEXITCODE -ne 0) {
                break
            }
        }
        Write-Host ""
        Write-Host "All migrations reverted!" -ForegroundColor Green
    } else {
        Write-Host "Revert cancelled." -ForegroundColor Yellow
    }
} else {
    $count = [int]$input
    if ($count -gt 0) {
        Write-Host ""
        Write-Host "Reverting $count migration(s)..." -ForegroundColor Blue
        for ($i = 1; $i -le $count; $i++) {
            Write-Host "  Reverting migration $i of $count..." -ForegroundColor White
            typeorm-ts-node-commonjs migration:revert -d src/database/migrations/DataSource.ts
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to revert migration $i" -ForegroundColor Red
                exit 1
            }
        }
        Write-Host ""
        Write-Host "Migration revert complete!" -ForegroundColor Green
    } else {
        Write-Host "Invalid number. Exiting." -ForegroundColor Red
        exit 1
    }
}

