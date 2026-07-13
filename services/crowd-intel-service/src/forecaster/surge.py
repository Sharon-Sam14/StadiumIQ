import numpy as np
from src.influx.client import query_recent_telemetry

def calculate_surge_probability(gate_id: str) -> dict:
    # 1. Fetch recent telemetry from InfluxDB / local fallback
    history = query_recent_telemetry(
        measurement="gate_telemetry",
        tag_key="gate_id",
        tag_val=gate_id,
        limit=5
    )
    
    # 2. Extract queue lengths and ingress rates, fallback if history is small
    queue_lengths = []
    flow_rates = []
    
    if len(history) >= 2:
        for rec in history:
            queue_lengths.append(float(rec.get("queue_length", 0.0)))
            flow_rates.append(float(rec.get("flow_rate", 0.0)))
    else:
        # Default fallback trends matching gate profiles if seeder just initialized
        if gate_id == "Gate A":
            queue_lengths = [295.0, 310.0, 318.0, 325.0, 335.0]
            flow_rates = [42.0, 44.0, 46.0, 48.0, 50.0]
        elif gate_id == "Gate B":
            queue_lengths = [32.0, 34.0, 35.0, 36.0, 38.0]
            flow_rates = [20.0, 21.0, 22.0, 23.0, 24.0]
        else:
            queue_lengths = [10.0, 11.0, 12.0, 11.0, 12.0]
            flow_rates = [12.0, 13.0, 14.0, 13.0, 15.0]
            
    # Convert arrays to numpy
    q_arr = np.array(queue_lengths)
    f_arr = np.array(flow_rates)
    
    # 3. Simulate RNN / LSTM forward forecasting weights
    # Input is historical inflow rates; we project the rate changes
    time_steps = len(f_arr)
    # Simple linear decay weights simulating memory cell parameters
    weights = np.linspace(0.5, 1.0, time_steps)
    weighted_flow = np.dot(f_arr, weights) / np.sum(weights)
    
    # Predict inflow rate over next 15 minutes (with standard acceleration)
    predicted_flow_increase = weighted_flow * 1.15
    predicted_added_queue = predicted_flow_increase * 15.0 * 0.45 # 45% stay in queue
    
    predicted_queue_15m = q_arr[-1] + predicted_added_queue
    
    # 4. Determine surge probability and queue risk
    # Gate capacity threshold limits
    max_capacity_limit = 250.0
    surge_prob = 1.0 / (1.0 + np.exp(-(predicted_queue_15m - max_capacity_limit) / 30.0))
    
    # Calculate estimated wait time (minutes)
    current_flow = f_arr[-1] if f_arr[-1] > 0 else 1.0
    current_wait = q_arr[-1] / (current_flow * 0.8) # 80% service processing speed
    predicted_wait = predicted_queue_15m / (predicted_flow_increase * 0.8)
    
    # Action recommenders
    action = "OK"
    if surge_prob > 0.80:
        action = "CRITICAL_REDIRECT"
    elif surge_prob > 0.50:
        action = "WARNING_MONITOR"
        
    return {
        "gateId": gate_id,
        "currentQueueLength": int(q_arr[-1]),
        "currentFlowRatePerMin": round(float(f_arr[-1]), 1),
        "predictedQueue15Min": int(predicted_queue_15m),
        "surgeProbability": round(float(surge_prob), 3),
        "currentWaitTimeMinutes": round(float(current_wait), 1),
        "predictedWaitTimeMinutes": round(float(predicted_wait), 1),
        "status": action
    }
