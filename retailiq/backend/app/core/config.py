import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_TITLE: str = "RetailIQ — Business Intelligence & Predictive Analytics Platform"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("ENVIRONMENT", "production") != "production"

    # PostgreSQL Database Connection
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", 5432))
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "retailiq_db")

    # ML Artifacts
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    ML_MODELS_DIR: str = os.getenv("ML_MODELS_DIR", os.path.join(BASE_DIR, "ml", "saved_models"))
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data", "raw"))

    # CORS & Frontend Origins
    FRONTEND_URL: Optional[str] = os.getenv("FRONTEND_URL")
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:8000"
    )

    @property
    def database_url(self) -> str:
        raw_url = self.DATABASE_URL or os.getenv("DATABASE_URL")
        if raw_url and raw_url.strip():
            url = raw_url.strip()
            # Render provides postgres:// which SQLAlchemy requires as postgresql+psycopg2://
            if url.startswith("postgres://"):
                url = "postgresql+psycopg2://" + url[len("postgres://"):]
            elif url.startswith("postgresql://"):
                url = "postgresql+psycopg2://" + url[len("postgresql://"):]
            return url

        from urllib.parse import quote_plus
        safe_pass = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        safe_user = quote_plus(self.DB_USER)
        auth = f"{safe_user}:{safe_pass}@" if safe_pass else f"{safe_user}@"
        return f"postgresql+psycopg2://{auth}{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL.strip():
            f_url = self.FRONTEND_URL.strip().rstrip("/")
            if f_url not in origins:
                origins.append(f_url)
        return origins

    class Config:
        env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        extra = "ignore"

settings = Settings()
