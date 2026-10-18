import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.core.config import settings
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.api.v1.api import api_router

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Enterprise Retail Business Intelligence & Predictive Analytics REST API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "Connected"
    sales_count = 0
    try:
        sales_count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
    except Exception as e:
        db_status = f"Error: {str(e)}"

    return {
        "status": "online",
        "platform": settings.API_TITLE,
        "version": settings.API_VERSION,
        "database": {
            "status": db_status,
            "engine": "MySQL 8.0",
            "database_name": settings.DB_NAME,
            "sales_transactions_indexed": sales_count
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("retailiq.backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
