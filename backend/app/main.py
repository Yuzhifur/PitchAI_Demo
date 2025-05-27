from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="PitchAI 后端 API")


@app.get("/ping", tags=["Health"])
def health_check():
    return {"status": "ok"}


# 后续可在 app.include_router() 中引入各业务模块的路由
