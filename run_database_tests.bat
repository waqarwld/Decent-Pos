@echo off
REM Database Functions Unit Test Runner for Windows
REM This script runs the comprehensive unit test suite for database functions

setlocal

REM Database connection parameters
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=inventory_management
if "%DB_USER%"=="" set DB_USER=inventory_user
if "%DB_PASSWORD%"=="" set DB_PASSWORD=inventory_pass

echo =========================================
echo Database Functions Unit Test Suite
echo =========================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: psql command not found
    echo Please ensure PostgreSQL client tools are installed and in PATH
    exit /b 1
)

REM Check database connection
echo Checking database connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to database
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database credentials are correct
    echo   3. Database '%DB_NAME%' exists
    exit /b 1
)
echo [OK] Database connection successful
echo.

REM Run the test suite
echo Running unit tests...
echo =========================================
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f test_database_functions.sql > test_results.log 2>&1

REM Check for failures
findstr /C:"FAIL:" test_results.log >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [FAILED] TESTS FAILED
    echo.
    echo Failed tests:
    findstr /C:"FAIL:" test_results.log
    echo.
    echo Full test output saved to: test_results.log
    exit /b 1
) else (
    echo [OK] ALL TESTS PASSED
    echo.
    
    REM Count passed tests
    for /f %%i in ('findstr /C:"PASS:" test_results.log ^| find /c /v ""') do set PASS_COUNT=%%i
    echo Tests passed: %PASS_COUNT%
    echo.
    echo Full test output saved to: test_results.log
    exit /b 0
)

endlocal
