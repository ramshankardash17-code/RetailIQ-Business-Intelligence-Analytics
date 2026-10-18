from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.store_service import StoreService

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
@router.get("/regional-ranking", response_model=Dict[str, Any])
def get_store_regional_analytics(
    region: Optional[str] = Query(None, description="Region filter"),
    db: Session = Depends(get_db)
):
    return StoreService.get_store_regional_analytics(db=db, region=region)
