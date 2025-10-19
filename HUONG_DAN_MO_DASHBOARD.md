# 🌐 Hướng dẫn mở Dashboard

## ✅ Hệ thống đã chạy thành công!

### 📊 Các thành phần đang hoạt động:

1. **ESP32**: Đọc cảm biến DHT11 và gửi qua MQTT ✅
2. **Mosquitto MQTT Broker**: Nhận dữ liệu từ ESP32 ✅  
3. **Backend Server**: Xử lý và lưu dữ liệu ✅

### 🌐 Cách mở Dashboard:

**CÁCH 1: Mở trực tiếp file HTML**
```
Đường dẫn: D:\2025.1_monhoc\btl_iot\IOT_agri_20251\frontend\dashboard_dht11.html
```
- Chuột phải vào file → Open with → Chrome/Edge/Firefox
- Dashboard sẽ tự động kết nối backend ở `http://localhost:3000`

**CÁCH 2: Mở qua URL**
Gõ vào trình duyệt:
```
file:///D:/2025.1_monhoc/btl_iot/IOT_agri_20251/frontend/dashboard_dht11.html
```

### 📊 Dashboard sẽ hiển thị:

- 🌡️ **Nhiệt độ hiện tại**: 29.3°C
- 💧 **Độ ẩm hiện tại**: 70%
- 📈 **Biểu đồ realtime**: Cập nhật mỗi 5 giây
- 📊 **Thống kê**: Min/Max/Trung bình
- 🕒 **Lần cập nhật cuối**: Timestamp

### 🔍 Kiểm tra hoạt động:

1. **Backend logs** (terminal backend):
   ```
   📊 Data received: { temp: 29.3, hum: 70, time: '...' }
   ```

2. **Mosquitto logs** (terminal Mosquitto):
   ```
   Received PUBLISH from ESP32_DHT11_Monitor
   ```

3. **ESP32 Serial Monitor** (PlatformIO):
   ```
   ✅ Đã kết nối MQTT!
   📤 Đã gửi dữ liệu
   ```

### ⚠️ Lưu ý quan trọng:

**KHÔNG TẮT CÁC TERMINAL SAU:**
- Terminal Mosquitto (đang chạy `mosquitto.exe -c mosquitto_iot.conf -v`)
- Terminal Backend (đang chạy `node server_dht11.js`)

**Nếu muốn dừng hệ thống:**
1. Nhấn `Ctrl+C` ở terminal Backend
2. Nhấn `Ctrl+C` ở terminal Mosquitto
3. Ngắt USB ESP32 hoặc reset

### 🔄 Khởi động lại hệ thống:

**Bước 1: Mosquitto**
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251
& "C:\Program Files\mosquitto\mosquitto.exe" -c mosquitto_iot.conf -v
```

**Bước 2: Backend** (terminal mới)
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend
node server_dht11.js
```

**Bước 3: ESP32**
- Đã upload code rồi, chỉ cần cắm USB là tự chạy

**Bước 4: Dashboard**
- Mở file `frontend/dashboard_dht11.html` bằng trình duyệt

---

## 🎉 Chúc mừng! Hệ thống IoT Agriculture đã hoạt động hoàn chỉnh!

**Tính năng đã đạt được:**
✅ ESP32 đọc DHT11 mỗi 5 giây
✅ Gửi dữ liệu qua MQTT
✅ Backend lưu và cung cấp API
✅ Dashboard hiển thị realtime với biểu đồ
✅ **PORTABLE** - cắm điện ở đâu cũng chạy (qua hotspot)
