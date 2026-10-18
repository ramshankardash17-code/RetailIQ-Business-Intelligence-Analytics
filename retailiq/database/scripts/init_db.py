"""
RetailIQ — PostgreSQL Schema & Views Initialization Script
Initializes tables, relationships, constraints, indexes, and analytical views
in PostgreSQL (Render or local).
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add workspace root to sys.path so retailiq imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from retailiq.backend.app.core.config import settings

def init_database(db_url: str = None):
    url = db_url or settings.database_url
    print(f"\n=======================================================")
    print(f" RetailIQ — PostgreSQL Database Initialization")
    print(f"=======================================================")
    print(f"Connecting to: {url.split('@')[-1] if '@' in url else url}")

    engine = create_engine(url, echo=False)

    scripts_dir = os.path.abspath(os.path.dirname(__file__))
    views_dir = os.path.abspath(os.path.join(scripts_dir, "..", "views"))

    schema_file = os.path.join(scripts_dir, "01_schema.sql")
    views_file = os.path.join(views_dir, "02_views.sql")

    # 1. Execute 01_schema.sql
    print(f"\n>>> [1/2] Executing 01_schema.sql (Tables, Primary/Foreign Keys, Indexes)...")
    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with engine.begin() as conn:
        for statement in schema_sql.split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
    print("  ✓ Tables, constraints, and indexes created successfully.")

    # 2. Execute 02_views.sql
    print(f"\n>>> [2/2] Executing 02_views.sql (6 Pre-materialized Analytical Views)...")
    with open(views_file, "r", encoding="utf-8") as f:
        views_sql = f.read()

    with engine.begin() as conn:
        for statement in views_sql.split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
    print("  ✓ Analytical views (vw_daily_sales, vw_monthly_sales, vw_customer_rfm, etc.) created successfully.")

    print(f"\n=======================================================")
    print(f" RetailIQ PostgreSQL Database Initialized Successfully!")
    print(f"=======================================================\n")

if __name__ == "__main__":
    init_database()
