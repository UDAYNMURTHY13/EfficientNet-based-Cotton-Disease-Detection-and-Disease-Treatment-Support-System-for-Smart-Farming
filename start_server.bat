@echo off
REM Cotton Leaf Disease Detection - FastAPI Server Startup
REM Windows Batch Script

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Cotton AI - FastAPI Server Launcher
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
if not exist "venv\Scripts\activate.bat" (
    echo [WARNING] Virtual environment not found.
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo [OK] Virtual environment activated
echo.

echo Checking dependencies...
python -c "import fastapi; import tensorflow; import pydantic" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Missing dependencies. Installing...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] All dependencies found
)

echo.
echo ========================================
echo Starting Cotton AI FastAPI Server...
echo ========================================
echo.
echo Server will be available at:
echo   - http://localhost:8000
echo   - Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python run_server.py

REM If we get here, server was stopped
echo.
echo Server stopped.
pause
