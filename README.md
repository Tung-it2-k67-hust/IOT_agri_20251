# 🌱 Hệ Thống Giám Sát Nông Nghiệp IoT

Hệ thống giám sát và điều khiển tự động cho nông nghiệp sử dụng ESP32, MQTT và Web Interface.

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [API Documentation](#-api-documentation)
- [Giao Thức MQTT](#-giao-thức-mqtt)
- [Sơ Đồ Kết Nối Phần Cứng](#-sơ-đồ-kết-nối-phần-cứng)

## ✨ Tính Năng

### Chức năng chính:
- ✅ Đo độ ẩm đất theo thời gian thực
- ✅ Tưới nước tự động khi độ ẩm dưới ngưỡng
- ✅ Điều khiển đèn theo lịch trình
- ✅ Gửi dữ liệu lên backend mỗi 5 giây
- ✅ Điều khiển thủ công qua web interface
- ✅ Cấu hình ngưỡng độ ẩm qua web
- ✅ Lập lịch bật/tắt đèn tự động
- ✅ Kết nối WiFi và MQTT
- ✅ Giao diện web responsive, thân thiện

### Chế độ hoạt động:
1. **Tự động**: Hệ thống tự động điều khiển máy bơm và đèn
2. **Thủ công**: Người dùng điều khiển trực tiếp qua web

## 🔧 Công Nghệ Sử Dụng

### ESP32 Firmware
- **Platform**: PlatformIO / Arduino IDE
- **Board**: ESP32 Development Board
- **Libraries**:
  - `WiFi.h` - Kết nối WiFi
  - `PubSubClient` v2.8+ - MQTT client
  - `ArduinoJson` v6.21+ - JSON parsing

### Backend Server
- **Runtime**: Node.js v16+
- **Framework**: Express.js v4.18+
- **Libraries**:
  - `mqtt` v5.0+ - MQTT client
  - `express` - REST API framework
  - `cors` - Cross-Origin Resource Sharing
  - `body-parser` - Request body parsing
  - `dotenv` - Environment variables

### Frontend
- **Technology**: HTML5, CSS3, Vanilla JavaScript
- **Features**:
  - Responsive design
  - Real-time data updates
  - Modern UI/UX

### MQTT Broker
- **Recommended**: Mosquitto MQTT Broker
- **Alternative**: HiveMQ, EMQX
- **Protocol**: MQTT v3.1.1

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────┐         MQTT          ┌──────────────┐
│   ESP32     │◄─────────────────────►│ MQTT Broker  │
│  (Sensor &  │                        │ (Mosquitto)  │
│  Actuators) │                        └──────┬───────┘
└─────────────┘                               │
                                               │ MQTT
                                               │
                                        ┌──────▼───────┐
                                        │   Backend    │
                                        │   (Node.js)  │
                                        └──────┬───────┘
                                               │ REST API
                                               │
                                        ┌──────▼───────┐
                                        │   Frontend   │
                                        │   (Web UI)   │
                                        └──────────────┘
```

### Luồng Dữ Liệu:
1. ESP32 đọc cảm biến độ ẩm mỗi 5 giây
2. ESP32 publish dữ liệu lên MQTT topic
3. Backend subscribe và lưu trữ dữ liệu
4. Frontend gọi REST API để hiển thị dữ liệu
5. User điều khiển qua web → Backend → MQTT → ESP32

## 🚀 Cài Đặt

### 1. Cài Đặt MQTT Broker (Mosquitto)

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

#### Windows:
Tải và cài đặt từ: https://mosquitto.org/download/

#### MacOS:
```bash
brew install mosquitto
brew services start mosquitto
```

### 2. Cài Đặt Backend

```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin MQTT broker của bạn
npm start
```

Backend sẽ chạy tại: `http://localhost:3000`

### 3. Cài Đặt Frontend

Frontend là static HTML, có thể mở trực tiếp hoặc serve qua backend:

**Cách 1: Mở trực tiếp**
```bash
cd frontend
# Mở index.html trong trình duyệt
```

**Cách 2: Serve qua backend**
```bash
# Copy frontend vào backend/public
cp -r frontend/* backend/public/
# Backend sẽ serve tại http://localhost:3000
```

### 4. Cài Đặt ESP32 Firmware

#### Sử dụng PlatformIO:
```bash
cd esp32_firmware
# Chỉnh sửa esp32_agri_monitor.ino với thông tin WiFi và MQTT
pio run --target upload
pio device monitor
```

#### Sử dụng Arduino IDE:
1. Mở `esp32_firmware/esp32_agri_monitor.ino`
2. Cài đặt thư viện: PubSubClient, ArduinoJson
3. Cấu hình WiFi SSID, password, MQTT broker
4. Upload lên ESP32

### 5. Kết Nối Phần Cứng

Xem chi tiết tại: [esp32_firmware/WIRING.md](esp32_firmware/WIRING.md)

**Tóm tắt:**
- Cảm biến độ ẩm → GPIO 34
- Relay máy bơm → GPIO 25
- Relay đèn → GPIO 26

## 📡 API Documentation

Base URL: `http://localhost:3000/api`

### GET Endpoints

#### 1. Lấy trạng thái hiện tại
```http
GET /api/status
```

**Response:**
```json
{
  "moistureThreshold": 40,
  "autoWatering": true,
  "manualPumpOverride": false,
  "manualLightOverride": false,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true,
  "pumpState": false,
  "lightState": false,
  "moisture": 65,
  "lastUpdate": "2024-01-20T10:30:00.000Z"
}
```

#### 2. Lấy dữ liệu cảm biến mới nhất
```http
GET /api/sensor-data/latest
```

**Response:**
```json
{
  "moisture": 65,
  "pumpState": false,
  "lightState": true,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

#### 3. Lấy lịch sử dữ liệu cảm biến
```http
GET /api/sensor-data?limit=100
```

**Query Parameters:**
- `limit` (optional): Số lượng bản ghi (mặc định: 100)

**Response:**
```json
[
  {
    "moisture": 65,
    "pumpState": false,
    "lightState": true,
    "timestamp": "2024-01-20T10:30:00.000Z"
  },
  ...
]
```

#### 4. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "mqtt": true,
  "uptime": 3600
}
```

### POST Endpoints

#### 1. Điều khiển máy bơm
```http
POST /api/control/pump
Content-Type: application/json

{
  "state": true,
  "mode": "manual"
}
```

**Parameters:**
- `state` (boolean, required): true = bật, false = tắt
- `mode` (string, optional): "manual" hoặc "auto"

**Response:**
```json
{
  "success": true,
  "state": true,
  "mode": "manual"
}
```

#### 2. Điều khiển đèn
```http
POST /api/control/light
Content-Type: application/json

{
  "state": true,
  "mode": "manual"
}
```

**Parameters:**
- `state` (boolean, required): true = bật, false = tắt
- `mode` (string, optional): "manual" hoặc "auto"

**Response:**
```json
{
  "success": true,
  "state": true,
  "mode": "manual"
}
```

#### 3. Cập nhật cấu hình
```http
POST /api/config
Content-Type: application/json

{
  "moistureThreshold": 45,
  "autoWatering": true,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true
}
```

**Parameters:**
- `moistureThreshold` (number, optional): Ngưỡng độ ẩm (0-100)
- `autoWatering` (boolean, optional): Bật/tắt tưới tự động
- `lightOnHour` (number, optional): Giờ bật đèn (0-23)
- `lightOffHour` (number, optional): Giờ tắt đèn (0-23)
- `autoLight` (boolean, optional): Bật/tắt đèn tự động

**Response:**
```json
{
  "success": true,
  "config": {
    "moistureThreshold": 45,
    "autoWatering": true
  }
}
```

## 🔌 Giao Thức MQTT

### Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `agri/sensor/data` | ESP32 → Backend | Dữ liệu cảm biến |
| `agri/control/pump` | Backend → ESP32 | Điều khiển máy bơm |
| `agri/control/light` | Backend → ESP32 | Điều khiển đèn |
| `agri/config` | Backend → ESP32 | Cấu hình hệ thống |
| `agri/status` | ESP32 → Backend | Trạng thái thiết bị |

### Message Formats

#### 1. Sensor Data (ESP32 → Backend)
**Topic:** `agri/sensor/data`
```json
{
  "moisture": 65,
  "pumpState": false,
  "lightState": true,
  "timestamp": 1234567890
}
```

#### 2. Pump Control (Backend → ESP32)
**Topic:** `agri/control/pump`
```json
{
  "state": true,
  "mode": "manual"
}
```

#### 3. Light Control (Backend → ESP32)
**Topic:** `agri/control/light`
```json
{
  "state": true,
  "mode": "manual"
}
```

#### 4. Configuration (Backend → ESP32)
**Topic:** `agri/config`
```json
{
  "moistureThreshold": 45,
  "autoWatering": true,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true
}
```

#### 5. Status (ESP32 → Backend)
**Topic:** `agri/status`
```json
{
  "moistureThreshold": 45,
  "autoWatering": true,
  "manualPumpOverride": false,
  "manualLightOverride": false,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true,
  "pumpState": false,
  "lightState": true
}
```

## 🔧 Sơ Đồ Kết Nối Phần Cứng

### Linh kiện cần thiết:
1. ESP32 Development Board
2. Cảm biến độ ẩm đất (Capacitive hoặc Resistive)
3. Module Relay 2 kênh (5V)
4. Máy bơm nước (5V/12V)
5. Đèn LED hoặc đèn grow light
6. Nguồn điện phù hợp

### Sơ đồ kết nối:

```
ESP32 Pinout:
┌─────────────────────────────┐
│ GPIO 34 ────► Moisture Sensor (Analog)
│ GPIO 25 ────► Pump Relay (Digital)
│ GPIO 26 ────► Light Relay (Digital)
│ 3.3V    ────► Sensor VCC
│ 5V      ────► Relay VCC
│ GND     ────► Common Ground
└─────────────────────────────┘

Relay Module → Pump:
COM ─── Power Supply (+)
NO  ─── Pump (+)
Pump (-) ─── Power Supply (-)

Relay Module → Light:
COM ─── Power Supply (+)
NO  ─── Light (+)
Light (-) ─── Power Supply (-)
```

Chi tiết xem tại: [esp32_firmware/WIRING.md](esp32_firmware/WIRING.md)

## 🔐 Bảo Mật

### Khuyến nghị:
1. Thay đổi MQTT username/password mặc định
2. Sử dụng MQTT over TLS (mqtts://)
3. Cấu hình firewall cho MQTT broker
4. Sử dụng mạng WiFi riêng cho IoT devices
5. Không hard-code credentials trong source code

## 🐛 Troubleshooting

### ESP32 không kết nối được WiFi:
- Kiểm tra SSID và password
- Đảm bảo WiFi là 2.4GHz (ESP32 không hỗ trợ 5GHz)
- Kiểm tra cường độ sín hiệu

### MQTT connection failed:
- Kiểm tra MQTT broker đang chạy: `sudo systemctl status mosquitto`
- Kiểm tra địa chỉ IP và port
- Test bằng mosquitto_pub/sub

### Backend không nhận được dữ liệu:
- Kiểm tra logs của backend: `npm start`
- Kiểm tra ESP32 serial monitor
- Verify MQTT topics match

### Frontend không hiển thị dữ liệu:
- Kiểm tra console log trong browser (F12)
- Verify API_BASE URL trong index.html
- Kiểm tra CORS settings

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết

## 👥 Contributors

- Nhóm IoT - HUST 2025

## 📞 Liên Hệ

Mọi thắc mắc và đóng góp, vui lòng tạo issue trên GitHub.

---

**Lưu ý:** Đây là dự án học tập. Cần kiểm tra và tối ưu thêm cho môi trường production.
