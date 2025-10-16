# Communication Protocol Documentation

## Overview

This document describes the communication protocols used in the IoT Agriculture Monitoring System.

## System Components Communication

```
┌──────────┐       WiFi/MQTT        ┌──────────────┐
│  ESP32   │◄──────────────────────►│ MQTT Broker  │
└──────────┘                         └──────┬───────┘
                                            │
                                            │ MQTT
                                            │
                                     ┌──────▼────────┐
                                     │   Backend     │
                                     │   (Node.js)   │
                                     └──────┬────────┘
                                            │
                                            │ REST/HTTP
                                            │
                                     ┌──────▼────────┐
                                     │   Frontend    │
                                     │   (Web)       │
                                     └───────────────┘
```

## 1. ESP32 ↔ MQTT Broker

### Protocol: MQTT v3.1.1
- **Transport**: TCP/IP over WiFi
- **Port**: 1883 (unencrypted) or 8883 (TLS)
- **QoS**: QoS 0 (At most once)

### Connection Parameters:
```cpp
broker: "mqtt://192.168.1.100:1883"
client_id: "ESP32_Agri_Monitor"
username: "iot_user"  // optional
password: "********"  // optional
keep_alive: 60 seconds
clean_session: true
```

### Published Topics (ESP32 → Broker):

#### Topic: `agri/sensor/data`
**Frequency**: Every 5 seconds
**Payload Format**: JSON
```json
{
  "moisture": 65,
  "pumpState": false,
  "lightState": true,
  "timestamp": 1234567890
}
```

**Field Descriptions**:
- `moisture` (int): Soil moisture percentage (0-100)
- `pumpState` (boolean): Current water pump state
- `lightState` (boolean): Current light state
- `timestamp` (long): Milliseconds since boot

#### Topic: `agri/status`
**Frequency**: On change or request
**Payload Format**: JSON
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

### Subscribed Topics (Broker → ESP32):

#### Topic: `agri/control/pump`
**Purpose**: Control water pump
**Payload Format**: JSON
```json
{
  "state": true,
  "mode": "manual"
}
```

**Fields**:
- `state` (boolean): true = ON, false = OFF
- `mode` (string): "manual" or "auto"

**Behavior**:
- `mode: "manual"` + `state: true`: Turn pump ON manually
- `mode: "manual"` + `state: false`: Turn pump OFF manually
- `mode: "auto"`: Return to automatic control

#### Topic: `agri/control/light`
**Purpose**: Control lighting
**Payload Format**: JSON
```json
{
  "state": true,
  "mode": "manual"
}
```

**Fields**: Same as pump control

#### Topic: `agri/config`
**Purpose**: Update system configuration
**Payload Format**: JSON
```json
{
  "moistureThreshold": 45,
  "autoWatering": true,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true
}
```

**Fields**:
- `moistureThreshold` (int): Moisture threshold percentage (0-100)
- `autoWatering` (boolean): Enable/disable auto watering
- `lightOnHour` (int): Hour to turn on light (0-23)
- `lightOffHour` (int): Hour to turn off light (0-23)
- `autoLight` (boolean): Enable/disable auto light control

**Note**: All fields are optional. Only send fields that need updating.

## 2. Backend ↔ MQTT Broker

### Protocol: MQTT v5.0 (backward compatible with v3.1.1)
- **Library**: mqtt.js
- **Connection**: Persistent WebSocket or TCP

### Connection:
```javascript
const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'iot_user',
  password: 'password',
  reconnectPeriod: 1000,
  clientId: 'backend_server_' + Math.random().toString(16).substr(2, 8)
});
```

### Operations:

#### Subscribe:
```javascript
client.subscribe('agri/sensor/data');
client.subscribe('agri/status');
```

#### Publish:
```javascript
// Control pump
client.publish('agri/control/pump', JSON.stringify({
  state: true,
  mode: 'manual'
}));

// Update config
client.publish('agri/config', JSON.stringify({
  moistureThreshold: 45,
  autoWatering: true
}));
```

## 3. Frontend ↔ Backend

### Protocol: HTTP/1.1
- **Method**: REST API
- **Format**: JSON
- **CORS**: Enabled

### API Endpoints:

#### GET `/api/status`
**Purpose**: Get current system status
**Response**:
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

