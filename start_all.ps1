# ==========================================================
#   CottonCare AI -- Start All Services
#   Run from project root:  .\start_all.ps1
# ==========================================================

param(
    [switch]$Stop   # Pass -Stop to kill all running CottonCare services
)

$root = $PSScriptRoot

# -- Stop mode ---------------------------------------------
if ($Stop) {
    Write-Host "Stopping CottonCare services..." -ForegroundColor Yellow
    Get-Process -Name powershell -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowTitle -like "CottonCare*" } |
        Stop-Process -Force
    @(8000, 3000, 3001, 3002) | ForEach-Object {
        $port = $_
        $procs = (netstat -ano 2>$null | Select-String ":$port\s") -replace '.*\s+(\d+)$','$1' |
                 Where-Object { $_ -match '^\d+$' } | Select-Object -Unique
        foreach ($p in $procs) {
            try { Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    Write-Host "Done." -ForegroundColor Green
    exit
}

# -- Helpers -----------------------------------------------
function Write-Banner([string]$Text) {
    Write-Host ""
    Write-Host "  $Text" -ForegroundColor Cyan
}

function Start-ServiceWindow {
    param([string]$Title, [string]$ScriptContent)
    $tmp = Join-Path $env:TEMP ("cc_" + ($Title -replace '[^a-zA-Z0-9]','_') + ".ps1")
    Set-Content -Path $tmp -Value $ScriptContent -Encoding UTF8
    Start-Process powershell `
        -ArgumentList "-NoExit", "-NoProfile", "-ExecutionPolicy", "RemoteSigned", "-File", "`"$tmp`"" `
        -WindowStyle Normal
}

# -- Pre-flight checks -------------------------------------
$venvActivate = Join-Path $root "venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvActivate)) {
    Write-Host "[ERROR] Python venv not found at: $venvActivate" -ForegroundColor Red
    Write-Host "        Run:  python -m venv venv  ;  pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

foreach ($dir in @("web_dashboard","admin_dashboard","expert_dashboard")) {
    $nm = Join-Path $root "$dir\node_modules"
    if (-not (Test-Path $nm)) {
        Write-Host "[INFO] Installing $dir npm packages..." -ForegroundColor Yellow
        Push-Location (Join-Path $root $dir)
        npm install
        Pop-Location
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "         CottonCare AI - Starting All Services            " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# -- 1. FastAPI Backend ------------------------------------
Write-Banner "[ 1/4 ] Backend API  ->  http://localhost:8000"
$backendScript = @"
`$host.UI.RawUI.WindowTitle = 'CottonCare - Backend API'
Set-Location '$root'
& '$venvActivate'
Write-Host 'Starting FastAPI backend...' -ForegroundColor Cyan
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@
Start-ServiceWindow "CottonCare Backend API" $backendScript
Start-Sleep -Seconds 5

# -- 2. Farmer Dashboard (Vite) ----------------------------
Write-Banner "[ 2/4 ] Farmer Dashboard  ->  http://localhost:3000"
$farmerScript = @"
`$host.UI.RawUI.WindowTitle = 'CottonCare - Farmer Dashboard'
Set-Location '$root\web_dashboard'
Write-Host 'Starting Farmer Dashboard (Vite)...' -ForegroundColor Cyan
npm run dev -- --port 3000 --host
"@
Start-ServiceWindow "CottonCare Farmer Dashboard" $farmerScript
Start-Sleep -Seconds 1

# -- 3. Admin Dashboard (Vite) -----------------------------
Write-Banner "[ 3/4 ] Admin Dashboard   ->  http://localhost:3001"
$adminScript = @"
`$host.UI.RawUI.WindowTitle = 'CottonCare - Admin Dashboard'
Set-Location '$root\admin_dashboard'
Write-Host 'Starting Admin Dashboard (Vite)...' -ForegroundColor Cyan
npm run dev
"@
Start-ServiceWindow "CottonCare Admin Dashboard" $adminScript
Start-Sleep -Seconds 1

# -- 4. Expert Dashboard (Vite) ----------------------------
Write-Banner "[ 4/4 ] Expert Dashboard  ->  http://localhost:3002"
$expertScript = @"
`$host.UI.RawUI.WindowTitle = 'CottonCare - Expert Dashboard'
Set-Location '$root\expert_dashboard'
Write-Host 'Starting Expert Dashboard (Vite)...' -ForegroundColor Cyan
npm run dev
"@
Start-ServiceWindow "CottonCare Expert Dashboard" $expertScript
Start-Sleep -Seconds 3

# -- Summary -----------------------------------------------
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "                 All Services Launched!                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Backend API        ->  http://localhost:8000           " -ForegroundColor White
Write-Host "  API Docs (Swagger) ->  http://localhost:8000/docs      " -ForegroundColor White
Write-Host "  Farmer Dashboard   ->  http://localhost:3000           " -ForegroundColor White
Write-Host "  Admin Dashboard    ->  http://localhost:3001           " -ForegroundColor White
Write-Host "  Expert Dashboard   ->  http://localhost:3002           " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  To STOP all:  .\start_all.ps1 -Stop                   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:8000/docs"
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
Start-Process "http://localhost:3002"