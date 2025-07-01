# backend/app/main.py - Updated for Railway deployment

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from .core.config.settings import settings
from .api.v1 import business_plans, evaluations, projects, scores

# Load environment variables
load_dotenv()

# Create FastAPI application
app = FastAPI(
    title="PitchAI Backend API",
    description="PitchAI项目评审系统后端API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for Railway + GitHub Pages + Vercel deployment
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # Mock server
    "http://127.0.0.1:3001",
    # Vercel deployments (works in all environments)
    "https://pitchai-okn8cl0rm-yuzhifurs-projects.vercel.app",
]

# Add production GitHub Pages origin if configured
github_pages_url = os.getenv("GITHUB_PAGES_URL")
if github_pages_url:
    allowed_origins.append(github_pages_url)
    # Also add common GitHub Pages patterns
    allowed_origins.extend([
        "https://*.github.io",  # Allow all GitHub Pages subdomains
        "https://yuzhifur.github.io",  # Will be replaced with actual username
    ])

# In production, allow the specific GitHub Pages URL and Vercel deployments
if settings.APP_ENV == "production":
    # Add your specific GitHub Pages URL here
    allowed_origins.extend([
        "https://yuzhifur.github.io",  # Replace with your actual GitHub username
        "https://yuzhifur.github.io/PitchAI_Demo",  # Replace with your repo name
        # Vercel deployments
        "https://pitchai-okn8cl0rm-yuzhifurs-projects.vercel.app",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Health check endpoints
@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "PitchAI API Server",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "health": "/ping"
    }

@app.get("/ping", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.APP_ENV
    }

@app.get(f"{settings.API_PREFIX}/ping", tags=["Health"])
def health_check_api():
    return {
        "status": "ok",
        "version": "1.0.0",
        "api_prefix": settings.API_PREFIX,
        "environment": settings.APP_ENV
    }

# Register API routes
app.include_router(
    projects.router, prefix=settings.API_PREFIX, tags=["项目管理"]
)

app.include_router(
    scores.router, prefix=settings.API_PREFIX, tags=["评分管理"]
)

app.include_router(
    business_plans.router, prefix=settings.API_PREFIX, tags=["商业计划书"]
)

app.include_router(
    evaluations.router, prefix=settings.API_PREFIX, tags=["评估"]
)

# Railway deployment requires the app to be available as 'app'
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))  # Railway sets PORT automatically
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)