# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Web Browser (Frontend)                      │  │
│  │  - Real-time dashboard                                   │  │
│  │  - Manual controls                                       │  │
│  │  - Configuration settings                                │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTP/REST API
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                    Application Layer                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Backend Server (Node.js/Express)               │ │
│  │  - REST API endpoints                                    │ │
│  │  - MQTT client                                           │ │
│  │  - Data storage (in-memory)                              │ │
│  │  - Business logic                                        │ │
│  └───────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │ MQTT Protocol
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                   Communication Layer                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              MQTT Broker (Mosquitto)                     │ │
│  │  - Message routing                                       │ │
│  │  - Topic management                                      │ │
│  │  - Connection handling                                   │ │
│  └───────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │ MQTT Protocol
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                      Device Layer                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   ESP32 Firmware                         │ │
│  │  - WiFi connectivity                                     │ │
│  │  - MQTT client                                           │ │
│  │  - Sensor reading                                        │ │
│  │  - Actuator control                                      │ │
│  └───────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │ GPIO/ADC
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                    Hardware Layer                             │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Moisture   │  │  Relay Module│  │  Relay Module│        │
│  │    Sensor    │  │  (Water Pump)│  │    (Light)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Hardware Layer

#### Moisture Sensor
- **Type**: Capacitive or Resistive
- **Output**: Analog voltage (0-3.3V)
- **Range**: 0-100% moisture
- **Connection**: GPIO 34 (ADC)

#### Water Pump Relay
- **Type**: 5V relay module
- **Control**: Digital signal (HIGH/LOW)
- **Connection**: GPIO 25
- **Rating**: Depends on pump specifications

#### Light Relay
- **Type**: 5V relay module
- **Control**: Digital signal (HIGH/LOW)
- **Connection**: GPIO 26
- **Rating**: Depends on light specifications

### 2. Device Layer (ESP32)

#### Responsibilities:
- Read sensor data every 5 seconds
- Control actuators (pump, light)
- Maintain WiFi connection
- Handle MQTT communication
- Implement auto-control logic
- Process remote commands

#### Key Components:
```cpp
// WiFi Management
WiFi.begin(ssid, password)
WiFi.status()

// MQTT Client
PubSubClient client(espClient)
client.publish(topic, message)
client.subscribe(topic)

// Sensor Reading
analogRead(MOISTURE_SENSOR_PIN)

// Actuator Control
digitalWrite(PUMP_RELAY_PIN, HIGH/LOW)
digitalWrite(LIGHT_RELAY_PIN, HIGH/LOW)
```

### 3. Communication Layer (MQTT Broker)

#### Responsibilities:
- Route messages between ESP32 and Backend
- Manage subscriptions
- Handle connections
- Buffer messages (QoS dependent)

#### Topics Structure:
```
agri/
├── sensor/
│   └── data          (ESP32 → Backend)
├── control/
│   ├── pump          (Backend → ESP32)
│   └── light         (Backend → ESP32)
├── config            (Backend → ESP32)
└── status            (ESP32 → Backend)
```

### 4. Application Layer (Backend)

#### Responsibilities:
- Provide REST API for frontend
- Act as MQTT client
- Store sensor data (in-memory)
- Process and validate requests
- Forward commands to ESP32

#### Key Modules:
```javascript
// Express Server
app.get('/api/status')
app.post('/api/control/pump')
app.post('/api/config')

// MQTT Client
mqttClient.on('message', handleMessage)
mqttClient.publish(topic, message)

// Data Storage
let sensorData = []
let currentStatus = {}
```

### 5. User Interface Layer (Frontend)

#### Responsibilities:
- Display real-time sensor data
- Provide manual controls
- Configuration interface
- Status visualization

#### Key Features:
- Responsive design
- Auto-refresh every 5 seconds
- Manual/Auto mode toggle
- Real-time status indicators

## Data Flow

### 1. Sensor Reading Flow
```
┌─────────┐
│  ESP32  │
│ Sensor  │──┐
└─────────┘  │
             │ 1. Read ADC
             │ 2. Convert to %
             │ 3. JSON encode
             ▼
        ┌─────────┐
        │  MQTT   │
        │ Publish │
        └────┬────┘
             │ Topic: agri/sensor/data
             ▼
        ┌─────────┐
        │  MQTT   │
        │ Broker  │
        └────┬────┘
             │
             ▼
        ┌─────────┐
        │ Backend │
        │Subscribe│
        └────┬────┘
             │ 4. Store data
             │ 5. Update status
             ▼
        ┌─────────┐
        │   API   │
        │Response │
        └────┬────┘
             │ GET /api/sensor-data/latest
             ▼
        ┌─────────┐
        │Frontend │
        │ Display │
        └─────────┘
```

### 2. Manual Control Flow
```
┌─────────┐
│  User   │
│  Click  │──┐
└─────────┘  │
             │ 1. Button click
             ▼
        ┌─────────┐
        │Frontend │
        │  POST   │
        └────┬────┘
             │ /api/control/pump
             │ {state: true, mode: "manual"}
             ▼
        ┌─────────┐
        │ Backend │
        │Validate │
        └────┬────┘
             │ 2. Validate request
             │ 3. Publish MQTT
             ▼
        ┌─────────┐
        │  MQTT   │
        │ Broker  │
        └────┬────┘
             │ Topic: agri/control/pump
             ▼
        ┌─────────┐
        │  ESP32  │
        │Subscribe│
        └────┬────┘
             │ 4. Receive command
             │ 5. Control relay
             │ 6. Publish status
             ▼
        ┌─────────┐
        │  Pump   │
        │  ON/OFF │
        └─────────┘
```

