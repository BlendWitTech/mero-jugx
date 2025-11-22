@echo off
REM Pre-commit validation script for Windows
REM Run this before committing to ensure migrations are in sync

echo 🔍 Validating database migrations...
call npm run migration:validate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Migration validation failed!
    echo Please fix the issues before committing.
    echo.
    echo See docs/DATABASE-GUIDE.md for help.
    exit /b 1
)

echo.
echo ✅ All validations passed. Safe to commit!

