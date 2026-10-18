import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_TITLE: str = "RetailIQ — Business Intelligence & Predictive Analytics Platform"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    DEBUG: bool = True

    # Database
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = "retailiq_db"

    # ML Artifacts
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    ML_MODELS_DIR: str = os.path.join(BASE_DIR, "ml", "saved_models")
    DATA_DIR: str = os.path.join(BASE_DIR, "data", "raw")

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:8000"

    @property
    def database_url(self) -> str:
        from urllib.parse import quote_plus
        safe_pass = quote_plus(self.DB_PASSWORD)
        safe_user = quote_plus(self.DB_USER)
        return f"mysql+pymysql://{safe_user}:{safe_pass}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        extra = "ignore"

settings = Settings()
