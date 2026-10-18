from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.sales_service import SalesService

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
@router.get("/analytics", response_model=Dict[str, Any])
def get_sales_analytics(
    year: Optional[int] = Query(None, description="Fiscal Year (e.g. 2025)"),
    region: Optional[str] = Query(None, description="Region"),
    store_id: Optional[str] = Query(None, description="Store ID"),
    category: Optional[str] = Query(None, description="Category"),
    db: Session = Depends(get_db)
):
    return SalesService.get_sales_analytics(
        db=db,
        year=year,
        region=region,
        store_id=store_id,
        category=category
    )
