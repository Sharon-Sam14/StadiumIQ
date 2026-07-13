import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from src.rag.retriever import retrieve_similar_documents
import google.generativeai as genai

router = APIRouter()

# Schema structures for requests
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    sessionId: str = Field(default="session_default")

class ChatResponse(BaseModel):
    success: bool
    answer: str
    sources: list[dict]
    systemPrompt: str
    latencyMs: float

# Initialize Gemini SDK if API Key is configured
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

def generate_llm_response(prompt: str) -> str:
    # Use Gemini model if key is active
    if gemini_key:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini generation error: {e}")
            
    # Mock LLM generation fallback based on prompt context (RAG mock)
    # Extracts the content block and prints a natural answer
    if "LOST CHILD" in prompt:
        return "LOST CHILD PROTOCOL:\n1. Keep the child at your location; do not walk away.\n2. Contact Section Supervisor immediately.\n3. Log incident in portal under High severity.\n4. Do NOT broadcast child's name over public channels."
    elif "Concourse near Section 112" in prompt:
        return "The nearest halal concession is 'Halal Bites' located in the West Concourse near Section 112. It is approximately a 4 minute walk from Section 200."
    elif "Gate A" in prompt:
        return "Gate A is congested (92%). Please redirect all incoming attendees towards Gate B or C, which have wait times under 3 minutes."
        
    return "Based on stadium guidelines, I recommend checking with your closest gate coordinator or consulting the information counter in the main concourse."

@router.post("/chat", response_model=ChatResponse)
async def fan_chat(req: ChatRequest):
    import time
    start_time = time.time()
    
    # 1. RAG retrieval query
    sources = retrieve_similar_documents(req.message, limit=2)
    context_str = "\n".join([f"Source: {doc['title']}\nContent: {doc['content']}" for doc in sources])
    
    # 2. System prompt inject
    system_prompt = (
        "You are an expert stadium concierge for the FIFA World Cup 2026. "
        "Answer the fan's query concisely and politely using only the provided context. "
        "If you do not know or the context is insufficient, explain clearly that you are checking with staff."
    )
    
    full_prompt = (
        f"{system_prompt}\n\n"
        f"Context:\n{context_str}\n\n"
        f"User Question: {req.message}\n"
        "Concise Answer:"
    )
    
    # 3. Trigger Model Inference
    answer = generate_llm_response(full_prompt)
    latency = (time.time() - start_time) * 1000.0
    
    return ChatResponse(
        success=True,
        answer=answer,
        sources=sources,
        systemPrompt=system_prompt,
        latencyMs=round(latency, 2)
    )

@router.post("/volunteer/query", response_model=ChatResponse)
async def volunteer_query(req: ChatRequest):
    import time
    start_time = time.time()
    
    sources = retrieve_similar_documents(req.message, limit=2)
    context_str = "\n".join([f"Source: {doc['title']}\nContent: {doc['content']}" for doc in sources])
    
    system_prompt = (
        "You are a volunteer supervisor coordinator. "
        "Answer the volunteer's question regarding standard operating procedures (SOPs) strictly. "
        "Detail specific checklists steps."
    )
    
    full_prompt = (
        f"{system_prompt}\n\n"
        f"Procedural SOPs:\n{context_str}\n\n"
        f"Volunteer Question: {req.message}\n"
        "Structured Answer:"
    )
    
    answer = generate_llm_response(full_prompt)
    latency = (time.time() - start_time) * 1000.0
    
    return ChatResponse(
        success=True,
        answer=answer,
        sources=sources,
        systemPrompt=system_prompt,
        latencyMs=round(latency, 2)
    )

@router.post("/copilot/query", response_model=ChatResponse)
async def copilot_query(req: ChatRequest):
    import time
    start_time = time.time()
    
    sources = retrieve_similar_documents(req.message, limit=1)
    context_str = "\n".join([f"Telemetry: {doc['title']}\nState: {doc['content']}" for doc in sources])
    
    system_prompt = (
        "You are an organizer operations copilot. "
        "Suggest incident mitigations and gate traffic controls."
    )
    
    full_prompt = (
        f"{system_prompt}\n\n"
        f"Event State:\n{context_str}\n\n"
        f"Operations Query: {req.message}\n"
        "Decision Recommendation:"
    )
    
    answer = generate_llm_response(full_prompt)
    latency = (time.time() - start_time) * 1000.0
    
    return ChatResponse(
        success=True,
        answer=answer,
        sources=sources,
        systemPrompt=system_prompt,
        latencyMs=round(latency, 2)
    )
