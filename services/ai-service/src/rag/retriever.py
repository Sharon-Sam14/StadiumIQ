import os
import math
import psycopg2
from urllib.parse import urlparse

# Deterministic vector generator matching seeder logic exactly
def generate_mock_vector(size: int, text: str) -> list[float]:
    vec = [0.0] * size
    hash_val = 0
    for char in text:
        hash_val = ord(char) + ((hash_val << 5) - hash_val)
    
    for i in range(size):
        scale = math.sin(hash_val + i) * 10000
        vec[i] = scale - math.floor(scale)
        
    magnitude = math.sqrt(sum(val * val for val in vec))
    if magnitude == 0:
        return [0.0] * size
    return [val / magnitude for val in vec]

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@localhost:5432/stadiumiq")
    parsed = urlparse(db_url)
    
    # Parse connection details from DATABASE_URL
    conn = psycopg2.connect(
        dbname=parsed.path[1:],
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432
    )
    return conn

def retrieve_similar_documents(query_text: str, limit: int = 2) -> list[dict]:
    # Generate mock query embedding matching seeder vectors
    query_vector = generate_mock_vector(384, query_text)
    vector_str = "[" + ",".join(map(str, query_vector)) + "]"
    
    results = []
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Query knowledge base using pgvector cosine distance operator <=>
            query = """
                SELECT id, title, content, 1 - (embedding <=> %s::vector) AS similarity 
                FROM knowledge_base 
                ORDER BY embedding <=> %s::vector 
                LIMIT %s
            """
            cur.execute(query, (vector_str, vector_str, limit))
            rows = cur.fetchall()
            
            for row in rows:
                results.append({
                    "id": str(row[0]),
                    "title": row[1],
                    "content": row[2],
                    "similarity": float(row[3])
                })
    except Exception as e:
        print(f"Error in RAG retrieval: {e}")
        # Return fallback mock items in case db connection is offline
        if "halal" in query_text.lower() or "food" in query_text.lower():
            return [{
                "id": "mock-01",
                "title": "Halal Food Location (Fallback)",
                "content": "The nearest halal concession is 'Halal Bites' located in the West Concourse near Section 112.",
                "similarity": 0.95
            }]
        elif "child" in query_text.lower() or "lost" in query_text.lower():
            return [{
                "id": "mock-02",
                "title": "Lost Child Protocol (Fallback)",
                "content": "LOST CHILD PROTOCOL: 1. Keep the child at your location; do not walk away. 2. Contact Section Supervisor immediately.",
                "similarity": 0.95
            }]
    finally:
        if conn:
            conn.close()
            
    return results
