import time
import threading
import random
from src.influx.client import write_telemetry_point

def simulate_telemetry_loop():
    print("Starting background crowd telemetry simulator...")
    while True:
        try:
            # 1. Simulate Gate Ingress Telemetry
            # Gate A (High Congestion)
            write_telemetry_point(
                measurement="gate_telemetry",
                tags={"gate_id": "Gate A"},
                fields={
                    "flow_rate": float(random.randint(40, 52)),
                    "queue_length": int(random.randint(290, 340)),
                    "occupancy_rate": float(random.randint(88, 95))
                }
            )
            # Gate B (Normal Flow)
            write_telemetry_point(
                measurement="gate_telemetry",
                tags={"gate_id": "Gate B"},
                fields={
                    "flow_rate": float(random.randint(18, 26)),
                    "queue_length": int(random.randint(28, 42)),
                    "occupancy_rate": float(random.randint(40, 52))
                }
            )
            # Gate C (Clear Flow)
            write_telemetry_point(
                measurement="gate_telemetry",
                tags={"gate_id": "Gate C"},
                fields={
                    "flow_rate": float(random.randint(10, 17)),
                    "queue_length": int(random.randint(8, 16)),
                    "occupancy_rate": float(random.randint(18, 25))
                }
            )
            
            # 2. Simulate Zone Section Densities
            write_telemetry_point(
                measurement="zone_telemetry",
                tags={"zone_id": "West Concourse"},
                fields={"density": float(random.randint(80, 89))}
            )
            write_telemetry_point(
                measurement="zone_telemetry",
                tags={"zone_id": "East Concourse"},
                fields={"density": float(random.randint(45, 55))}
            )
            write_telemetry_point(
                measurement="zone_telemetry",
                tags={"zone_id": "Food Court Sec 204"},
                fields={"density": float(random.randint(72, 82))}
            )
            
        except Exception as e:
            print(f"Error generating simulation telemetry: {e}")
            
        # Pause for 10 seconds before generating next metrics snapshot
        time.sleep(10)

def start_simulator():
    sim_thread = threading.Thread(target=simulate_telemetry_loop, daemon=True)
    sim_thread.start()
