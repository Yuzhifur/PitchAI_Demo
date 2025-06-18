# File: backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from .core.config.settings import settings
from .api.v1 import business_plans, evaluations, projects, scores

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(
    title="PitchAI 后端 API",
    description="PitchAI项目评审系统后端API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查 - FIXED: Move this BEFORE router registration
@app.get("/ping", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}

# 根路径重定向到文档
@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "PitchAI API Server",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/ping"
    }

# 注册路由 - FIXED: Add /api/v1 prefix to health check as well
@app.get(f"{settings.API_PREFIX}/ping", tags=["Health"])
def health_check_api():
    return {"status": "ok", "version": "1.0.0", "api_prefix": settings.API_PREFIX}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)