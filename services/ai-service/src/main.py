import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.chat_router import router as chat_router
from src.translation.voice_service import router as voice_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="StadiumIQ AI & Translation Service",
    description="GenAI-powered conversational RAG engine and voice translation services for FIFA World Cup 2026.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers matching Kong Gateway configuration path maps
app.include_router(chat_router, prefix="/api/v1/ai", tags=["Conversational AI"])
app.include_router(voice_router, prefix="/api/v1/ai", tags=["Voice translation"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
