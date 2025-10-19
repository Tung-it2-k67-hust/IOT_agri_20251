/*
 * ⚙️ ESP32 Configuration - SỬA CÁC GIÁ TRỊ DƯỚI ĐÂY
 * Copy các dòng này vào esp32_agri_monitor.ino (dòng 15-24)
 */

// ========== CẤU HÌNH WIFI ==========
const char* ssid = "TenWiFiCuaBan";           // ⬅️ THAY BẰNG TÊN WIFI CỦA BẠN
const char* password = "MatKhauWiFi";         // ⬅️ THAY BẰNG MẬT KHẨU WIFI

// ========== CẤU HÌNH MQTT BROKER ==========
// CÁCH 1: Dùng MQTT Broker trên máy tính (cùng mạng LAN)
const char* mqtt_server = "172.20.10.10";     // ⬅️ THAY BẰNG IP MÁY TÍNH CỦA BẠN
                                               //    Chạy lệnh: ipconfig (Windows)
                                               //    Hoặc: ifconfig (Linux/Mac)

// CÁCH 2: Dùng MQTT Broker Cloud (KHUYẾN NGHỊ - dễ hơn)
// const char* mqtt_server = "broker.hivemq.com";  // Uncomment dòng này nếu dùng cloud
// const char* mqtt_server = "test.mosquitto.org";  // Hoặc dùng mosquitto public

const int mqtt_port = 1883;
const char* mqtt_user = "";                   // Để trống (không cần authentication)
const char* mqtt_password = "";               // Để trống
const char* mqtt_client_id = "ESP32_Agri_Monitor";

// ========== HƯỚNG DẪN ==========
/*
1. LẤY ĐỊA CHỈ IP MÁY TÍNH:
   Windows PowerShell:
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"}
   
   Hoặc đơn giản hơn:
   ipconfig
   
   Tìm "Wi-Fi" hoặc "Ethernet" -> IPv4 Address

2. KIỂM TRA MQTT BROKER ĐANG CHẠY:
   netstat -ano | Select-String ":1883"
   
   Phải thấy dòng: TCP    0.0.0.0:1883    ...    LISTENING

3. ĐẢM BẢO CÙNG MẠNG:
   - ESP32 kết nối WiFi A
   - Máy tính cũng kết nối WiFi A
   - Hoặc máy tính kết nối cùng Router với WiFi A

4. TẮT FIREWALL (nếu cần):
   Windows: Settings > Windows Security > Firewall > Allow app
   Hoặc tắt tạm thời để test

5. NẾU VẪN LỖI - DÙNG CLOUD:
   Thay mqtt_server = "broker.hivemq.com"
   Đơn giản, không cần config gì thêm!
*/

// ========== VÍ DỤ CẤU HÌNH HOÀN CHỈNH ==========
/*
// WiFi credentials
const char* ssid = "TP-Link_5GHz";           // WiFi nhà bạn
const char* password = "mypassword123";       // Mật khẩu WiFi

// MQTT Broker - Localhost (máy tính)
const char* mqtt_server = "192.168.1.100";   // IP máy tính trong mạng LAN
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_password = "";

// HOẶC Dùng Cloud:
const char* mqtt_server = "broker.hivemq.com";
*/
