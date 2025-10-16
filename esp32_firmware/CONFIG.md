# ESP32 Configuration Guide

## WiFi Configuration

Edit the following lines in `esp32_agri_monitor.ino`:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";          // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";  // Replace with your WiFi password
```

### Example:
```cpp
const char* ssid = "MyHomeWiFi";
const char* password = "MySecurePassword123";
```

## MQTT Configuration

```cpp
// MQTT Broker settings
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";  // IP address of MQTT broker
const int mqtt_port = 1883;                       // Default MQTT port
const char* mqtt_user = "YOUR_MQTT_USER";         // Optional: MQTT username
const char* mqtt_password = "YOUR_MQTT_PASSWORD"; // Optional: MQTT password
```

### For Local Network:
```cpp
const char* mqtt_server = "192.168.1.100";  // Your server's local IP
const int mqtt_port = 1883;
const char* mqtt_user = "";                  // Leave empty if no auth
const char* mqtt_password = "";
```

### For Cloud MQTT Broker (e.g., HiveMQ):
```cpp
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_user = "your_username";
const char* mqtt_password = "your_password";
```

## Hardware Pin Configuration

Default pin assignments:

```cpp
// Pin definitions
const int MOISTURE_SENSOR_PIN = 34;  // Analog pin for moisture sensor
const int PUMP_RELAY_PIN = 25;       // Digital pin for water pump relay
const int LIGHT_RELAY_PIN = 26;      // Digital pin for light relay
```

### Customization:
If you need to use different pins, modify these values:

```cpp
// Example: Using different pins
const int MOISTURE_SENSOR_PIN = 35;  // GPIO 35 (another ADC pin)
const int PUMP_RELAY_PIN = 32;       // GPIO 32
const int LIGHT_RELAY_PIN = 33;      // GPIO 33
```

**Note**: 
- Moisture sensor MUST use an ADC-capable pin (32-39)
- Relay pins can use any GPIO pin (but avoid GPIO 6-11)

## Sensor Calibration

### Moisture Sensor Calibration:

1. **Find dry value** (sensor in air):
```cpp
int sensorValue = analogRead(MOISTURE_SENSOR_PIN);
// Note this value, typically ~4095
```

2. **Find wet value** (sensor in water):
```cpp
int sensorValue = analogRead(MOISTURE_SENSOR_PIN);
// Note this value, typically ~1500-2000
```

3. **Update mapping**:
```cpp
// Current mapping (default)
int moisture = map(sensorValue, 4095, 0, 0, 100);

// Adjust based on your sensor
// Example: if dry=4095, wet=1500
int moisture = map(sensorValue, 4095, 1500, 0, 100);
```

## Default Settings

These can be changed via web interface after startup:

```cpp
// Configuration variables
int moistureThreshold = 40;          // Default threshold (%)
bool autoWatering = true;            // Auto watering enabled
int lightOnHour = 6;                 // Turn on light at 6 AM
int lightOffHour = 18;               // Turn off light at 6 PM
bool autoLight = true;               // Auto light control enabled
```

## Timing Configuration

```cpp
// Timing variables
const long sensorInterval = 5000;    // Send data every 5 seconds (5000ms)
```

To change update frequency:
```cpp
const long sensorInterval = 10000;   // 10 seconds
const long sensorInterval = 3000;    // 3 seconds
```

**Note**: Shorter intervals = more data but higher power consumption

## MQTT Topics Configuration

Default topics:

```cpp
// MQTT Topics
const char* topic_sensor_data = "agri/sensor/data";
const char* topic_pump_control = "agri/control/pump";
const char* topic_light_control = "agri/control/light";
const char* topic_config = "agri/config";
const char* topic_status = "agri/status";
```

For multiple devices, use unique topics:

```cpp
// Device 1
const char* topic_sensor_data = "agri/device1/sensor/data";
const char* topic_pump_control = "agri/device1/control/pump";
// ... etc

