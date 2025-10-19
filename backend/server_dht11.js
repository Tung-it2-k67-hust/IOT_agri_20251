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

// Data storage (in-memory - sử dụng database trong production)
let sensorData = [];
const MAX_HISTORY = 1000; // Lưu 1000 records gần nhất

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_USER = process.env.MQTT_USER || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// MQTT Topics
const TOPICS = {
  SENSOR_DATA: 'agri/sensor/data',
  STATUS: 'agri/status'
};

// Connect to MQTT Broker
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  reconnectPeriod: 1000
});

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  
  // Subscribe to sensor data topic
  mqttClient.subscribe(TOPICS.SENSOR_DATA, (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to sensor data:', err);
    } else {
      console.log('📡 Subscribed to:', TOPICS.SENSOR_DATA);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    if (topic === TOPICS.SENSOR_DATA) {
      // Lưu data với timestamp
      const dataPoint = {
        temperature: data.temperature,
        humidity: data.humidity,
        device: data.device || 'Unknown',
        timestamp: new Date().toISOString(),
        receivedAt: Date.now()
      };
      
      sensorData.push(dataPoint);
      
      // Giới hạn số lượng records
      if (sensorData.length > MAX_HISTORY) {
        sensorData = sensorData.slice(-MAX_HISTORY);
      }
      
      console.log('📊 Data received:', {
        temp: dataPoint.temperature,
        hum: dataPoint.humidity,
        time: dataPoint.timestamp
      });
    }
  } catch (error) {
    console.error('❌ Error parsing MQTT message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

mqttClient.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT Broker...');
});

// ============= REST API ENDPOINTS =============

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'IoT Agriculture Backend Server',
    mqtt: mqttClient.connected ? 'connected' : 'disconnected',
    dataPoints: sensorData.length
  });
});

// Get all sensor data (với limit)
app.get('/api/sensor-data', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const data = sensorData.slice(-limit);
  
  res.json({
    success: true,
    count: data.length,
    total: sensorData.length,
    data: data
  });
});

// Get latest sensor reading
app.get('/api/sensor-data/latest', (req, res) => {
  if (sensorData.length === 0) {
    return res.status(404).json({ 
      success: false,
      error: 'No data available' 
    });
  }
  
  const latest = sensorData[sensorData.length - 1];
  res.json({
    success: true,
    data: latest
  });
});

// Get statistics
app.get('/api/statistics', (req, res) => {
  if (sensorData.length === 0) {
    return res.status(404).json({ 
      success: false,
      error: 'No data available' 
    });
  }
  
  const temps = sensorData.map(d => d.temperature);
  const humidities = sensorData.map(d => d.humidity);
  
  const stats = {
    temperature: {
      current: temps[temps.length - 1],
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
    },
    humidity: {
      current: humidities[humidities.length - 1],
      min: Math.min(...humidities),
      max: Math.max(...humidities),
      avg: (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1)
    },
    dataPoints: sensorData.length,
    lastUpdate: sensorData[sensorData.length - 1].timestamp
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// Get data trong khoảng thời gian
app.get('/api/sensor-data/range', (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({
      success: false,
      error: 'start and end timestamps required'
    });
  }
  
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  
  const filteredData = sensorData.filter(d => {
    const dataTime = new Date(d.timestamp).getTime();
    return dataTime >= startTime && dataTime <= endTime;
  });
  
  res.json({
    success: true,
    count: filteredData.length,
    data: filteredData
  });
});

// Clear all data (for testing)
app.delete('/api/sensor-data', (req, res) => {
  const oldCount = sensorData.length;
  sensorData = [];
  
  res.json({
    success: true,
    message: `Cleared ${oldCount} data points`
  });
});

// MQTT Status
app.get('/api/mqtt/status', (req, res) => {
  res.json({
    success: true,
    connected: mqttClient.connected,
    broker: MQTT_BROKER,
    topics: TOPICS
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 IoT Agriculture Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔌 MQTT Broker: ${MQTT_BROKER}`);
  console.log(`📊 Max history: ${MAX_HISTORY} records`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  mqttClient.end();
  process.exit(0);
});
