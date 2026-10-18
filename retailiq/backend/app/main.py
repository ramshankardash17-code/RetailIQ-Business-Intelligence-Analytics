import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
try:
    from retailiq.backend.app.core.config import settings
    from retailiq.backend.app.db.session import get_db
    from retailiq.backend.app.api.v1.api import api_router
except ModuleNotFoundError:
    from app.core.config import settings
    from app.db.session import get_db
    from app.api.v1.api import api_router

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Enterprise Retail Business Intelligence & Predictive Analytics REST API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend (supports FRONTEND_URL & local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    """
    On container startup, verifies PostgreSQL connectivity and auto-initializes
    tables, indexes, views, and initial demo data if the database is newly provisioned.
    """
    try:
        from sqlalchemy import inspect
        from retailiq.backend.app.db.session import engine
        from retailiq.database.scripts.init_db import init_database

        inspector = inspect(engine)
        if not inspector.has_table("sales"):
            print(">>> [Startup] Fresh PostgreSQL database detected. Auto-creating tables, indexes, and views...")
            init_database(settings.database_url)
            print(">>> [Startup] Auto-populating initial demo data (~5,000 transactions)...")
            try:
                from retailiq.database.scripts.seed_data import seed_database
                seed_database(is_demo=True, db_url=settings.database_url)
                print(">>> [Startup] Initial demo data seeded successfully!")
            except Exception as se:
                print(f">>> [Startup] Demo seed notice: {se}")
        else:
            print(">>> [Startup] Database verified: 'sales' relation is ready.")
    except Exception as e:
        print(f">>> [Startup] Database startup verification notice: {e}")

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "Connected"
    sales_count = 0
    try:
        sales_count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar() or 0
    except Exception as e:
        db_status = f"Disconnected or Initializing: {str(e)}"

    return {
        "status": "online",
        "platform": settings.API_TITLE,
        "version": settings.API_VERSION,
        "database": {
            "status": db_status,
            "engine": "PostgreSQL",
            "sales_transactions_indexed": sales_count
        },
        "documentation": "/docs"
    }

@app.post("/api/setup/init-db")
def trigger_init_db():
    """Manual or remote trigger to initialize PostgreSQL schema and views."""
    try:
        from retailiq.database.scripts.init_db import init_database
        init_database(settings.database_url)
        return {"status": "success", "message": "PostgreSQL schema and analytical views initialized successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/setup/seed-demo")
def trigger_seed_demo():
    """Manual or remote trigger to seed demo data into PostgreSQL."""
    try:
        from retailiq.database.scripts.seed_data import seed_database
        seed_database(is_demo=True, db_url=settings.database_url)
        return {"status": "success", "message": "Demo retail dataset seeded successfully (~5,000 transactions)."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("retailiq.backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
