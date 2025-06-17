from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from .core.config.settings import settings
from .api.v1 import business_plans, evaluations

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

app.include_router(
    evaluations.router, prefix=settings.API_PREFIX, tags=["评估"]
)


# 健康检查
@app.get("/ping", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}


# 导入路由
# from .api.v1 import auth, projects, business_plans, reports

# 注册路由
# app.include_router(auth.router, prefix=settings.API_PREFIX, tags=["认证"])
# app.include_router(projects.router, prefix=settings.API_PREFIX, tags=["项目"])
app.include_router(
    business_plans.router, prefix=settings.API_PREFIX, tags=["商业计划书"]
)
# app.include_router(reports.router, prefix=settings.API_PREFIX, tags=["报告"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
