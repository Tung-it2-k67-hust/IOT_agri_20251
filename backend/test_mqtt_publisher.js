/**
 * Test MQTT Publisher - Gửi dữ liệu giả để test dashboard
 * Chạy: node test_mqtt_publisher.js
 */

const mqtt = require('mqtt');

// Kết nối tới MQTT Broker
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  console.log('📡 Publishing test data every 5 seconds...\n');
  
  // Gửi dữ liệu mỗi 5 giây
  setInterval(() => {
    const data = {
      temperature: (25 + Math.random() * 10).toFixed(1), // 25-35°C
      humidity: (60 + Math.random() * 20).toFixed(1),    // 60-80%
      timestamp: new Date().toISOString(),
      device: 'ESP32_DHT11_Monitor'
    };
    
    client.publish('agri/sensor/data', JSON.stringify(data));
    console.log('📤 Published:', data);
  }, 5000);
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping publisher...');
  client.end();
  process.exit(0);
});
