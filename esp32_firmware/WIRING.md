# ESP32 Wiring Guide

## Components Required
1. ESP32 Development Board
2. Capacitive Soil Moisture Sensor (or Resistive)
3. 5V Relay Module (2-channel)
4. Water Pump (5V or 12V)
5. LED Light Strip or Grow Light
6. Power Supply (appropriate for pump and lights)
7. Jumper Wires

## Pin Connections

### Moisture Sensor
- VCC → 3.3V (ESP32)
- GND → GND (ESP32)
- AOUT → GPIO 34 (Analog Input)

### Water Pump Relay
- VCC → 5V (ESP32)
- GND → GND (ESP32)
- IN → GPIO 25 (Digital Output)
- COM → Power Supply (+)
- NO (Normally Open) → Water Pump (+)
- Water Pump (-) → Power Supply (-)

### Light Relay
- VCC → 5V (ESP32)
- GND → GND (ESP32)
- IN → GPIO 26 (Digital Output)
- COM → Power Supply (+)
- NO (Normally Open) → Light (+)
- Light (-) → Power Supply (-)

## Important Notes

1. **Relay Selection**: Use relays rated for your pump and light voltage/current
2. **Power Supply**: Ensure adequate power supply for all components
3. **Moisture Sensor**: Calibrate sensor readings for your soil type
4. **Safety**: Use proper insulation for all high-voltage connections
5. **Relay Logic**: Code uses HIGH to activate relay (modify if your relay uses LOW)

## Calibration

### Moisture Sensor Calibration
1. Place sensor in dry soil/air, note ADC value (typically ~4095)
2. Place sensor in water, note ADC value (typically ~1500-2000)
3. Adjust mapping values in code if needed

### Threshold Settings
- Default moisture threshold: 40%
- Recommended range: 30-60% depending on plant type
- Adjust via web interface or MQTT message
