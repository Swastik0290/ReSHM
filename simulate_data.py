import requests
import time
import random
import json

# Configuration
API_URL = "http://103.86.177.125/api/sensor/ingest"

# The 3 test rooms device IDs
DEVICE_IDS = [
    "test-room-1", # Alpha
    "test-room-2", # Beta
    "test-room-3", # Gamma
]

def generate_normal_reading(device_id):
    """Generates base sensor data"""
    return {
        "deviceId": device_id,
        "latitude": 28.6139 + random.uniform(-0.001, 0.001),
        "longitude": 77.2090 + random.uniform(-0.001, 0.001),
        "temperature": round(random.uniform(20.0, 25.0), 1),
        "humidity": round(random.uniform(40.0, 60.0), 1),
        "coSensor1": round(random.uniform(0.0, 5.0), 1),
        "coSensor2": round(random.uniform(0.0, 5.0), 1),
        "co2": round(random.uniform(400, 600), 1),
        "oxygen": round(random.uniform(20.8, 21.0), 1),
        "pulse": round(random.uniform(60, 80), 1),
        "smokeDetected": False,
        "fireDetected": False,
        "source": "Modem"
    }

def generate_critical_reading(device_id):
    """Generates data that will ALWAYS trigger a critical alert"""
    # Randomly pick an alert type to trigger
    alert_type = random.choice(["co", "co2", "fire", "temp", "oxygen"])
    
    data = generate_normal_reading(device_id)
    
    if alert_type == "co":
        data["coSensor1"] = random.uniform(80.0, 100.0) # > 50 is critical
        data["coSensor2"] = random.uniform(77.0, 100.0)
    elif alert_type == "co2":
        data["co2"] = random.uniform(1050, 2000) # > 1000 is critical
    elif alert_type == "fire":
        data["fireDetected"] = True
        data["smokeDetected"] = True
        data["temperature"] = random.uniform(40.0, 80.0) # > 35 is critical
    elif alert_type == "temp":
        data["temperature"] = random.uniform(36.0, 45.0) # > 35 is critical
    elif alert_type == "oxygen":
        data["oxygen"] = random.uniform(10.0, 18.0) # < 19.5 is critical
        
    return data

def main():
    print("Starting Svasa Metric Data Ingestion Simulator...")
    print(f"Target API: {API_URL}")
    print("Mode: ONLY CRITICAL VALUES")
    print("Press Ctrl+C to stop.\n")
    
    try:
        while True:
            # Pick a random device to send CRITICAL data to
            critical_dev = random.choice(DEVICE_IDS)
            critical_data = generate_critical_reading(critical_dev)
            
            print(f"!!! Sending CRITICAL reading to {critical_dev} !!!")
            try:
                res = requests.post(API_URL, json=critical_data, timeout=5)
                if res.status_code == 201:
                    print(f"  Success: {res.status_code}")
                else:
                    print(f"  Failed: {res.status_code} - {res.text}")
            except Exception as e:
                print(f"  Error: {e}")
                
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\nStopping ingestion simulator.")

if __name__ == "__main__":
    main()
