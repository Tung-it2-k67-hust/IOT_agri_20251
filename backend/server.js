const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data storage (in-memory for simplicity, use database in production)
let sensorData = [];
let currentStatus = {
  moistureThreshold: 40,
  autoWatering: true,
  manualPumpOverride: false,
  manualLightOverride: false,
  lightOnHour: 6,
  lightOffHour: 18,
  autoLight: true,
  pumpState: false,
  lightState: false,
  moisture: 0,
  lastUpdate: null
};

const MAX_HISTORY = 1000; // Keep last 1000 readings

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_USER = process.env.MQTT_USER || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// MQTT Topics
const TOPICS = {
  SENSOR_DATA: 'agri/sensor/data',
  PUMP_CONTROL: 'agri/control/pump',
  LIGHT_CONTROL: 'agri/control/light',
  CONFIG: 'agri/config',
  STATUS: 'agri/status'
};

// Connect to MQTT Broker
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  reconnectPeriod: 1000
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  
  // Subscribe to topics
  mqttClient.subscribe(TOPICS.SENSOR_DATA, (err) => {
    if (err) console.error('Failed to subscribe to sensor data:', err);
  });
  
  mqttClient.subscribe(TOPICS.STATUS, (err) => {
    if (err) console.error('Failed to subscribe to status:', err);
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    if (topic === TOPICS.SENSOR_DATA) {
      // Store sensor data with timestamp
      const dataPoint = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      sensorData.push(dataPoint);
      
      // Keep only last MAX_HISTORY readings
      if (sensorData.length > MAX_HISTORY) {
        sensorData = sensorData.slice(-MAX_HISTORY);
      }
      
      // Update current status
      currentStatus.moisture = data.moisture;
      currentStatus.pumpState = data.pumpState;
      currentStatus.lightState = data.lightState;
      currentStatus.lastUpdate = dataPoint.timestamp;
      
      console.log('Sensor data received:', dataPoint);
    }
    
    if (topic === TOPICS.STATUS) {
      // Update status from ESP32
      currentStatus = {
        ...currentStatus,
        ...data,
        lastUpdate: new Date().toISOString()
      };
      console.log('Status updated:', currentStatus);
    }
  } catch (error) {
    console.error('Error parsing MQTT message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT Error:', error);
});

// REST API Endpoints

// Get current status
app.get('/api/status', (req, res) => {
  res.json(currentStatus);
});

// Get sensor data history
app.get('/api/sensor-data', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const data = sensorData.slice(-limit);
  res.json(data);
});

// Get latest sensor reading
app.get('/api/sensor-data/latest', (req, res) => {
  if (sensorData.length === 0) {
    return res.status(404).json({ error: 'No data available' });
  }
  res.json(sensorData[sensorData.length - 1]);
});

// Control water pump
app.post('/api/control/pump', (req, res) => {
  const { state, mode } = req.body;
  
  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'State must be boolean' });
  }
  
  const message = JSON.stringify({
    state: state,
    mode: mode || 'manual'
  });
  
  mqttClient.publish(TOPICS.PUMP_CONTROL, message, (err) => {
    if (err) {
      console.error('Failed to publish pump control:', err);
      return res.status(500).json({ error: 'Failed to send command' });
    }
    
    console.log('Pump control sent:', message);
    res.json({ success: true, state, mode });
  });
});

// Control light
app.post('/api/control/light', (req, res) => {
  const { state, mode } = req.body;
  
  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'State must be boolean' });
  }
  
  const message = JSON.stringify({
    state: state,
    mode: mode || 'manual'
  });
  
  mqttClient.publish(TOPICS.LIGHT_CONTROL, message, (err) => {
    if (err) {
      console.error('Failed to publish light control:', err);
      return res.status(500).json({ error: 'Failed to send command' });
    }
    
    console.log('Light control sent:', message);
    res.json({ success: true, state, mode });
  });
});

// Update configuration
app.post('/api/config', (req, res) => {
  const config = {};
  
  if (typeof req.body.moistureThreshold === 'number') {
    config.moistureThreshold = req.body.moistureThreshold;
  }
  if (typeof req.body.autoWatering === 'boolean') {
    config.autoWatering = req.body.autoWatering;
  }
  if (typeof req.body.lightOnHour === 'number') {
    config.lightOnHour = req.body.lightOnHour;
  }
  if (typeof req.body.lightOffHour === 'number') {
    config.lightOffHour = req.body.lightOffHour;
  }
  if (typeof req.body.autoLight === 'boolean') {
    config.autoLight = req.body.autoLight;
  }
  
  if (Object.keys(config).length === 0) {
    return res.status(400).json({ error: 'No valid configuration provided' });
  }
  
  const message = JSON.stringify(config);
  
  mqttClient.publish(TOPICS.CONFIG, message, (err) => {
    if (err) {
      console.error('Failed to publish config:', err);
      return res.status(500).json({ error: 'Failed to send configuration' });
    }
    
    // Update local status
    Object.assign(currentStatus, config);
    
    console.log('Configuration sent:', message);
    res.json({ success: true, config });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mqtt: mqttClient.connected,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  mqttClient.end();
  process.exit(0);
});
