# 🔧 HƯỚNG DẪN SỬA LỖI "Host is unreachable"

## ❌ Lỗi hiện tại:
```
[E][WiFiClient.cpp:249] connect(): connect on fd 48, errno: 118, "Host is unreachable"
❌ Lỗi, rc=-2 | Thử lại sau 5s...
```

## 🔍 Nguyên nhân:
ESP32 không thể kết nối tới MQTT Broker vì **chưa cấu hình đúng địa chỉ IP**.

---

## ✅ GIẢI PHÁP

### **Bước 1: Xác định địa chỉ IP của máy tính**

Máy tính bạn có các IP sau:
- **172.20.10.10** (Wi-Fi) ⭐ KHUYẾN NGHỊ
- **192.168.1.20** (Ethernet)

**Chọn IP của mạng mà ESP32 sẽ kết nối!**

### **Bước 2: Sửa file ESP32**

Mở file: `esp32_firmware/esp32_agri_monitor.ino`

Tìm và sửa các dòng sau:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";          // ⬅️ Thay bằng tên WiFi của bạn
const char* password = "YOUR_WIFI_PASSWORD";   // ⬅️ Thay bằng mật khẩu WiFi

// MQTT Broker settings
const char* mqtt_server = "YOUR_MQTT_BROKER_IP"; // ⬅️ Thay bằng IP máy tính
const int mqtt_port = 1883;
const char* mqtt_user = "";                     // ⬅️ Để trống (không cần auth)
const char* mqtt_password = "";                 // ⬅️ Để trống
```

**VÍ DỤ CỤ THỂ:**
```cpp
// WiFi credentials (Ví dụ)
const char* ssid = "MyHomeWiFi";              // Tên WiFi nhà bạn
const char* password = "mypassword123";        // Mật khẩu WiFi

// MQTT Broker settings
const char* mqtt_server = "172.20.10.10";     // IP của máy tính (Wi-Fi)
const int mqtt_port = 1883;
const char* mqtt_user = "";                    // Không cần user
const char* mqtt_password = "";                // Không cần password
```

### **Bước 3: Upload lại code vào ESP32**

1. Mở Arduino IDE hoặc PlatformIO
2. Chọn đúng board **ESP32 Dev Module**
3. Chọn đúng COM Port (COM7)
4. Upload code

### **Bước 4: Kiểm tra kết nối**

Sau khi upload, mở **Serial Monitor** (115200 baud), bạn sẽ thấy:

```
✅ WiFi connected
📡 IP address: 172.20.10.xxx
🔌 Connecting to MQTT Broker...
✅ MQTT Connected
```

---

## 🔥 GIẢI PHÁP NHANH (Dùng MQTT Broker Cloud)

Nếu không muốn config IP phức tạp, dùng **broker công cộng**:

```cpp
// MQTT Broker settings (Dùng HiveMQ Cloud)
const char* mqtt_server = "broker.hivemq.com"; // ⬅️ Dùng broker cloud
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_password = "";
```

**Ưu điểm:**
- ✅ Không cần biết IP
- ✅ Kết nối từ mọi nơi
- ✅ Miễn phí

**Nhớ thay topic để tránh conflict:**
```cpp
const char* topic_sensor_data = "yourname_agri/sensor/data"; // Thêm prefix
```

---

## 📊 Kiểm tra MQTT Broker đang chạy

Chạy lệnh này trong PowerShell:

```powershell
netstat -ano | Select-String ":1883"
```

Nếu thấy kết quả có `LISTENING`, broker đang chạy ✅

---

## 🆘 Nếu vẫn lỗi:

1. **Tắt Firewall tạm thời** (Windows Defender)
2. **Kiểm tra ESP32 và máy tính cùng mạng WiFi**
3. **Ping thử từ ESP32**:
   ```cpp
   Serial.println(WiFi.localIP()); // Xem IP của ESP32
   ```
4. **Dùng MQTT Broker cloud** (HiveMQ/Mosquitto public)

---

## 📝 Checklist

- [ ] Đã thay `ssid` và `password` WiFi đúng
- [ ] Đã thay `mqtt_server` thành IP máy tính
- [ ] ESP32 và máy tính cùng mạng WiFi
- [ ] MQTT Broker đang chạy (port 1883)
- [ ] Đã upload lại code vào ESP32
- [ ] Serial Monitor hiển thị "MQTT Connected"

---

**Bạn cần tôi giúp sửa code trực tiếp không?** 😊