### 3. Auto-Control Flow
```
┌─────────┐
│  ESP32  │
│  Timer  │──┐
└─────────┘  │
             │ Every 5 seconds
             ▼
        ┌─────────┐
        │  Read   │
        │Moisture │
        └────┬────┘
             │
             ▼
        ┌─────────┐
        │ Compare │
        │Threshold│
        └────┬────┘
             │
        ┌────▼────┐
        │Moisture │
        │< Thresh?│
        └────┬────┘
             │
      ┌──────┴──────┐
      │ YES      NO  │
      ▼              ▼
  ┌────────┐    ┌────────┐
  │  Pump  │    │  Pump  │
  │   ON   │    │  OFF   │
  └────────┘    └────────┘
```

## Deployment Architecture

### Local Network Deployment
```
┌────────────────────────────────────────────┐
│           Local Network                     │
│                                            │
│  ┌──────────┐     ┌──────────┐           │
│  │  ESP32   │────►│  Router  │           │
│  │ (WiFi)   │     │          │           │
│  └──────────┘     └─────┬────┘           │
│                          │                │
│  ┌──────────┐     ┌─────▼────┐           │
│  │   PC     │────►│  Server  │           │
│  │(Browser) │     │ Backend  │           │
│  └──────────┘     │ +Mosquitto          │
│                    └──────────┘           │
└────────────────────────────────────────────┘

IP Configuration:
- Router: 192.168.1.1
- Server: 192.168.1.100 (static)
- ESP32: 192.168.1.101 (DHCP/static)
```

### Cloud Deployment (Optional)
```
┌────────────────┐
│     ESP32      │
│   (Home WiFi)  │
└───────┬────────┘
        │ Internet
        ▼
┌────────────────┐
│  Cloud MQTT    │
│  (HiveMQ/AWS)  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Cloud Server  │
│   (Backend)    │
└───────┬────────┘
        │ HTTPS
        ▼
┌────────────────┐
│   Web Client   │
│   (Anywhere)   │
└────────────────┘
```

## Security Architecture

### Network Security
```
┌──────────────────────────────────────┐
│         Firewall Rules               │
├──────────────────────────────────────┤
│ Allow: ESP32 → MQTT (1883/8883)     │
│ Allow: Web → Backend (3000/443)     │
│ Deny:  External → MQTT              │
│ Deny:  External → Backend (if local)│
└──────────────────────────────────────┘
```

### Authentication Flow
```
ESP32 → MQTT:
  username: iot_device
  password: ********
  client_id: ESP32_Agri_Monitor

Backend → MQTT:
  username: backend_service
  password: ********
  client_id: backend_server

(Optional) Frontend → Backend:
  Authorization: Bearer <token>
  or Basic Auth
```

## Scalability Considerations

### Multiple Devices
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ ESP32-1 │  │ ESP32-2 │  │ ESP32-3 │
│ Garden1 │  │ Garden2 │  │ Garden3 │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
            ┌─────▼─────┐
            │   MQTT    │
            │  Broker   │
            └─────┬─────┘
                  │
            ┌─────▼─────┐
            │  Backend  │
            │  +DB      │
            └───────────┘

Topic Structure:
  agri/{device_id}/sensor/data
  agri/{device_id}/control/pump
  agri/{device_id}/status
```

### Database Integration
```
┌─────────┐
│ Backend │
└────┬────┘
     │
     ├──► ┌──────────┐
     │    │   Redis  │  (Real-time cache)
     │    └──────────┘
     │
     ├──► ┌──────────┐
     │    │ MongoDB  │  (Sensor data)
     │    └──────────┘
     │
     └──► ┌──────────┐
          │PostgreSQL│  (Config, users)
          └──────────┘
```

## Monitoring and Logging

### Log Flow
```
ESP32:
  - Serial Monitor (development)
  - MQTT debug topic (production)

Backend:
  - Console logs
  - File logs (winston/morgan)
  - Error tracking (Sentry)

MQTT:
  - Mosquitto logs
  - Connection events
  - Message counts
```

### Metrics to Monitor
- MQTT connection status
- Message delivery rate
- API response time
- Sensor reading accuracy
- Device uptime
- Error rates

## Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Device | ESP32 | - |
| Firmware | Arduino/PlatformIO | Latest |
| Protocol | MQTT | v3.1.1 |
| Broker | Mosquitto | 2.0+ |
| Backend | Node.js | 16+ |
| Framework | Express | 4.18+ |
| Frontend | HTML/CSS/JS | ES6+ |
| API | REST | - |

## Performance Characteristics

- **Sensor Update Rate**: 5 seconds
- **MQTT Latency**: < 100ms (local)
- **API Response Time**: < 50ms
- **WiFi Range**: ~50m (depends on environment)
- **Power Consumption**: ~80mA active (ESP32)
- **Uptime Target**: 99.9%
