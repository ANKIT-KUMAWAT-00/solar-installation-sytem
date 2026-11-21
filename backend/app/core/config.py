from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SunPower Solutions – Solar Installation Management ERP"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "sunpower-enterprise-erp-jwt-secret-key-2026-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: local aiosqlite for instant setup, PostgreSQL in Docker
    DATABASE_URL: str = "sqlite+aiosqlite:///./sunpower.db"
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Business Parameters
    MINIMUM_ADVANCE_PAYMENT_PCT: float = 30.0  # 30% advance required for warehouse dispatch
    DEFAULT_CURRENCY: str = "INR"  # ₹

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
