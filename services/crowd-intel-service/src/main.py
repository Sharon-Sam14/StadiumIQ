import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.simulator.telemetry import start_simulator
from src.forecaster.surge import calculate_surge_probability
from src.influx.client import query_recent_telemetry
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="StadiumIQ Crowd Intelligence & Prediction Service",
    description="Time-series ingestion and crowd surge predictions using InfluxDB and numerical models.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start background simulator thread on server startup
@app.on_event("startup")
def startup_event():
    start_simulator()

# REST Endpoints matching Kong Gateway prefix maps
@app.get("/api/v1/crowd/status")
async def get_crowd_status():
    gates = ["Gate A", "Gate B", "Gate C"]
    gate_details = []
    
    for gate in gates:
        history = query_recent_telemetry("gate_telemetry", "gate_id", gate, limit=1)
        if history:
            rec = history[0]
            gate_details.append({
                "gateId": gate,
                "flowRate": float(rec.get("flow_rate", 0.0)),
                "queueLength": int(rec.get("queue_length", 0)),
                "occupancyRate": float(rec.get("occupancy_rate", 0.0))
            })
        else:
            # Fallback values if database seeder just initialized
            defaults = {
                "Gate A": {"flowRate": 48.0, "queueLength": 320, "occupancyRate": 92.0},
                "Gate B": {"flowRate": 22.0, "queueLength": 35, "occupancyRate": 45.0},
                "Gate C": {"flowRate": 12.0, "queueLength": 12, "occupancyRate": 20.0}
            }
            gate_details.append({
                "gateId": gate,
                **defaults[gate]
            })
            
    # Fetch zone section densities
    zones = ["West Concourse", "East Concourse", "Food Court Sec 204"]
    zone_details = []
    for zone in zones:
        history = query_recent_telemetry("zone_telemetry", "zone_id", zone, limit=1)
        if history:
            zone_details.append({
                "zoneId": zone,
                "density": float(history[0].get("density", 0.0))
            })
        else:
            defaults = {
                "West Concourse": 84.0,
                "East Concourse": 50.0,
                "Food Court Sec 204": 76.0
            }
            zone_details.append({
                "zoneId": zone,
                "density": defaults[zone]
            })
            
    return {
        "success": True,
        "data": {
            "gates": gate_details,
            "zones": zone_details
        }
    }

@app.get("/api/v1/crowd/forecast")
async def get_crowd_forecast():
    gates = ["Gate A", "Gate B", "Gate C"]
    forecasts = []
    for gate in gates:
        res = calculate_surge_probability(gate)
        forecasts.append(res)
        
    return {
        "success": True,
        "data": {
            "forecasts": forecasts,
            "alertLevel": "HIGH" if any(f["status"] == "CRITICAL_REDIRECT" for f in forecasts) else "NORMAL"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "crowd-intel-service"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
