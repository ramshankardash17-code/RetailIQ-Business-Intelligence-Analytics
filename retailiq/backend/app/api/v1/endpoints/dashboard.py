from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.dashboard_service import DashboardService
from retailiq.backend.app.schemas.analytics import ExecutiveDashboardResponse

router = APIRouter()

@router.get("/kpis", response_model=ExecutiveDashboardResponse)
def get_dashboard_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Filter by Region"),
    store_id: Optional[str] = Query(None, description="Filter by Store ID"),
    category: Optional[str] = Query(None, description="Filter by Category"),
    product_id: Optional[str] = Query(None, description="Filter by Product ID"),
    db: Session = Depends(get_db)
):
    return DashboardService.get_executive_dashboard(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region,
        store_id=store_id,
        category=category,
        product_id=product_id
    )
