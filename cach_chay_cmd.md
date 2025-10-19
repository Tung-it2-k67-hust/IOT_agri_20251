🎯 TÓM TẮT LỆNH CMD (CHO FILE HƯỚNG DẪN)
Khởi động thủ công:
Terminal 1: Mosquitto (Administrator)
cd /d D:\2025.1_monhoc\btl_iot\IOT_agri_20251
"C:\Program Files\mosquitto\mosquitto.exe" -c mosquitto_iot.conf -v
Terminal 2: Backend (Không cần Admin)
cd /d D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend
node server_dht11.js
Terminal 3: Dashboard
start D:\2025.1_monhoc\btl_iot\IOT_agri_20251\frontend\dashboard_dht11.html
Dừng hệ thống (Administrator):
taskkill /F /IM mosquitto.exe
taskkill /F /IM node.exe
Kiểm tra đang chạy:
netstat -ano | findstr :1883
netstat -ano | findstr :3000