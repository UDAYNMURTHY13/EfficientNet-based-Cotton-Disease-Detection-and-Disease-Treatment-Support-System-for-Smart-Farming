@echo off
REM Cotton Leaf Disease Detection - Complete Setup Script
REM One-click setup for Windows

setlocal enabledelayedexpansion

title Cotton AI - Setup Assistant

echo.
echo ============================================
echo Cotton AI - Complete Setup
echo ============================================
echo.

REM Check Python
echo Step 1: Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found.
  echo Please install Python 3.8+ from: https://www.python.org/downloads/
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [OK] %%i

echo.
echo Step 2: Setting up virtual environment...

if not exist "venv" (
  python -m venv venv
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
  )
  echo [OK] Virtual environment created
) else (
  echo [OK] Virtual environment exists
)

echo.
echo Step 3: Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
  echo [ERROR] Failed to activate virtual environment
  pause
  exit /b 1
)
echo [OK] Virtual environment activated

echo.
echo Step 4: Installing dependencies...
echo This may take 3-5 minutes...
echo.

pip install -r requirements.txt
if errorlevel 1 (
  echo [ERROR] Failed to install dependencies
  echo Try running: pip install -r requirements.txt
  pause
  exit /b 1
)

echo.
echo [OK] All dependencies installed successfully!

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.

echo You can now:
echo.
echo Option 1: Start the server
echo   Command: start_server.bat
echo.
echo Option 2: Verify the setup
echo   Command: verify_setup.bat
echo.
echo Option 3: Run tests
echo   Command: test_server.bat
echo.
echo Option 4: View documentation
echo   File: WINDOWS_QUICKSTART.md
echo.
echo ============================================
echo.

pause
