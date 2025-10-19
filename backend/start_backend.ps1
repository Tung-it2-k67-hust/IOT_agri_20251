# Script khởi động Backend (tự động kill port cũ)
# Chạy: .\start_backend.ps1

Write-Host "=== Khởi động Backend Server ===" -ForegroundColor Cyan
Write-Host ""

# Tìm và kill process trên port 3000
Write-Host "Đang kiểm tra port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Tìm thấy process đang dùng port 3000, đang tắt..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Đã tắt PID: $pid" -ForegroundColor Green
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "  ✅ Port 3000 trống, sẵn sàng!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Đang khởi động Backend..." -ForegroundColor Green
Write-Host ""

# Chuyển đến thư mục backend và chạy
Set-Location "D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend"
node server_dht11.js

# Giữ terminal mở khi có lỗi
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Backend gặp lỗi!" -ForegroundColor Red
    Read-Host "Nhấn Enter để đóng"
}
