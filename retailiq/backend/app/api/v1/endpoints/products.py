from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.product_service import ProductService
from retailiq.backend.app.schemas.analytics import ProductListItem, ProductDetailAnalytics

router = APIRouter()

@router.get("", response_model=List[ProductListItem])
def list_products(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    db: Session = Depends(get_db)
):
    return ProductService.list_products(db=db, category=category, search=search)

@router.get("/{product_id}", response_model=ProductDetailAnalytics)
def get_product_detail(product_id: str, db: Session = Depends(get_db)):
    res = ProductService.get_product_detail(db=db, product_id=product_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found.")
    return res
