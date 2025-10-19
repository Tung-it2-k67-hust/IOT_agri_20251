# 📚 HƯỚNG DẪN CHI TIẾT - HỆ THỐNG IOT AGRICULTURE

## 📋 MỤC LỤC
1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Quy trình hoạt động](#3-quy-trình-hoạt-động)
4. [Hướng dẫn khởi động](#4-hướng-dẫn-khởi-động)
5. [Giải thích code chi tiết](#5-giải-thích-code-chi-tiết)
6. [Các lệnh CLI hữu ích](#6-các-lệnh-cli-hữu-ích)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 🏗️ Luồng dữ liệu (Data Flow)
```
┌─────────────┐       MQTT        ┌──────────────┐      HTTP/REST     ┌──────────────┐
│   ESP32     │ ──────────────────>│  Mosquitto   │<──────────────────>│   Backend    │
│   + DHT11   │  WiFi: 172.20.10.2 │  MQTT Broker │   localhost:1883   │   Node.js    │
└─────────────┘                    └──────────────┘                    └──────────────┘
      │                                                                         │
      │ Serial Monitor                                                          │ HTTP API
      │ (Debug)                                                                 │ :3000
      v                                                                         v
  PlatformIO                                                            ┌──────────────┐
   Terminal                                                             │  Frontend    │
                                                                        │   HTML/JS    │
                                                                        └──────────────┘
```

### 🎯 Vai trò từng thành phần:

| Thành phần | Vai trò | Công nghệ |
|------------|---------|-----------|
| **ESP32** | Thu thập dữ liệu nhiệt độ/độ ẩm từ DHT11, gửi qua MQTT | C++, Arduino Framework |
| **Mosquitto** | Message Broker, định tuyến MQTT messages | MQTT Protocol |
| **Backend** | Nhận dữ liệu từ MQTT, cung cấp REST API, lưu lịch sử | Node.js, Express |
| **Frontend** | Hiển thị dữ liệu realtime, vẽ biểu đồ | HTML5, Chart.js |

---

## 2. CẤU TRÚC THƯ MỤC

```
IOT_agri_20251/
│
├── 📁 backend/                          # Backend Server (Node.js)
│   ├── server_dht11.js                  # Main server file - MQTT subscriber + REST API
│   ├── package.json                     # Dependencies: express, mqtt, cors
│   └── node_modules/                    # Installed packages (sau khi npm install)
│
├── 📁 frontend/                         # Frontend Dashboard
│   └── dashboard_dht11.html             # Single-page app - Hiển thị data + chart
│
├── 📁 esp32_code/ (Optional)            # Backup ESP32 source code
│   └── main.cpp                         # Copy từ PlatformIO project
│
├── 📄 mosquitto_iot.conf                # Config cho Mosquitto - Quan trọng!
│
├── 📄 HUONG_DAN_CHI_TIET.md            # File này - Hướng dẫn toàn diện
├── 📄 HUONG_DAN_NHANH.md               # Quick start guide
├── 📄 README_DHT11.md                   # Tổng quan dự án
├── 📄 SETUP_GUIDE.md                    # Hướng dẫn cài đặt lần đầu
└── 📄 ROADMAP.md                        # Lộ trình phát triển

---
ESP32 Project (PlatformIO):
C:\Users\ngoth\OneDrive - Hanoi University of Science and Technology\Documents\PlatformIO\Projects\new_ini\
│
├── 📁 src/
│   ├── main.cpp                         # ESP32 firmware - DHT11 + MQTT client
│   ├── main_with_mqtt.cpp.bak           # Backup version
│   └── Project_1_ESP32_Hello_World.cpp.bak  # Old version
│
├── 📁 include/                          # Header files (nếu có)
├── 📁 lib/                              # Custom libraries (nếu có)
├── 📁 .pio/                             # PlatformIO build files
└── platformio.ini                       # Project config + dependencies
```

### 📂 Mục đích từng file quan trọng:

#### **mosquitto_iot.conf**
```conf
listener 1883 0.0.0.0    # Lắng nghe trên TẤT CẢ network interfaces
allow_anonymous true      # Cho phép kết nối không cần password
```
- **Tại sao quan trọng?** Mosquitto 2.0+ mặc định chỉ chấp nhận localhost. File này cho phép ESP32 kết nối từ xa.

#### **backend/server_dht11.js**
- Kết nối tới Mosquitto broker (`mqtt://localhost:1883`)
- Subscribe topic `agri/sensor/data`
- Lưu 1000 records gần nhất trong RAM
- Cung cấp 2 API endpoints:
  - `GET /api/sensor-data` → Lấy dữ liệu realtime
  - `GET /api/statistics` → Tính Min/Max/Avg

#### **frontend/dashboard_dht11.html**
- Gọi API mỗi 5 giây: `http://localhost:3000/api/sensor-data`
- Hiển thị nhiệt độ/độ ẩm với màu sắc thay đổi theo giá trị
- Vẽ biểu đồ Line Chart (Chart.js) - 20 điểm gần nhất
- Responsive design - hoạt động trên mobile

#### **src/main.cpp** (ESP32)
- Đọc DHT11 mỗi 5 giây
- Tự động kết nối WiFi (hỗ trợ nhiều SSID)
- Tự động reconnect MQTT nếu mất kết nối
- Serialize data thành JSON: `{"temp":29.3,"hum":70,"time":"..."}`
- Publish lên topic `agri/sensor/data`

#### **platformio.ini**
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200        # Tốc độ Serial Monitor
lib_deps = 
    adafruit/DHT sensor library@^1.4.4
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.5
```

---

## 3. QUY TRÌNH HOẠT ĐỘNG

### 🔄 Luồng xử lý chi tiết (Step-by-Step):

#### **Bước 1: ESP32 thu thập dữ liệu**
```cpp
// File: src/main.cpp - void loop()

1. Đọc DHT11 sensor
   dht.readTemperature() → 29.3°C
   dht.readHumidity()    → 70%

2. Kiểm tra data hợp lệ
   if (isnan(temp) || isnan(hum)) → Đọc lại

3. Tạo JSON payload
   {
     "temp": 29.3,
     "hum": 70,
     "time": "2025-10-19T10:01:30.024Z"
   }

4. Publish lên MQTT
   client.publish("agri/sensor/data", json_string)

5. In log Serial Monitor
   "📤 Đã gửi: Temp=29.3°C, Hum=70%"

6. Đợi 5 giây → Lặp lại
```

#### **Bước 2: Mosquitto định tuyến message**
```
MQTT Broker (Mosquitto):

1. Nhận message từ ESP32
   Topic: "agri/sensor/data"
   Client: ESP32_DHT11_Monitor (172.20.10.2)

2. Log message (nếu bật verbose: -v)
   "Received PUBLISH from ESP32_DHT11_Monitor (84 bytes)"

3. Chuyển tiếp tới TẤT CẢ subscribers của topic này
   → Backend server đang subscribe
```

#### **Bước 3: Backend xử lý và lưu trữ**
```javascript
// File: backend/server_dht11.js

mqttClient.on('message', (topic, message) => {
  // 1. Parse JSON
  const data = JSON.parse(message.toString());
  // { temp: 29.3, hum: 70, time: '...' }

  // 2. Lưu vào mảng (FIFO - First In First Out)
  sensorDataHistory.push(data);
  if (sensorDataHistory.length > 1000) {
    sensorDataHistory.shift(); // Xóa record cũ nhất
  }

  // 3. Log
  console.log('📊 Data received:', data);
});
```

#### **Bước 4: Frontend lấy và hiển thị**
```javascript
// File: frontend/dashboard_dht11.html

async function fetchData() {
  // 1. Gọi API
  const response = await fetch('http://localhost:3000/api/sensor-data');
  const data = await response.json();

  // 2. Cập nhật giao diện
  document.getElementById('temperature').innerText = data.temp + '°C';
  document.getElementById('humidity').innerText = data.hum + '%';

  // 3. Cập nhật biểu đồ
  addDataToChart(data.temp, data.hum, data.time);
}

// Lặp lại mỗi 5 giây
setInterval(fetchData, 5000);
```

---

## 4. HƯỚNG DẪN KHỞI ĐỘNG

### 🚀 Quy trình khởi động đầy đủ (từ đầu đến cuối):

#### **CHUẨN BỊ (Chỉ làm 1 lần)**

##### 1. Cài đặt phần mềm
```powershell
# Kiểm tra đã cài đặt chưa
node --version        # Phải có: v18.x.x trở lên
npm --version         # Phải có: 9.x.x trở lên
mosquitto --version   # Phải có: 2.0.18

# Nếu chưa có → Tải:
# Node.js: https://nodejs.org/
# Mosquitto: https://mosquitto.org/download/
```

##### 2. Cài dependencies cho Backend
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend
npm install
# Cài: express, mqtt, cors, body-parser
```

##### 3. Upload code lên ESP32 (PlatformIO)
```powershell
cd "C:\Users\ngoth\OneDrive - Hanoi University of Science and Technology\Documents\PlatformIO\Projects\new_ini"

# Build
pio run

# Upload
pio run --target upload

# Xem Serial Monitor
pio device monitor
```

---

#### **KHỞI ĐỘNG HỆ THỐNG (Mỗi lần sử dụng)**

##### ✅ Terminal 1: Mosquitto MQTT Broker
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251
& "C:\Program Files\mosquitto\mosquitto.exe" -c mosquitto_iot.conf -v
```

**Dấu hiệu thành công:**
```
1760867973: mosquitto version 2.0.18 starting
1760867973: Config loaded from mosquitto_iot.conf.
1760867973: Opening ipv4 listen socket on port 1883.
1760867973: mosquitto version 2.0.18 running
```

**Kiểm tra:**
```powershell
netstat -ano | findstr :1883
# Phải thấy: 0.0.0.0:1883 hoặc 172.20.10.10:1883
```

---

##### ✅ Terminal 2: Backend Server
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend
node server_dht11.js
```

**Dấu hiệu thành công:**
```
🚀 IoT Agriculture Backend Server
📡 Server running on: http://localhost:3000
✅ Connected to MQTT Broker
📡 Subscribed to: agri/sensor/data
📊 Data received: { temp: 29.3, hum: 70, time: '...' }
```

**Kiểm tra:**
```powershell
# Test API
curl http://localhost:3000/api/sensor-data
```

---

##### ✅ Terminal 3: ESP32 Serial Monitor (Debug)
```powershell
cd "C:\Users\ngoth\OneDrive - Hanoi University of Science and Technology\Documents\PlatformIO\Projects\new_ini"
pio device monitor
```

**Dấu hiệu thành công:**
```
🌡️ DHT11 IoT System Starting...
📡 Đang kết nối WiFi: Tung do son
✅ Đã kết nối WiFi!
📍 IP: 172.20.10.2
🔗 Đang kết nối MQTT...
✅ Đã kết nối MQTT Broker!
🌡️ Nhiệt độ: 29.30°C | 💧 Độ ẩm: 70.00%
📤 Đã gửi: Temp=29.3°C, Hum=70%
```

---

##### ✅ Bước 4: Mở Dashboard
```powershell
# Mở bằng Explorer
explorer D:\2025.1_monhoc\btl_iot\IOT_agri_20251\frontend\dashboard_dht11.html

# Hoặc trực tiếp double-click file
```

**Dashboard sẽ:**
- Tự động kết nối `http://localhost:3000`
- Hiển thị nhiệt độ/độ ẩm realtime
- Vẽ biểu đồ cập nhật mỗi 5 giây

---

### 📊 Kiểm tra hệ thống hoạt động

#### **Test từng layer:**

```powershell
# 1. Kiểm tra Mosquitto
netstat -ano | findstr :1883
# ✅ Phải thấy: 0.0.0.0:1883

# 2. Kiểm tra Backend
curl http://localhost:3000/api/sensor-data
# ✅ Phải trả về JSON: {"temp":29.3,"hum":70,...}

# 3. Kiểm tra ESP32 kết nối
# Xem Serial Monitor → Phải thấy "✅ Đã kết nối MQTT Broker!"

# 4. Test MQTT flow (nâng cao)
mosquitto_sub -h localhost -t agri/sensor/data -v
# ✅ Phải thấy message mỗi 5 giây
```

---

## 5. GIẢI THÍCH CODE CHI TIẾT

### 📱 ESP32 Firmware (main.cpp)

#### **1. Cấu hình WiFi**
```cpp
// Mảng chứa nhiều WiFi credentials
struct WiFiCredential {
  const char* ssid;
  const char* password;
};

WiFiCredential wifiCredentials[] = {
  {"Tung do son", "12345678"},
  {"Bs Son T4", "88888888"},
  {"YourWiFi3", "password3"}
};

void setupWiFi() {
  // Thử kết nối lần lượt từng WiFi
  for (int i = 0; i < NUM_WIFI_NETWORKS; i++) {
    Serial.printf("📡 Đang kết nối WiFi: %s\n", wifiCredentials[i].ssid);
    WiFi.begin(wifiCredentials[i].ssid, wifiCredentials[i].password);
    
    unsigned long startAttemptTime = millis();
    
    // Đợi 20 giây
    while (WiFi.status() != WL_CONNECTED && 
           millis() - startAttemptTime < 20000) {
      delay(500);
      Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Đã kết nối WiFi!");
      Serial.printf("📍 IP: %s\n", WiFi.localIP().toString().c_str());
      return;
    }
  }
  
  // Không kết nối được → Restart ESP32
  ESP.restart();
}
```

**Tại sao dùng mảng WiFi?**
- Portable: ESP32 tự chọn WiFi khả dụng
- Không cần đổi code khi đổi địa điểm

#### **2. MQTT Connection với Reconnect**
```cpp
void reconnectMQTT() {
  // Retry tối đa 5 lần
  int retryCount = 0;
  
  while (!client.connected() && retryCount < 5) {
    Serial.println("🔗 Đang kết nối MQTT...");
    
    // Kết nối với Client ID, Will message
    if (client.connect(
          "ESP32_DHT11_Monitor",      // Client ID
          NULL, NULL,                 // Username, Password (NULL = anonymous)
          "agri/sensor/status",       // Will Topic
          0, true, "offline"          // Will QoS, Retain, Message
        )) {
      Serial.println("✅ Đã kết nối MQTT Broker!");
      
      // Gửi status online
      client.publish("agri/sensor/status", "online", true);
      return;
    }
    
    // In lỗi
    Serial.printf("❌ Lỗi kết nối: rc=%d\n", client.state());
    // rc=-2: Cannot connect to broker
    // rc=-4: Connection timeout
    
    retryCount++;
    delay(5000);
  }
}
```

**MQTT Return Codes:**
- `0`: Connected successfully
- `-1`: Connection refused - protocol version
- `-2`: Connection refused - identifier rejected / **network unreachable**
- `-3`: Connection refused - server unavailable
- `-4`: Connection refused - bad username/password
- `-5`: Connection refused - not authorized

#### **3. Đọc DHT11 và Publish**
```cpp
void loop() {
  // 1. Kiểm tra kết nối
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop(); // Xử lý MQTT messages (PING/PONG)
  
  unsigned long currentMillis = millis();
  
  // 2. Publish mỗi 5 giây
  if (currentMillis - lastPublishTime >= publishInterval) {
    lastPublishTime = currentMillis;
    
    // 3. Đọc sensor
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    // 4. Kiểm tra valid
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("❌ Lỗi đọc DHT11!");
      return;
    }
    
    // 5. Tạo JSON
    StaticJsonDocument<200> doc;
    doc["temp"] = temperature;
    doc["hum"] = humidity;
    doc["time"] = millis(); // Thời gian từ khi boot
    
    char jsonBuffer[200];
    serializeJson(doc, jsonBuffer);
    
    // 6. Publish
    if (client.publish("agri/sensor/data", jsonBuffer)) {
      Serial.printf("📤 Đã gửi: Temp=%.1f°C, Hum=%.1f%%\n", 
                    temperature, humidity);
    }
  }
}
```

**Tại sao dùng millis() thay vì delay()?**
- `delay()` block toàn bộ ESP32 → MQTT không xử lý được PING
- `millis()` non-blocking → ESP32 vẫn xử lý MQTT trong lúc đợi

---

### 🖥️ Backend Server (server_dht11.js)

#### **1. Khởi tạo MQTT Client**
```javascript
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');

// Kết nối MQTT Broker
const mqttClient = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'backend_server_' + Math.random().toString(16).substr(2, 8),
  clean: true,        // Clean session
  reconnectPeriod: 5000  // Tự reconnect sau 5s nếu mất kết nối
});

// Event: Kết nối thành công
mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  
  // Subscribe topic
  mqttClient.subscribe('agri/sensor/data', (err) => {
    if (!err) {
      console.log('📡 Subscribed to: agri/sensor/data');
    }
  });
});
```

#### **2. Xử lý MQTT Message**
```javascript
let sensorDataHistory = []; // Lưu trong RAM
const MAX_HISTORY = 1000;

mqttClient.on('message', (topic, message) => {
  try {
    // Parse JSON
    const data = JSON.parse(message.toString());
    
    // Thêm timestamp server
    data.time = new Date().toISOString();
    
    // Lưu vào history (FIFO)
    sensorDataHistory.push(data);
    if (sensorDataHistory.length > MAX_HISTORY) {
      sensorDataHistory.shift(); // Xóa phần tử đầu tiên
    }
    
    console.log('📊 Data received:', data);
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});
```

**Tại sao lưu trong RAM, không dùng Database?**
- **Ưu điểm:** Nhanh, đơn giản, không cần setup DB
- **Nhược điểm:** Mất data khi restart server
- **Giải pháp nâng cao:** Dùng MongoDB/InfluxDB cho production

#### **3. REST API Endpoints**
```javascript
const app = express();
app.use(cors()); // Cho phép frontend gọi API

// GET latest data
app.get('/api/sensor-data', (req, res) => {
  if (sensorDataHistory.length > 0) {
    // Trả về record mới nhất
    const latestData = sensorDataHistory[sensorDataHistory.length - 1];
    res.json(latestData);
  } else {
    res.status(404).json({ error: 'No data available' });
  }
});

// GET statistics
app.get('/api/statistics', (req, res) => {
  if (sensorDataHistory.length === 0) {
    return res.status(404).json({ error: 'No data' });
  }
  
  // Tính toán
  const temps = sensorDataHistory.map(d => d.temp);
  const hums = sensorDataHistory.map(d => d.hum);
  
  const stats = {
    temperature: {
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
    },
    humidity: {
      min: Math.min(...hums),
      max: Math.max(...hums),
      avg: (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)
    },
    totalRecords: sensorDataHistory.length
  };
  
  res.json(stats);
});

// Start server
app.listen(3000, () => {
  console.log('📡 Server running on: http://localhost:3000');
});
```

---

### 🌐 Frontend Dashboard (dashboard_dht11.html)

#### **1. Fetch Data từ API**
```javascript
let tempData = [];
let humData = [];
let timeLabels = [];

async function fetchData() {
  try {
    // Gọi API
    const response = await fetch('http://localhost:3000/api/sensor-data');
    
    if (!response.ok) {
      throw new Error('Backend not responding');
    }
    
    const data = await response.json();
    
    // Cập nhật UI
    updateDisplay(data);
    
    // Cập nhật biểu đồ
    updateChart(data);
    
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    // Hiển thị lỗi trên UI
    document.getElementById('status').innerText = '⚠️ Mất kết nối Backend';
  }
}

// Gọi lần đầu
fetchData();

// Auto-refresh mỗi 5 giây
setInterval(fetchData, 5000);
```

#### **2. Hiển thị dữ liệu động**
```javascript
function updateDisplay(data) {
  // Nhiệt độ
  const tempElement = document.getElementById('temperature');
  tempElement.innerText = data.temp.toFixed(1) + '°C';
  
  // Đổi màu theo nhiệt độ
  if (data.temp > 35) {
    tempElement.style.color = '#ff4444'; // Đỏ - nóng
  } else if (data.temp > 30) {
    tempElement.style.color = '#ff9800'; // Cam - ấm
  } else {
    tempElement.style.color = '#4caf50'; // Xanh - mát
  }
  
  // Độ ẩm
  const humElement = document.getElementById('humidity');
  humElement.innerText = data.hum.toFixed(1) + '%';
  
  // Đổi màu theo độ ẩm
  if (data.hum < 30) {
    humElement.style.color = '#ff4444'; // Đỏ - khô
  } else if (data.hum > 80) {
    humElement.style.color = '#2196f3'; // Xanh dương - ẩm
  } else {
    humElement.style.color = '#4caf50'; // Xanh - lý tưởng
  }
  
  // Thời gian
  const timeElement = document.getElementById('last-update');
  const time = new Date(data.time);
  timeElement.innerText = `Cập nhật: ${time.toLocaleTimeString('vi-VN')}`;
}
```

#### **3. Biểu đồ Chart.js**
```javascript
// Khởi tạo Chart
const ctx = document.getElementById('sensorChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: tempData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Độ ẩm (%)',
        data: humData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {  // Trục nhiệt độ
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Nhiệt độ (°C)' }
      },
      y1: {  // Trục độ ẩm
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Độ ẩm (%)' },
        grid: { drawOnChartArea: false }
      }
    }
  }
});

function updateChart(data) {
  // Thêm data mới
  const time = new Date(data.time).toLocaleTimeString('vi-VN');
  timeLabels.push(time);
  tempData.push(data.temp);
  humData.push(data.hum);
  
  // Giới hạn 20 điểm (để chart không quá dài)
  if (timeLabels.length > 20) {
    timeLabels.shift();
    tempData.shift();
    humData.shift();
  }
  
  // Cập nhật chart
  chart.update();
}
```

---

## 6. CÁC LỆNH CLI HỮU ÍCH

### 🔍 Debugging & Monitoring

#### **1. Kiểm tra Network & Ports**
```powershell
# Kiểm tra IP của máy
ipconfig | Select-String -Pattern "IPv4","Wireless LAN"

# Kiểm tra port đang lắng nghe
netstat -ano | findstr :1883   # MQTT
netstat -ano | findstr :3000   # Backend

# Kiểm tra firewall (nếu không kết nối được)
Test-NetConnection -ComputerName localhost -Port 1883

# Kill process trên port
$pid = (netstat -ano | findstr :3000 | Select-String -Pattern '\d+$').Matches.Value
taskkill /PID $pid /F
```

#### **2. Tìm kiếm trong code (grep/findstr)**
```powershell
# Tìm string trong tất cả file .cpp
Get-ChildItem -Recurse -Filter *.cpp | Select-String "WiFi.begin"

# Tìm function definition
Get-ChildItem -Recurse -Filter *.cpp | Select-String "void setup"

# Tìm trong file cụ thể với context (3 dòng trước/sau)
Select-String "MQTT" .\src\main.cpp -Context 3,3

# Tìm tất cả TODO trong project
Get-ChildItem -Recurse -Filter *.cpp | Select-String "TODO"

# Count lines of code
(Get-Content .\src\main.cpp).Count
```

#### **3. Git commands (Version Control)**
```powershell
# Xem thay đổi
git status
git diff src/main.cpp

# Commit changes
git add .
git commit -m "Fix MQTT connection issue"

# Xem lịch sử
git log --oneline --graph

# Rollback changes
git checkout -- src/main.cpp
git reset --hard HEAD~1  # Undo last commit

# Tạo branch mới
git checkout -b feature/add-led-indicator
```

#### **4. PlatformIO CLI**
```powershell
cd "C:\Users\ngoth\OneDrive - Hanoi University of Science and Technology\Documents\PlatformIO\Projects\new_ini"

# Build project
pio run

# Upload to ESP32
pio run --target upload

# Serial Monitor
pio device monitor

# Clean build files
pio run --target clean

# Update libraries
pio pkg update

# List installed libraries
pio pkg list

# Add library
pio pkg install "adafruit/DHT sensor library@^1.4.4"

# Test code (nếu có unit tests)
pio test
```

#### **5. Node.js & NPM**
```powershell
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend

# Cài dependencies
npm install

# Cài package cụ thể
npm install express mqtt cors --save

# Update packages
npm update

# Kiểm tra outdated packages
npm outdated

# Xem dependency tree
npm list

# Run script
npm start  # (nếu định nghĩa trong package.json)

# Debug mode
node --inspect server_dht11.js
```

#### **6. MQTT Testing Tools**
```powershell
# Mosquitto có sẵn 2 tools test:

# Subscribe (lắng nghe messages)
mosquitto_sub -h localhost -t agri/sensor/data -v

# Publish (gửi test message)
mosquitto_pub -h localhost -t agri/sensor/data -m '{"temp":25,"hum":60}'

# Subscribe all topics (wildcard)
mosquitto_sub -h localhost -t '#' -v

# Subscribe với username/password (nếu cần)
mosquitto_sub -h localhost -t agri/sensor/data -u admin -P password
```

#### **7. File operations**
```powershell
# Tìm file
Get-ChildItem -Recurse -Filter "*.cpp"

# Copy file
Copy-Item src\main.cpp src\main.cpp.backup

# Compare 2 files
Compare-Object (Get-Content file1.txt) (Get-Content file2.txt)

# Count words/lines
Get-Content .\README.md | Measure-Object -Line -Word -Character

# Search and replace in file
(Get-Content .\src\main.cpp) -replace 'old_text', 'new_text' | Set-Content .\src\main.cpp
```

#### **8. System Monitoring**
```powershell
# CPU & Memory usage
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Disk space
Get-PSDrive

# Temperature (nếu có sensor)
Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi

# Network stats
Get-NetAdapterStatistics

# Process của Mosquitto
Get-Process | Where-Object {$_.Name -like "*mosquitto*"}
```

---

### 🐛 Debug ESP32 Serial Monitor

#### **Các message quan trọng:**

```
✅ Success messages:
  - "✅ Đã kết nối WiFi!" → WiFi OK
  - "✅ Đã kết nối MQTT Broker!" → MQTT OK
  - "📤 Đã gửi: Temp=..." → Data sent

❌ Error messages:
  - "❌ Lỗi kết nối: rc=-2" → Cannot reach MQTT broker
    → Fix: Kiểm tra IP broker, firewall
  
  - "❌ Lỗi đọc DHT11!" → Sensor error
    → Fix: Kiểm tra kết nối GPIO, power
  
  - "❌ WiFi disconnected!" → Mất kết nối WiFi
    → Fix: Kiểm tra signal, SSID/password
```

#### **Tăng mức độ debug:**
```cpp
// Thêm vào main.cpp để debug chi tiết

// 1. Debug WiFi
WiFi.printDiag(Serial);

// 2. Debug MQTT state
Serial.printf("MQTT State: %d\n", client.state());

// 3. Debug memory
Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());

// 4. Debug time since boot
Serial.printf("Uptime: %lu seconds\n", millis() / 1000);
```

---

## 7. TROUBLESHOOTING

### ❓ Các vấn đề thường gặp và cách fix:

#### **Problem 1: ESP32 không kết nối MQTT (rc=-2)**

**Triệu chứng:**
```
❌ Lỗi kết nối: rc=-2
```

**Nguyên nhân:**
- Mosquitto chỉ lắng nghe localhost (127.0.0.1)
- Firewall block port 1883
- Sai IP broker trong code

**Giải pháp:**
```powershell
# 1. Kiểm tra Mosquitto đang lắng nghe ở đâu
netstat -ano | findstr :1883
# Phải thấy: 0.0.0.0:1883 (không phải 127.0.0.1:1883)

# 2. Nếu thấy 127.0.0.1 → Dùng config file
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251
& "C:\Program Files\mosquitto\mosquitto.exe" -c mosquitto_iot.conf -v

# 3. Kiểm tra firewall
New-NetFirewallRule -DisplayName "Mosquitto MQTT" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow

# 4. Kiểm tra IP trong code ESP32
# File: src/main.cpp, dòng: const char* mqtt_server = "172.20.10.10";
# Phải khớp với IP máy chạy Mosquitto
ipconfig | Select-String "IPv4"
```

---

#### **Problem 2: Backend không nhận data từ MQTT**

**Triệu chứng:**
```
✅ Connected to MQTT Broker
📡 Subscribed to: agri/sensor/data
(Không có dòng "📊 Data received")
```

**Nguyên nhân:**
- Backend kết nối sai broker
- Topic không khớp
- ESP32 chưa gửi data

**Giải pháp:**
```powershell
# 1. Test MQTT bằng mosquitto_sub
mosquitto_sub -h localhost -t agri/sensor/data -v
# Phải thấy messages từ ESP32

# 2. Kiểm tra topic trong code
# ESP32: client.publish("agri/sensor/data", ...)
# Backend: mqttClient.subscribe('agri/sensor/data', ...)
# Phải giống nhau!

# 3. Restart backend
cd D:\2025.1_monhoc\btl_iot\IOT_agri_20251\backend
node server_dht11.js
```

---

#### **Problem 3: Dashboard không hiển thị data**

**Triệu chứng:**
- Biểu đồ không cập nhật
- Nhiệt độ/độ ẩm hiển thị "N/A"

**Nguyên nhân:**
- Backend không chạy
- CORS error
- API endpoint sai

**Giải pháp:**
```javascript
// 1. Mở DevTools trong browser (F12)
// Xem Console có lỗi gì

// 2. Test API trực tiếp
// Mở browser: http://localhost:3000/api/sensor-data
// Phải trả về JSON

// 3. Kiểm tra CORS
// File: server_dht11.js
const cors = require('cors');
app.use(cors()); // Phải có dòng này!

// 4. Check fetch URL
// File: dashboard_dht11.html
const response = await fetch('http://localhost:3000/api/sensor-data');
// Đúng port 3000!
```

---

#### **Problem 4: DHT11 đọc NaN**

**Triệu chứng:**
```
❌ Lỗi đọc DHT11!
```

**Nguyên nhân:**
- Chân GPIO sai
- Chân nguồn không ổn định
- DHT11 hỏng

**Giải pháp:**
```cpp
// 1. Kiểm tra kết nối vật lý
// VCC → 3.3V (KHÔNG dùng 5V!)
// DATA → GPIO 5
// GND → GND

// 2. Thêm delay sau setup
void setup() {
  dht.begin();
  delay(2000);  // Đợi DHT11 khởi động
}

// 3. Tăng DHT read timeout
DHT dht(DHTPIN, DHTTYPE, 11);  // 11 là timeout cycles

// 4. Test GPIO khác
#define DHTPIN 4  // Thử GPIO 4, 16, 17, 18...
```

---

#### **Problem 5: Port 3000 already in use**

**Triệu chứng:**
```
Error: listen EADDRINUSE :::3000
```

**Giải pháp:**
```powershell
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID_NUMBER> /F

# Hoặc đổi port trong server
# File: server_dht11.js
const PORT = 3001;  // Đổi sang 3001
app.listen(PORT, ...);
```

---

#### **Problem 6: ESP32 keep restarting (Brownout detector)**

**Triệu chứng:**
```
Brownout detector was triggered
ets Jun  8 2016 00:22:57
rst:0x10 (RTCWDT_RTC_RESET)
```

**Nguyên nhân:**
- Nguồn USB yếu
- DHT11 tiêu thụ quá nhiều dòng

**Giải pháp:**
```
1. Đổi cáp USB (dùng cáp ngắn, chất lượng tốt)
2. Đổi cổng USB trên máy tính (dùng cổng USB 3.0)
3. Dùng nguồn ngoài 5V 2A
4. Disable brownout detector (không khuyến khích):
   // Thêm vào platformio.ini
   board_build.f_cpu = 160000000L
   build_flags = 
     -D DISABLE_BROWNOUT_DETECTOR
```

---

### 🎓 Best Practices

#### **1. Code Organization**
```cpp
// ESP32: Tách functions ra file riêng
// Tạo: src/wifi_manager.h, src/mqtt_handler.h
#include "wifi_manager.h"
#include "mqtt_handler.h"

void setup() {
  WiFiManager::connect();
  MQTTHandler::setup();
}
```

#### **2. Error Handling**
```javascript
// Backend: Luôn wrap async trong try-catch
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    await saveToDatabase(data);
  } catch (error) {
    console.error('Error:', error);
    // Không để server crash
  }
});
```

#### **3. Logging**
```cpp
// ESP32: Dùng log levels
#define LOG_LEVEL_DEBUG 0
#define LOG_LEVEL_INFO 1
#define LOG_LEVEL_ERROR 2

#define CURRENT_LOG_LEVEL LOG_LEVEL_INFO

#if CURRENT_LOG_LEVEL <= LOG_LEVEL_DEBUG
  #define DEBUG_PRINT(x) Serial.print(x)
#else
  #define DEBUG_PRINT(x)
#endif
```

#### **4. Configuration Management**
```javascript
// Backend: Dùng environment variables
require('dotenv').config();

const config = {
  mqtt: {
    host: process.env.MQTT_HOST || 'localhost',
    port: process.env.MQTT_PORT || 1883
  },
  server: {
    port: process.env.SERVER_PORT || 3000
  }
};
```

---

## 🚀 NEXT STEPS

### Phase 1: Hoàn thiện (Đã xong ✅)
- [x] ESP32 đọc DHT11
- [x] MQTT communication
- [x] Backend server
- [x] Web dashboard
- [x] Portable với hotspot

### Phase 2: Nâng cao (Đề xuất)
- [ ] Thêm cảm biến độ ẩm đất
- [ ] LED indicator (Red/Green)
- [ ] Buzzer cảnh báo
- [ ] OTA Update (Update firmware qua WiFi)
- [ ] Deep Sleep mode (tiết kiệm pin)

### Phase 3: Production
- [ ] Database persistence (MongoDB/InfluxDB)
- [ ] User authentication
- [ ] Cloud deployment (AWS/Azure)
- [ ] Mobile app (React Native)
- [ ] Alert system (Email/SMS)

---

## 📞 SUPPORT

**Nếu gặp vấn đề:**

1. **Kiểm tra các terminal** - 3 terminal phải cùng chạy:
   - Terminal 1: Mosquitto
   - Terminal 2: Backend
   - Terminal 3: ESP32 Serial Monitor

2. **Xem logs** - Mỗi component đều có logs chi tiết

3. **Test từng layer** - Dùng các lệnh CLI ở phần 6

4. **Check documentation:**
   - `HUONG_DAN_NHANH.md` - Quick start
   - `README_DHT11.md` - Overview
   - `SETUP_GUIDE.md` - Installation

---

**✨ HẾT - Chúc bạn code vui vẻ! 🚀**

Created: October 19, 2025
Version: 1.0
Author: GitHub Copilot + User
