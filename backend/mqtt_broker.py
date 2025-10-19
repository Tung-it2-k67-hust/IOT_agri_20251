"""
Simple MQTT Broker using Python
Chạy file này thay cho Mosquitto
"""

import asyncio
try:
    from hbmqtt.broker import Broker
    from hbmqtt.client import MQTTClient
    import logging
except ImportError:
    print("⚠️  Chưa cài thư viện hbmqtt!")
    print("Chạy lệnh: pip install hbmqtt")
    exit(1)

# Cấu hình
config = {
    'listeners': {
        'default': {
            'type': 'tcp',
            'bind': '0.0.0.0:1883',  # Port 1883 (MQTT standard)
        },
    },
    'sys_interval': 10,
    'auth': {
        'allow-anonymous': True,  # Cho phép kết nối không cần password
    },
}

async def broker_coro():
    broker = Broker(config)
    await broker.start()
    print("=" * 50)
    print("🚀 MQTT Broker đang chạy!")
    print("=" * 50)
    print(f"📡 Host: localhost")
    print(f"🔌 Port: 1883")
    print(f"👤 Authentication: Không cần")
    print("=" * 50)
    print("\n✅ ESP32 có thể kết nối được rồi!")
    print("❌ Nhấn Ctrl+C để dừng\n")

if __name__ == '__main__':
    # Setup logging
    formatter = "[%(asctime)s] :: %(levelname)s :: %(name)s :: %(message)s"
    logging.basicConfig(level=logging.INFO, format=formatter)
    
    try:
        asyncio.get_event_loop().run_until_complete(broker_coro())
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Đang dừng MQTT Broker...")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
