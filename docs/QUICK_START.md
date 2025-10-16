# Hướng Dẫn Sử Dụng Nhanh

## Bước 1: Chuẩn Bị

### Phần cứng:
- [ ] ESP32
- [ ] Cảm biến độ ẩm đất
- [ ] Module relay 2 kênh
- [ ] Máy bơm nước
- [ ] Đèn LED

### Phần mềm:
- [ ] Node.js (v16+)
- [ ] Mosquitto MQTT Broker
- [ ] Arduino IDE hoặc PlatformIO
- [ ] Trình duyệt web

## Bước 2: Cài Đặt MQTT Broker

### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### Test MQTT:
```bash
# Terminal 1 - Subscribe
mosquitto_sub -t "test/topic"

# Terminal 2 - Publish
mosquitto_pub -t "test/topic" -m "Hello MQTT"
```

## Bước 3: Cài Đặt Backend

```bash
cd backend
npm install
cp .env.example .env
```

Chỉnh sửa `.env`:
```
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
MQTT_USER=
MQTT_PASSWORD=
```

Chạy server:
```bash
npm start
```

## Bước 4: Kết Nối Phần Cứng

### Kết nối cảm biến độ ẩm:
```
Sensor VCC  →  ESP32 3.3V
Sensor GND  →  ESP32 GND
Sensor OUT  →  ESP32 GPIO 34
```

### Kết nối relay và máy bơm:
```
Relay VCC  →  ESP32 5V
Relay GND  →  ESP32 GND
Relay IN1  →  ESP32 GPIO 25 (Pump)
Relay IN2  →  ESP32 GPIO 26 (Light)
```

## Bước 5: Upload Code Lên ESP32

### Cấu hình WiFi và MQTT trong `esp32_agri_monitor.ino`:
```cpp
const char* ssid = "TEN_WIFI_CUA_BAN";
const char* password = "MAT_KHAU_WIFI";
const char* mqtt_server = "IP_CUA_MQTT_BROKER";
```

### Upload code:
1. Mở Arduino IDE
2. Chọn Board: ESP32 Dev Module
3. Chọn Port
4. Click Upload
5. Mở Serial Monitor (115200 baud)

## Bước 6: Truy Cập Web Interface

1. Mở trình duyệt
2. Truy cập: `http://localhost:3000`
3. Xem dữ liệu real-time

## Bước 7: Kiểm Tra Hoạt Động

### Checklist:
- [ ] ESP32 kết nối WiFi thành công
- [ ] ESP32 kết nối MQTT broker
- [ ] Backend nhận được dữ liệu từ ESP32
- [ ] Frontend hiển thị dữ liệu
- [ ] Điều khiển máy bơm hoạt động
- [ ] Điều khiển đèn hoạt động

### Debug:
```bash
# Xem log ESP32
pio device monitor

# Xem log backend
npm start

# Test MQTT
mosquitto_sub -t "agri/#" -v
```

## Bước 8: Cấu Hình Hệ Thống

### Trên Web Interface:
1. **Cài đặt ngưỡng độ ẩm**: 30-60%
2. **Cài đặt lịch đèn**: Bật lúc 6h, tắt lúc 18h
3. **Chọn chế độ**: Tự động hoặc thủ công

## Các Lệnh Hữu Ích

### Backend:
```bash
npm start          # Chạy server
npm run dev        # Chạy với nodemon (auto-reload)
```

### Test API:
```bash
# Lấy trạng thái
curl http://localhost:3000/api/status

# Bật máy bơm
curl -X POST http://localhost:3000/api/control/pump \
  -H "Content-Type: application/json" \
  -d '{"state": true, "mode": "manual"}'

# Cập nhật cấu hình
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"moistureThreshold": 45, "autoWatering": true}'
```

## Xử Lý Sự Cố Thường Gặp

### ESP32 không kết nối WiFi:
```
✓ Kiểm tra SSID và password
✓ WiFi phải là 2.4GHz
✓ Xem Serial Monitor để debug
```

### Backend không nhận dữ liệu:
```
✓ Kiểm tra MQTT broker đang chạy
✓ Kiểm tra IP và port
✓ Xem logs của backend và ESP32
```

### Frontend không hiển thị:
```
✓ Kiểm tra backend đang chạy
✓ Mở Developer Console (F12) xem lỗi
✓ Kiểm tra API_BASE trong index.html
```

## Mẹo Sử Dụng

1. **Hiệu chỉnh cảm biến**: Ngâm sensor trong nước và không khí để tìm giá trị min/max
2. **Ngưỡng tối ưu**: Phụ thuộc loại cây, thường 40-60%
3. **Tưới tự động**: Nên bật để tiết kiệm nước
4. **Giám sát**: Theo dõi dữ liệu vài ngày để điều chỉnh

## Video Hướng Dẫn

(Có thể thêm link video demo ở đây)

## Hỗ Trợ

Gặp vấn đề? Tạo issue trên GitHub hoặc liên hệ team.