// Device 2
const char* topic_sensor_data = "agri/device2/sensor/data";
const char* topic_pump_control = "agri/device2/control/pump";
// ... etc
```

## Relay Logic Configuration

Default: HIGH = ON, LOW = OFF

```cpp
void controlPump(bool state) {
  digitalWrite(PUMP_RELAY_PIN, state ? HIGH : LOW);
}
```

Some relays are inverted (LOW = ON):

```cpp
void controlPump(bool state) {
  digitalWrite(PUMP_RELAY_PIN, state ? LOW : HIGH);  // Inverted
}
```

## Advanced Configuration

### Enable Serial Debugging:
```cpp
void setup() {
  Serial.begin(115200);  // Change baud rate if needed
  // ... rest of setup
}
```

### WiFi Power Management:
```cpp
void setup() {
  // ... 
  WiFi.setSleep(false);  // Disable WiFi sleep for better reliability
}
```

### MQTT Keep-Alive:
```cpp
// Adjust in PubSubClient library or use:
client.setKeepAlive(60);  // 60 seconds keep-alive
```

## Common Configuration Scenarios

### Scenario 1: Basic Home Setup
```cpp
const char* ssid = "HomeWiFi";
const char* password = "password123";
const char* mqtt_server = "192.168.1.100";
int moistureThreshold = 40;
int lightOnHour = 6;
int lightOffHour = 18;
```

### Scenario 2: Greenhouse with Multiple Zones
```cpp
// Zone A
const char* mqtt_client_id = "ESP32_Agri_ZoneA";
const char* topic_sensor_data = "agri/zoneA/sensor/data";

// Zone B
const char* mqtt_client_id = "ESP32_Agri_ZoneB";
const char* topic_sensor_data = "agri/zoneB/sensor/data";
```

### Scenario 3: Cloud-Connected
```cpp
const char* mqtt_server = "broker.hivemq.com";
const char* mqtt_user = "myusername";
const char* mqtt_password = "mypassword";
// Use unique client_id for each device
const char* mqtt_client_id = "ESP32_Agri_Device001";
```

## Testing Configuration

### Test WiFi Connection:
```cpp
void setup() {
  Serial.begin(115200);
  setupWiFi();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}
```

### Test MQTT Connection:
```cpp
void setup() {
  // ...
  client.setServer(mqtt_server, mqtt_port);
  if (client.connect(mqtt_client_id)) {
    Serial.println("MQTT connected!");
  } else {
    Serial.println("MQTT connection failed!");
  }
}
```

### Test Sensor Reading:
```cpp
void loop() {
  int moisture = readMoisture();
  Serial.print("Moisture: ");
  Serial.print(moisture);
  Serial.println("%");
  delay(1000);
}
```

## Troubleshooting Configuration

### WiFi Won't Connect:
1. Check SSID and password
2. Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
3. Check WiFi range
4. Try fixed channel on router

### MQTT Connection Fails:
1. Verify broker IP and port
2. Test with mosquitto_pub/sub
3. Check firewall rules
4. Verify username/password if auth is enabled

### Sensor Reading Wrong:
1. Check pin configuration
2. Verify sensor wiring
3. Calibrate sensor values
4. Test sensor with multimeter

## Security Best Practices

1. **Change default passwords**
2. **Use WPA2/WPA3 for WiFi**
3. **Enable MQTT authentication**
4. **Use TLS for MQTT (port 8883)**
5. **Don't commit credentials to Git**

### Example .gitignore entry:
```
config.h
credentials.h
secrets.h
```

Create separate `config.h`:
```cpp
// config.h
#define WIFI_SSID "MyWiFi"
#define WIFI_PASSWORD "MyPassword"
#define MQTT_SERVER "192.168.1.100"
#define MQTT_USER "user"
#define MQTT_PASSWORD "password"
```

Then in main file:
```cpp
#include "config.h"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
// ...
```
