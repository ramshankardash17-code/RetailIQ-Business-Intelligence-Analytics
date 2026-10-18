from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.customer_service import CustomerService
from retailiq.backend.app.schemas.analytics import CustomerDetail

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
@router.get("/rfm", response_model=Dict[str, Any])
def get_rfm_customer_analytics(db: Session = Depends(get_db)):
    return CustomerService.get_rfm_analytics(db=db)

@router.get("/{customer_id}", response_model=CustomerDetail)
def get_customer_profile(customer_id: str, db: Session = Depends(get_db)):
    res = CustomerService.get_customer_profile(db=db, customer_id=customer_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")
    return res
