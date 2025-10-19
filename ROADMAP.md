# 🗺️ ROADMAP - Hệ Thống IoT Agriculture với DHT11

## 📊 OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    KIẾN TRÚC HỆ THỐNG                            │
└─────────────────────────────────────────────────────────────────┘

    [ESP32 + DHT11]
           │
           │ WiFi (MQTT Protocol)
           ↓
    [MQTT Broker]
      (Mosquitto)
           │
           │ Publish/Subscribe
           ↓
    [Backend Server]
      (Node.js + Express)
           │
           │ REST API / WebSocket
           ↓
    [Frontend Dashboard]
      (HTML + Chart.js)
           │
           ↓
      [User Interface]
```

---

## 🎯 PHASE 1: SETUP CƠ BẢN (30 phút)

### ✅ Checklist

- [ ] **Cài đặt MQTT Broker (Mosquitto)**
  - Download: https://mosquitto.org/download/
  - Khởi động service: `net start mosquitto`
  - Test: `mosquitto_sub -h localhost -t "test" -v`

- [ ] **Setup Backend**
  - `cd backend`
  - `npm install`
  - Tạo file `.env`
  - `node server_dht11.js`

- [ ] **Kết nối phần cứng ESP32**
  ```
  DHT11 → ESP32
  VCC → 3.3V
  DATA → GPIO 5
  GND → GND
  ```

- [ ] **Upload code lên ESP32**
  - Mở PlatformIO project
  - Sửa WiFi credentials
  - Upload code

---

## 🔧 PHASE 2: TÍCH HỢP & TEST (45 phút)

### 2.1 Test từng thành phần

#### Test MQTT Broker
```powershell
# Terminal 1: Subscribe
mosquitto_sub -h localhost -t "agri/sensor/data" -v

# Terminal 2: Publish (test)
mosquitto_pub -h localhost -t "agri/sensor/data" -m '{"temperature":25.5,"humidity":60.0}'
```

#### Test Backend API
```powershell
# Kiểm tra server đang chạy
curl http://localhost:3000

# Lấy dữ liệu mới nhất
curl http://localhost:3000/api/sensor-data/latest

# Lấy statistics
curl http://localhost:3000/api/statistics
```

#### Test ESP32
- Mở Serial Monitor
- Kiểm tra kết nối WiFi
- Kiểm tra kết nối MQTT
- Xem dữ liệu được gửi

### 2.2 Test tích hợp end-to-end

1. **ESP32 gửi data** → Serial Monitor hiển thị "📤 Đã gửi"
2. **MQTT nhận data** → `mosquitto_sub` hiển thị message
3. **Backend lưu data** → Console log "📊 Data received"
4. **Frontend hiển thị** → Dashboard cập nhật real-time

---

## 🎨 PHASE 3: FRONTEND DEVELOPMENT (1 giờ)

### 3.1 Dashboard hiện tại

✅ **Đã hoàn thành:**
- Card hiển thị nhiệt độ/độ ẩm hiện tại
- Statistics (Min/Max/Avg)
- Chart hiển thị lịch sử dữ liệu
- Auto-refresh mỗi 5 giây
- Responsive design

### 3.2 Cải tiến (Optional)

- [ ] **WebSocket cho real-time update**
  - Thay thế polling bằng WebSocket
  - Backend: `npm install socket.io`
  - Frontend: kết nối Socket.IO

- [ ] **Alerts & Notifications**
  - Cảnh báo khi nhiệt độ quá cao/thấp
  - Toast notifications
  - Email/SMS alerts (optional)

- [ ] **Data Export**
  - Export CSV
  - Export PDF report
  - Download chart as image

- [ ] **User Settings**
  - Cài đặt ngưỡng cảnh báo
  - Chọn đơn vị (°C/°F)
  - Theme (Dark/Light mode)

---

## 📈 PHASE 4: MỞ RỘNG TÍNH NĂNG (2-3 giờ)

### 4.1 Thêm Sensors

```cpp
// Thêm vào ESP32
const int SOIL_MOISTURE_PIN = 34;  // Cảm biến độ ẩm đất
const int LIGHT_SENSOR_PIN = 35;   // Cảm biến ánh sáng
```

**MQTT Message mới:**
```json
{
  "temperature": 28.5,
  "humidity": 65.3,
  "soilMoisture": 45.0,
  "lightLevel": 750,
  "timestamp": 1729338000000
}
```

### 4.2 Điều khiển Relay

```cpp
// ESP32 - Relay control
const int PUMP_RELAY = 25;
const int LIGHT_RELAY = 26;

// Subscribe topic
mqtt.subscribe("agri/control/pump");
mqtt.subscribe("agri/control/light");
```

**Frontend → Backend → MQTT → ESP32**
```javascript
// Frontend button click
fetch('/api/control/pump', {
  method: 'POST',
  body: JSON.stringify({ state: true })
});
```

### 4.3 Automation Rules

```javascript
// Backend - Auto control
if (soilMoisture < 30) {
  // Bật bơm nước
  mqtt.publish('agri/control/pump', JSON.stringify({ state: true }));
}

if (lightLevel < 500 && currentHour >= 18) {
  // Bật đèn
  mqtt.publish('agri/control/light', JSON.stringify({ state: true }));
}
```

---

## 💾 PHASE 5: DATABASE INTEGRATION (2 giờ)

### 5.1 Chọn Database

**Option 1: MongoDB** (Recommended cho IoT)
```javascript
npm install mongodb mongoose

