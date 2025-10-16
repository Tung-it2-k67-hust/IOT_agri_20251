/*
 * ESP32 Agriculture Monitoring System
 * Features:
 * - Moisture sensor reading every 5 seconds
 * - Automatic watering based on threshold
 * - Light control with schedule
 * - Manual control via MQTT
 * - WiFi connectivity
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;
const char* mqtt_user = "YOUR_MQTT_USER";
const char* mqtt_password = "YOUR_MQTT_PASSWORD";
const char* mqtt_client_id = "ESP32_Agri_Monitor";

// MQTT Topics
const char* topic_sensor_data = "agri/sensor/data";
const char* topic_pump_control = "agri/control/pump";
const char* topic_light_control = "agri/control/light";
const char* topic_config = "agri/config";
const char* topic_status = "agri/status";

// Pin definitions
const int MOISTURE_SENSOR_PIN = 34;  // Analog pin for moisture sensor
const int PUMP_RELAY_PIN = 25;       // Digital pin for water pump relay
const int LIGHT_RELAY_PIN = 26;      // Digital pin for light relay

// Configuration variables
int moistureThreshold = 40;          // Default threshold (%)
bool autoWatering = true;            // Auto watering enabled by default
bool autoPumpState = false;          // Current auto pump state
bool manualPumpOverride = false;     // Manual override
bool manualLightOverride = false;    // Manual light override
int lightOnHour = 6;                 // Turn on light at 6 AM
int lightOffHour = 18;               // Turn off light at 6 PM
bool autoLight = true;               // Auto light control enabled

// Timing variables
unsigned long lastSensorRead = 0;
const long sensorInterval = 5000;    // Send data every 5 seconds

WiFiClient espClient;
PubSubClient client(espClient);

// Function declarations
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
int readMoisture();
void controlPump(bool state);
void controlLight(bool state);
void publishSensorData();
void publishStatus();
bool shouldLightBeOn();

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  pinMode(MOISTURE_SENSOR_PIN, INPUT);
  
  // Initial state - everything off
  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(LIGHT_RELAY_PIN, LOW);
  
  // Setup WiFi and MQTT
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  Serial.println("ESP32 Agriculture Monitor Started");
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Read and publish sensor data every 5 seconds
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= sensorInterval) {
    lastSensorRead = currentMillis;
    
    int moisture = readMoisture();
    
    // Auto watering logic
    if (autoWatering && !manualPumpOverride) {
      if (moisture < moistureThreshold && !autoPumpState) {
        controlPump(true);
        autoPumpState = true;
        Serial.println("Auto watering: ON (moisture below threshold)");
      } else if (moisture >= moistureThreshold && autoPumpState) {
        controlPump(false);
        autoPumpState = false;
        Serial.println("Auto watering: OFF (moisture above threshold)");
      }
    }
    
    // Auto light control
    if (autoLight && !manualLightOverride) {
      bool shouldBeOn = shouldLightBeOn();
      controlLight(shouldBeOn);
    }
    
    // Publish sensor data
    publishSensorData();
  }
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to control topics
      client.subscribe(topic_pump_control);
      client.subscribe(topic_light_control);
      client.subscribe(topic_config);
      
      // Publish status
      publishStatus();
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Parse JSON message
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Handle pump control
  if (strcmp(topic, topic_pump_control) == 0) {
    bool state = doc["state"];
    String mode = doc["mode"] | "auto";
    
    if (mode == "manual") {
      manualPumpOverride = true;
      controlPump(state);
      Serial.print("Manual pump control: ");
      Serial.println(state ? "ON" : "OFF");
    } else if (mode == "auto") {
      manualPumpOverride = false;
      Serial.println("Pump returned to auto mode");
    }
    publishStatus();
  }
  
  // Handle light control
  else if (strcmp(topic, topic_light_control) == 0) {
    bool state = doc["state"];
    String mode = doc["mode"] | "auto";
    
    if (mode == "manual") {
      manualLightOverride = true;
      controlLight(state);
      Serial.print("Manual light control: ");
      Serial.println(state ? "ON" : "OFF");
    } else if (mode == "auto") {
      manualLightOverride = false;
      Serial.println("Light returned to auto mode");
    }
    publishStatus();
  }
  
  // Handle configuration
  else if (strcmp(topic, topic_config) == 0) {
    if (doc.containsKey("moistureThreshold")) {
      moistureThreshold = doc["moistureThreshold"];
      Serial.print("Moisture threshold updated: ");
      Serial.println(moistureThreshold);
    }
    if (doc.containsKey("autoWatering")) {
      autoWatering = doc["autoWatering"];
      Serial.print("Auto watering: ");
      Serial.println(autoWatering ? "enabled" : "disabled");
    }
    if (doc.containsKey("lightOnHour")) {
      lightOnHour = doc["lightOnHour"];
      Serial.print("Light on hour: ");
      Serial.println(lightOnHour);
    }
    if (doc.containsKey("lightOffHour")) {
      lightOffHour = doc["lightOffHour"];
      Serial.print("Light off hour: ");
      Serial.println(lightOffHour);
    }
    if (doc.containsKey("autoLight")) {
      autoLight = doc["autoLight"];
      Serial.print("Auto light: ");
      Serial.println(autoLight ? "enabled" : "disabled");
    }
    publishStatus();
  }
}

int readMoisture() {
  // Read analog value from moisture sensor
  int sensorValue = analogRead(MOISTURE_SENSOR_PIN);
  
  // Convert to percentage (0-100%)
  // Assuming sensor range: 0 (wet) to 4095 (dry)
  // Invert so 100% = wet, 0% = dry
  int moisture = map(sensorValue, 4095, 0, 0, 100);
  moisture = constrain(moisture, 0, 100);
  
  return moisture;
}

void controlPump(bool state) {
  digitalWrite(PUMP_RELAY_PIN, state ? HIGH : LOW);
}

void controlLight(bool state) {
  digitalWrite(LIGHT_RELAY_PIN, state ? HIGH : LOW);
}

void publishSensorData() {
  int moisture = readMoisture();
  bool pumpState = digitalRead(PUMP_RELAY_PIN);
  bool lightState = digitalRead(LIGHT_RELAY_PIN);
  
  StaticJsonDocument<200> doc;
  doc["moisture"] = moisture;
  doc["pumpState"] = pumpState;
  doc["lightState"] = lightState;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish(topic_sensor_data, buffer);
  
  Serial.print("Published sensor data: ");
  Serial.println(buffer);
}

void publishStatus() {
  StaticJsonDocument<300> doc;
  doc["moistureThreshold"] = moistureThreshold;
  doc["autoWatering"] = autoWatering;
  doc["manualPumpOverride"] = manualPumpOverride;
  doc["manualLightOverride"] = manualLightOverride;
  doc["lightOnHour"] = lightOnHour;
  doc["lightOffHour"] = lightOffHour;
  doc["autoLight"] = autoLight;
  doc["pumpState"] = digitalRead(PUMP_RELAY_PIN);
  doc["lightState"] = digitalRead(LIGHT_RELAY_PIN);
  
  char buffer[400];
  serializeJson(doc, buffer);
  
  client.publish(topic_status, buffer);
  
  Serial.print("Published status: ");
  Serial.println(buffer);
}

bool shouldLightBeOn() {
  // Get current time (you would need to implement NTP for real time)
  // For simplicity, using a mock hour value
  // In production, use time library and NTP
  
  // Mock implementation - always returns false
  // Replace with actual time checking:
  // time_t now = time(nullptr);
  // struct tm* timeinfo = localtime(&now);
  // int currentHour = timeinfo->tm_hour;
  // return (currentHour >= lightOnHour && currentHour < lightOffHour);
  
  return false; // Placeholder
}
