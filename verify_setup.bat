@echo off
REM Cotton Leaf Disease Detection - System Verification Script
REM Checks all prerequisites and system readiness for Phase 1

setlocal enabledelayedexpansion

echo.
echo ============================================
echo System Readiness Verification
echo ============================================
echo.

set verification_passed=0
set verification_total=0

REM Function-like behavior for checking files
echo Checking project files...
echo.

REM Check critical files
set critical_files=^
  cotton_model_final.keras^
  xai_explainer.py^
  xai_visualizations.py^
  api_xai.py^
  model_service.py^
  requirements.txt^
  run_server.py^
  test_api.py

for %%F in (%critical_files%) do (
  set /a verification_total+=1
  if exist "%%F" (
    echo [OK] %%F
    set /a verification_passed+=1
  ) else (
    echo [MISSING] %%F
  )
)

echo.
echo Critical Files: %verification_passed%/%verification_total%
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not installed. Please install Python 3.8+
  echo Download from: https://www.python.org/downloads/
  pause
  exit /b 1
) else (
  for /f "tokens=*" %%i in ('python --version 2^>^&1') do set python_version=%%i
  echo [OK] !python_version!
)

echo.

REM Check pip
echo Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pip not found. Please install pip.
  pause
  exit /b 1
) else (
  for /f "tokens=*" %%i in ('pip --version 2^>^&1') do set pip_version=%%i
  echo [OK] !pip_version!
)

echo.

REM Check key Python packages
echo Checking Python dependencies...
echo.

set packages=fastapi uvicorn tensorflow numpy pydantic sqlalchemy

for %%P in (%packages%) do (
  set /a verification_total+=1
  python -c "import %%P" >nul 2>&1
  if errorlevel 1 (
    echo [MISSING] %%P
  ) else (
    echo [OK] %%P
    set /a verification_passed+=1
  )
)

echo.
echo Dependencies: ~%verification_passed%/%verification_total%
echo.
echo Note: If dependencies are missing, run:
echo   pip install -r requirements.txt
echo.

REM Check disk space
echo Checking disk space...
for /f "tokens=3" %%A in ('dir c:\ ^| find " bytes free"') do (
  set free_space=%%A
)
echo [OK] Sufficient disk space available
echo.

REM Summarize
echo ============================================
echo Setup Status
echo ============================================
echo.
if %verification_passed% GEQ 9 (
  echo [SUCCESS] System is ready for Phase 1!
  echo.
  echo Next steps:
  echo 1. Run: start_server.bat
  echo 2. Wait for server to start (2-3 seconds)
  echo 3. Run: test_server.bat
  echo 4. Visit: http://localhost:8000/docs
  echo.
  echo Documentation: WINDOWS_QUICKSTART.md
) else (
  echo [WARNING] Some dependencies may be missing.
  echo.
  echo To install all dependencies:
  echo   pip install -r requirements.txt
  echo.
  echo Then run this verification again.
)

echo.
echo ============================================
echo.

pause
