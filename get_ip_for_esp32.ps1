# Script lấy địa chỉ IP để cấu hình ESP32
# Chạy: .\get_ip_for_esp32.ps1

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lấy địa chỉ IP cho ESP32" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📡 Các địa chỉ IP khả dụng trên máy tính này:`n" -ForegroundColor Green

# Lấy tất cả IP (trừ Loopback)
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"  # Loại bỏ APIPA addresses
}

# Hiển thị table đẹp
$ips | Select-Object @{
    Name='Địa chỉ IP';
    Expression={$_.IPAddress}
}, @{
    Name='Tên mạng';
    Expression={$_.InterfaceAlias}
} | Format-Table -AutoSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hướng dẫn sử dụng" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Chọn IP của mạng mà ESP32 sẽ kết nối:" -ForegroundColor White
Write-Host "   - Nếu ESP32 kết nối WiFi → chọn IP của Wi-Fi" -ForegroundColor Gray
Write-Host "   - Nếu máy tính dùng Ethernet → chọn IP Ethernet" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Mở file: " -NoNewline -ForegroundColor White
Write-Host "esp32_firmware/esp32_agri_monitor.ino" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣  Tìm dòng: " -NoNewline -ForegroundColor White
Write-Host 'const char* mqtt_server = "YOUR_MQTT_BROKER_IP";' -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣  Thay bằng: " -NoNewline -ForegroundColor White
Write-Host 'const char* mqtt_server = "' -NoNewline -ForegroundColor Cyan

# Gợi ý IP Wi-Fi (nếu có)
$wifiIP = $ips | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"} | Select-Object -First 1
if ($wifiIP) {
    Write-Host "$($wifiIP.IPAddress)" -NoNewline -ForegroundColor Green
} else {
    $firstIP = $ips | Select-Object -First 1
    Write-Host "$($firstIP.IPAddress)" -NoNewline -ForegroundColor Green
}

Write-Host '";' -ForegroundColor Cyan
Write-Host ""

Write-Host "5️⃣  Upload code lại vào ESP32" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Kiểm tra MQTT Broker" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra MQTT Broker có đang chạy không
$mqttPort = netstat -ano | Select-String ":1883.*LISTENING"

if ($mqttPort) {
    Write-Host "✅ MQTT Broker đang chạy trên port 1883" -ForegroundColor Green
} else {
    Write-Host "⚠️  MQTT Broker CHƯA chạy!" -ForegroundColor Yellow
    Write-Host "   Chạy lệnh: " -NoNewline -ForegroundColor Gray
    Write-Host ".\start_system.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lưu ý" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Neu van loi 'Host is unreachable':" -ForegroundColor Red
Write-Host "   1. Tat Windows Firewall tam thoi" -ForegroundColor Gray
Write-Host "   2. Dam bao ESP32 va may tinh cung mang WiFi" -ForegroundColor Gray
Write-Host "   3. Hoac dung MQTT Broker Cloud:" -ForegroundColor Gray
Write-Host '      mqtt_server = "broker.hivemq.com";' -ForegroundColor Cyan
Write-Host ""

Write-Host "Press Enter to exit..." -NoNewline
Read-Host
