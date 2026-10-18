from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.ml_service import MLService
from retailiq.backend.app.schemas.predict import (
    DemandForecastRequest,
    DemandForecastResponse,
    StockoutRiskRequest,
    StockoutRiskResponse,
    RepeatPurchaseRequest,
    RepeatPurchaseResponse
)

router = APIRouter()

@router.post("/demand", response_model=DemandForecastResponse)
def predict_product_demand(req: DemandForecastRequest, db: Session = Depends(get_db)):
    try:
        return MLService.predict_demand(db=db, req=req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/stockout", response_model=StockoutRiskResponse)
def predict_stockout_risk(req: StockoutRiskRequest, db: Session = Depends(get_db)):
    try:
        return MLService.predict_stockout_risk(db=db, req=req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stockout risk prediction error: {str(e)}")

@router.post("/repeat-purchase", response_model=RepeatPurchaseResponse)
def predict_repeat_purchase(req: RepeatPurchaseRequest, db: Session = Depends(get_db)):
    try:
        return MLService.predict_repeat_purchase(db=db, req=req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repeat purchase prediction error: {str(e)}")
