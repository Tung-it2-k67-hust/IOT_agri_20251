# Script khởi động hệ thống IoT Agriculture
# Chạy file này bằng: .\start_system.ps1

Write-Host "`n" -NoNewline
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  IoT Agriculture System - Khoi dong" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Mosquitto
Write-Host "[1/3] Kiem tra MQTT Broker..." -ForegroundColor Green
$mosquittoRunning = Get-Service mosquitto -ErrorAction SilentlyContinue

if ($mosquittoRunning -and $mosquittoRunning.Status -eq 'Running') {
    Write-Host "      OK: Mosquitto dang chay" -ForegroundColor Green
} else {
    Write-Host "      CANH BAO: Mosquitto chua chay" -ForegroundColor Yellow
    Write-Host "      Dang khoi dong Mosquitto..." -ForegroundColor Yellow
    
    try {
        Start-Service mosquitto
        Write-Host "      OK: Da khoi dong Mosquitto" -ForegroundColor Green
    } catch {
        Write-Host "      LOI: Khong the khoi dong Mosquitto" -ForegroundColor Red
        Write-Host "      Vui long chay: net start mosquitto" -ForegroundColor Red
    }
}

Write-Host ""

# Khởi động Backend
Write-Host "[2/3] Khoi dong Backend Server..." -ForegroundColor Green
$backendPath = "D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend"

if (Test-Path $backendPath) {
    Write-Host "      Dang khoi dong Node.js server..." -ForegroundColor Yellow
    
    # Khởi động backend trong terminal mới
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Cyan; node server_dht11.js"
    
    Write-Host "      OK: Backend dang chay trong terminal moi" -ForegroundColor Green
} else {
    Write-Host "      LOI: Khong tim thay thu muc backend" -ForegroundColor Red
}

Write-Host ""

# Mở Dashboard
Write-Host "[3/3] Mo Dashboard..." -ForegroundColor Green
$dashboardPath = "D:\2025.1_monhoc\btl_iot\IOT_agri_20251\frontend\dashboard_dht11.html"

if (Test-Path $dashboardPath) {
    Start-Sleep -Seconds 2  # Đợi backend khởi động
    Start-Process $dashboardPath
    Write-Host "      OK: Dashboard da mo trong browser" -ForegroundColor Green
} else {
    Write-Host "      LOI: Khong tim thay file dashboard" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  He thong da khoi dong!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Kiem tra:" -ForegroundColor Yellow
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  - Dashboard: da mo trong browser" -ForegroundColor White
Write-Host "  - ESP32: upload code va cam vao USB" -ForegroundColor White
Write-Host ""
Write-Host "De dung he thong:" -ForegroundColor Yellow
Write-Host "  - Dong terminal Backend" -ForegroundColor White
Write-Host "  - Chay: net stop mosquitto" -ForegroundColor White
Write-Host ""

Pause
