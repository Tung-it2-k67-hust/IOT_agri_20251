# 🌾 IoT Agriculture System - DHT11 Integration

## 📖 Tổng Quan

Hệ thống IoT Agriculture với DHT11 sensor để theo dõi nhiệt độ và độ ẩm không khí.

```
ESP32 (DHT11) → WiFi → MQTT Broker → Backend API → Frontend Dashboard
```

---

## 🚀 QUICK START (3 Bước Nhanh)

### Bước 1: Khởi động MQTT Broker
```powershell
# Windows (nếu đã cài Mosquitto)
net start mosquitto

# Hoặc chạy manual
mosquitto -v
```

### Bước 2: Khởi động Backend
```powershell
cd backend
npm install
node server_dht11.js
```

### Bước 3: Upload code lên ESP32
1. Mở PlatformIO project: `new_ini`
2. Sửa WiFi credentials trong `main_with_mqtt.cpp`
3. Upload lên ESP32

### Bước 4: Mở Dashboard
```powershell
# Mở file trong browser
start frontend/dashboard_dht11.html
```

---

## 📂 Cấu Trúc Project

```
IOT_agri_20251/
├── backend/
│   ├── server_dht11.js          ← Backend server mới
│   ├── package.json
│   └── .env
├── frontend/
│   └── dashboard_dht11.html     ← Dashboard mới
└── esp32_firmware/
    └── (sử dụng project new_ini)

new_ini/
├── src/
│   ├── main.cpp
│   └── main_with_mqtt.cpp       ← ESP32 code mới
├── platformio.ini
└── SETUP_GUIDE.md               ← Hướng dẫn chi tiết
```

---

## ⚙️ Cấu Hình

### ESP32 (`main_with_mqtt.cpp`)
```cpp
const char* ssid = "YourWiFi";              // ← SỬA
const char* password = "YourPassword";       // ← SỬA
const char* mqtt_server = "192.168.1.100";  // ← SỬA (IP máy tính)
```

### Backend (`.env`)
```env
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
```

### Frontend (`dashboard_dht11.html`)
```javascript
const API_URL = 'http://localhost:3000/api';  // ← SỬA nếu cần
```

---

## 🔌 Kết Nối Phần Cứng

```
DHT11         ESP32
-----         -----
VCC    ──▶    3.3V
DATA   ──▶    GPIO 5
GND    ──▶    GND
```

---

## 📡 API Endpoints

### 1. Get Latest Data
```http
GET /api/sensor-data/latest
```
Response:
```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "humidity": 65.3,
    "device": "ESP32_DHT11_Monitor",
    "timestamp": "2025-10-19T10:30:00.000Z"
  }
}
```

### 2. Get History
```http
GET /api/sensor-data?limit=100
```

### 3. Get Statistics
```http
GET /api/statistics
```
Response:
```json
{
  "success": true,
  "data": {
    "temperature": {
      "current": 28.5,
      "min": 25.0,
      "max": 32.0,
      "avg": "28.3"
    },
    "humidity": {
      "current": 65.3,
      "min": 60.0,
      "max": 70.0,
      "avg": "65.1"
    },
    "dataPoints": 120,
    "lastUpdate": "2025-10-19T10:30:00.000Z"
  }
}
```

### 4. MQTT Status
```http
GET /api/mqtt/status
```

---

## 🧪 Testing

### Test 1: MQTT Đang Nhận Dữ Liệu
```powershell
mosquitto_sub -h localhost -t "agri/sensor/data" -v
```

### Test 2: Backend API
```powershell
curl http://localhost:3000/api/sensor-data/latest
```

### Test 3: Serial Monitor
Mở Serial Monitor trong PlatformIO:
```
✅ WiFi connected!
🔌 Đang kết nối MQTT Broker... ✅ Đã kết nối!
📊 Nhiệt độ: 28.5°C | Độ ẩm: 65.3%
📤 Đã gửi: {"temperature":28.5,"humidity":65.3,...}
```

---

## 🐛 Troubleshooting

### Lỗi: ESP32 không kết nối WiFi
```
❌ WiFi connection failed!
```
**Giải pháp:**
- Kiểm tra SSID và password
- ESP32 gần router
- Reset ESP32 (nút EN)

### Lỗi: MQTT không kết nối
```
❌ Lỗi, rc=-2
```
**Giải pháp:**
```powershell
# Kiểm tra Mosquitto đang chạy
netstat -an | findstr 1883

# Khởi động lại
net stop mosquitto
net start mosquitto
```

### Lỗi: Frontend không hiển thị dữ liệu
**Giải pháp:**
- F12 → Console → xem lỗi CORS
- Kiểm tra Backend đang chạy
- Kiểm tra `API_URL` trong HTML

### Lỗi: DHT11 trả về NaN
```
❌ Lỗi đọc DHT11!
```
**Giải pháp:**
- Kiểm tra kết nối dây
- Thêm điện trở pull-up 4.7kΩ
- Đợi 2s sau reset

---

## 📊 MQTT Message Format

### Topic: `agri/sensor/data`

**Payload:**
```json
{
  "temperature": 28.5,
  "humidity": 65.3,
  "timestamp": 1729338000000,
  "device": "ESP32_DHT11_Monitor"
}
```

---

## 🎯 Next Steps

- [ ] Thêm database (MongoDB/MySQL)
- [ ] WebSocket cho real-time update
- [ ] Mobile app (React Native)
- [ ] Email/SMS alerts
- [ ] Thêm sensors khác (độ ẩm đất, ánh sáng)
- [ ] Điều khiển relay (bơm nước, đèn)

---

## 📝 Notes

- Dữ liệu được lưu trong RAM (sẽ mất khi restart server)
- Giới hạn 1000 records
- MQTT QoS = 0 (at most once)
- Gửi data mỗi 5 giây

---

## 📞 Support

Nếu gặp lỗi:
1. Kiểm tra Serial Monitor (ESP32)
2. Kiểm tra log Backend server
3. Kiểm tra MQTT broker log
4. Xem Console trong browser (F12)

---

**Made with ❤️ for IoT Agriculture**
