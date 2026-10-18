from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.inventory_service import InventoryService

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
@router.get("/risk-table", response_model=Dict[str, Any])
def get_inventory_analytics(
    region: Optional[str] = Query(None, description="Region filter"),
    risk_filter: Optional[str] = Query(None, description="Risk level filter (HIGH, MEDIUM, LOW)"),
    db: Session = Depends(get_db)
):
    return InventoryService.get_inventory_analytics(
        db=db,
        region=region,
        risk_filter=risk_filter
    )