const sensorSchema = new Schema({
  temperature: Number,
  humidity: Number,
  timestamp: Date,
  device: String
});
```

**Option 2: MySQL**
```sql
CREATE TABLE sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature FLOAT,
  humidity FLOAT,
  timestamp DATETIME,
  device VARCHAR(100)
);
```

**Option 3: InfluxDB** (Time-series database - tốt nhất cho IoT)
```javascript
npm install @influxdata/influxdb-client
```

### 5.2 Update Backend

```javascript
// Thay vì lưu trong RAM
sensorData.push(dataPoint);

// Lưu vào database
await SensorData.create(dataPoint);
```

---

## 🚀 PHASE 6: DEPLOYMENT (3 giờ)

### 6.1 Backend Deployment

**Option 1: Heroku**
```bash
heroku create iot-agri-backend
git push heroku main
```

**Option 2: AWS EC2**
- Launch EC2 instance
- Install Node.js, Mosquitto
- Deploy code
- Configure security groups

**Option 3: DigitalOcean**
- Create Droplet (Ubuntu)
- Setup PM2 for process management
```bash
npm install -g pm2
pm2 start server_dht11.js
pm2 startup
```

### 6.2 Frontend Deployment

**Option 1: GitHub Pages** (Static)
```bash
git add frontend/
git commit -m "Add dashboard"
git push origin main
```

**Option 2: Netlify** (Drag & drop)
- Kéo thả folder frontend lên netlify.com

**Option 3: Vercel**
```bash
npm install -g vercel
vercel --prod
```

### 6.3 MQTT Broker Cloud

**Option 1: CloudMQTT** (Free tier)
- Đăng ký tại cloudmqtt.com
- Update ESP32 với URL mới

**Option 2: HiveMQ Cloud**
- Free tier: hivemq.com/mqtt-cloud-broker

**Option 3: AWS IoT Core**
- Tích hợp sâu với AWS services

---

## 📱 PHASE 7: MOBILE APP (Optional - 5+ giờ)

### 7.1 React Native App

```bash
npx react-native init IoTAgriMobile
cd IoTAgriMobile
npm install axios mqtt socket.io-client
```

### 7.2 Flutter App

```bash
flutter create iot_agri_mobile
cd iot_agri_mobile
flutter pub add mqtt_client http charts_flutter
```

---

## 🔒 PHASE 8: SECURITY & OPTIMIZATION

### 8.1 Security

- [ ] **MQTT Authentication**
  ```javascript
  // Mosquitto: mosquitto.conf
  allow_anonymous false
  password_file /etc/mosquitto/passwd
  ```

- [ ] **API Authentication**
  ```javascript
  npm install jsonwebtoken
  // Implement JWT tokens
  ```

- [ ] **HTTPS/WSS**
  ```bash
  # Sử dụng Let's Encrypt
  certbot --nginx -d your-domain.com
  ```

### 8.2 Optimization

- [ ] **Data Compression**
  ```javascript
  app.use(compression());
  ```

- [ ] **Rate Limiting**
  ```javascript
  npm install express-rate-limit
  ```

- [ ] **Caching**
  ```javascript
  npm install redis
  ```

---

## 📊 TIMELINE SUMMARY

| Phase | Thời gian | Độ khó | Ưu tiên |
|-------|-----------|--------|---------|
| 1. Setup cơ bản | 30 phút | ⭐ | 🔴 CAO |
| 2. Tích hợp & Test | 45 phút | ⭐⭐ | 🔴 CAO |
| 3. Frontend Dev | 1 giờ | ⭐⭐ | 🔴 CAO |
| 4. Mở rộng tính năng | 2-3 giờ | ⭐⭐⭐ | 🟡 TRUNG BÌNH |
| 5. Database | 2 giờ | ⭐⭐ | 🟡 TRUNG BÌNH |
| 6. Deployment | 3 giờ | ⭐⭐⭐ | 🟢 THẤP |
| 7. Mobile App | 5+ giờ | ⭐⭐⭐⭐ | 🟢 THẤP |
| 8. Security | 2 giờ | ⭐⭐⭐ | 🟡 TRUNG BÌNH |

**Tổng thời gian tối thiểu:** ~2.5 giờ (Phase 1-3)
**Tổng thời gian đầy đủ:** ~15-20 giờ (All phases)

---

## ✅ CURRENT STATUS

### ✓ Đã hoàn thành:

1. ✅ ESP32 code với DHT11
2. ✅ MQTT integration
3. ✅ Backend server
4. ✅ REST API endpoints
5. ✅ Frontend dashboard
6. ✅ Real-time charts
7. ✅ Statistics display
8. ✅ Setup scripts

### 🔄 Đang làm:

- Testing end-to-end
- Debug issues

### 📋 Tiếp theo:

1. Test hệ thống hoàn chỉnh
2. Fix bugs (nếu có)
3. Deploy lên cloud (optional)
4. Thêm sensors khác (optional)

---

## 🎓 HỌC ĐƯỢC GÌ?

### Kiến thức kỹ thuật:
- ✅ ESP32 programming
- ✅ MQTT protocol
- ✅ Node.js backend development
- ✅ REST API design
- ✅ Frontend development
- ✅ Real-time data visualization
- ✅ IoT system architecture

### Kỹ năng:
- ✅ Full-stack IoT development
- ✅ Hardware-software integration
- ✅ Debugging distributed systems
- ✅ System architecture design

---

## 📚 TÀI LIỆU THAM KHẢO

- MQTT: https://mqtt.org/
- Mosquitto: https://mosquitto.org/documentation/
- ESP32: https://docs.espressif.com/
- Chart.js: https://www.chartjs.org/docs/
- Node.js: https://nodejs.org/docs/

---

**🚀 Chúc bạn thành công với project IoT Agriculture!**
