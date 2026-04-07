from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import crud_requests
from app.api import auth

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — 开发期间允许前端 localhost:5173 访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(crud_requests.router, tags=["CRUD"])
app.include_router(auth.router)


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "app": settings.app_name}
