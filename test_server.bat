@echo off
REM Cotton Leaf Disease Detection - API Testing Script
REM Windows Batch Script

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Cotton AI - API Testing Suite
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Check virtual environment
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    if errorlevel 1 (
        echo [ERROR] Failed to activate virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment activated
    echo.
) else (
    echo [WARNING] Virtual environment not found. Using system Python...
    echo.
)

echo Checking if server is running on localhost:8000...
timeout /t 1 /nobreak >nul

python -c "import requests; requests.get('http://localhost:8000/health', timeout=2)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Server not running on localhost:8000
    echo Please start the server first with: start_server.bat
    pause
    exit /b 1
)

echo [OK] Server is running
echo.

echo ========================================
echo Running API Tests...
echo ========================================
echo.

REM Run the tests with pytest for better output
python -m pytest test_api.py -v --tb=short
set test_result=!errorlevel!

echo.
echo ========================================
if !test_result! equ 0 (
    echo [SUCCESS] All tests passed!
) else (
    echo [FAILED] Some tests failed. Check output above.
)
echo ========================================
echo.

pause
exit /b !test_result!
