import os
from influxdb_client import InfluxDBClient, Point, WriteOptions
from influxdb_client.client.write_api import SYNCHRONOUS

# Read environment variables
INFLUX_URL = os.getenv("INFLUX_URL", "http://localhost:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "adminsecrettokenkey12345")
INFLUX_ORG = os.getenv("INFLUX_ORG", "stadiumiq_org")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "telemetry_bucket")

client = None
write_api = None
query_api = None
is_influx_connected = False

try:
    client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
    # Check if client can verify health status
    health = client.health()
    if health.status == "pass":
        write_api = client.write_api(write_options=SYNCHRONOUS)
        query_api = client.query_api()
        is_influx_connected = True
        print(f"Crowd Intel Service connected to InfluxDB bucket '{INFLUX_BUCKET}' successfully.")
    else:
        print(f"InfluxDB health check status is: {health.status}. Working in fallback log mode.")
except Exception as e:
    print(f"InfluxDB client initialization error: {e}. Running in local in-memory log mode.")

# Local in-memory telemetry log in case InfluxDB is offline
local_telemetry_log = []

def write_telemetry_point(measurement: str, tags: dict, fields: dict):
    if is_influx_connected and write_api:
        try:
            point = Point(measurement)
            for k, v in tags.items():
                point = point.tag(k, v)
            for k, v in fields.items():
                point = point.field(k, v)
            write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)
            return True
        except Exception as err:
            print(f"Failed to write to InfluxDB: {err}")
            
    # Fallback to local array log
    local_telemetry_log.append({
        "measurement": measurement,
        "tags": tags,
        "fields": fields
    })
    # Keep log truncated to last 100 entries
    if len(local_telemetry_log) > 100:
        local_telemetry_log.pop(0)
    return True

def query_recent_telemetry(measurement: str, tag_key: str, tag_val: str, limit: int = 10) -> list[dict]:
    results = []
    if is_influx_connected and query_api:
        try:
            # Query InfluxDB using Flux script
            query = f'''
                from(bucket: "{INFLUX_BUCKET}")
                |> range(start: -5m)
                |> filter(fn: (r) => r["_measurement"] == "{measurement}")
                |> filter(fn: (r) => r["{tag_key}"] == "{tag_val}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> limit(n: {limit})
            '''
            tables = query_api.query(query, org=INFLUX_ORG)
            for table in tables:
                for record in table.records:
                    results.append(record.values)
            return results
        except Exception as err:
            print(f"Failed to query InfluxDB: {err}")
            
    # Retrieve from local array log fallback
    for item in reversed(local_telemetry_log):
        if item["measurement"] == measurement and item["tags"].get(tag_key) == tag_val:
            results.append({**item["tags"], **item["fields"]})
            if len(results) >= limit:
                break
    return results