#### GET `/api/sensor-data/latest`
**Purpose**: Get latest sensor reading
**Response**:
```json
{
  "moisture": 65,
  "pumpState": false,
  "lightState": true,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

#### GET `/api/sensor-data?limit=100`
**Purpose**: Get historical sensor data
**Query Parameters**:
- `limit` (optional): Number of records (default: 100)

**Response**:
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

#### POST `/api/control/pump`
**Purpose**: Control water pump
**Request Body**:
```json
{
  "state": true,
  "mode": "manual"
}
```

**Response**:
```json
{
  "success": true,
  "state": true,
  "mode": "manual"
}
```

#### POST `/api/control/light`
**Purpose**: Control lighting
**Request Body**:
```json
{
  "state": true,
  "mode": "manual"
}
```

**Response**:
```json
{
  "success": true,
  "state": true,
  "mode": "manual"
}
```

#### POST `/api/config`
**Purpose**: Update system configuration
**Request Body**:
```json
{
  "moistureThreshold": 45,
  "autoWatering": true,
  "lightOnHour": 6,
  "lightOffHour": 18,
  "autoLight": true
}
```

**Response**:
```json
{
  "success": true,
  "config": {
    "moistureThreshold": 45,
    "autoWatering": true
  }
}
```

## 4. Data Flow Sequences

### Sensor Reading Flow:
```
1. ESP32: Read moisture sensor
2. ESP32 → MQTT: Publish to 'agri/sensor/data'
3. Backend: Receive and store data
4. Frontend → Backend: GET /api/sensor-data/latest
5. Frontend: Display data
```

### Manual Control Flow:
```
1. User: Click "Turn ON Pump" on web
2. Frontend → Backend: POST /api/control/pump
3. Backend → MQTT: Publish to 'agri/control/pump'
4. ESP32: Receive command
5. ESP32: Activate pump relay
6. ESP32 → MQTT: Publish status update
7. Backend: Update stored status
```

### Configuration Update Flow:
```
1. User: Update threshold on web
2. Frontend → Backend: POST /api/config
3. Backend → MQTT: Publish to 'agri/config'
4. ESP32: Receive and apply config
5. ESP32 → MQTT: Publish status confirmation
6. Backend: Update stored config
```

## 5. Error Handling

### ESP32:
- **WiFi Disconnection**: Auto-reconnect every 5 seconds
- **MQTT Disconnection**: Auto-reconnect every 5 seconds
- **Sensor Error**: Return last valid reading
- **Invalid MQTT Message**: Log error, ignore message

### Backend:
- **MQTT Disconnection**: Auto-reconnect (reconnectPeriod: 1000ms)
- **Invalid JSON**: Return 400 Bad Request
- **MQTT Publish Fail**: Return 500 Internal Server Error

### Frontend:
- **API Error**: Display error message to user
- **Network Timeout**: Retry after delay
- **No Data**: Show "Waiting for data..."

## 6. Security Considerations

### Recommended Practices:
1. **MQTT**: Use TLS encryption (port 8883)
2. **MQTT**: Enable authentication (username/password)
3. **Backend**: Implement API authentication
4. **Network**: Use separate VLAN for IoT devices
5. **Credentials**: Never hardcode in source code

### Example TLS Configuration:
```cpp
// ESP32
WiFiClientSecure espClient;
espClient.setCACert(ca_cert);
PubSubClient client(espClient);
```

```javascript
// Backend
const client = mqtt.connect('mqtts://broker:8883', {
  ca: fs.readFileSync('./ca.crt'),
  cert: fs.readFileSync('./client.crt'),
  key: fs.readFileSync('./client.key')
});
```

## 7. Testing

### MQTT Testing:
```bash
# Subscribe to all topics
mosquitto_sub -h localhost -t "agri/#" -v

# Publish test command
mosquitto_pub -h localhost -t "agri/control/pump" \
  -m '{"state": true, "mode": "manual"}'
```

### API Testing:
```bash
# Get status
curl http://localhost:3000/api/status

# Control pump
curl -X POST http://localhost:3000/api/control/pump \
  -H "Content-Type: application/json" \
  -d '{"state": true, "mode": "manual"}'
```

## 8. Performance Metrics

- **Sensor Update Rate**: 5 seconds
- **MQTT Latency**: < 100ms (local network)
- **API Response Time**: < 50ms
- **Data Retention**: Last 1000 readings (in-memory)

## Appendix: Message Size Limits

- **MQTT Payload**: Max 268,435,456 bytes (256 MB)
- **Typical Payload**: ~100-200 bytes
- **HTTP Request**: Max 100 KB (configurable)
- **HTTP Response**: No limit (stream capable)
