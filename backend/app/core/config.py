from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 应用
    app_name: str = "ShotStudio API"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"

    # 数据库
    database_url: str = "postgresql+asyncpg://shotstudio:shotstudio@localhost:5432/shotstudio"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "shotstudio"

    # Session
    session_expire_hours: int = 24 * 7  # 7天

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
