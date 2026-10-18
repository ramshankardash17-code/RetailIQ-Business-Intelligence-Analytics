from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.insight_generator import InsightGenerator
from retailiq.backend.app.schemas.analytics import BusinessInsight

router = APIRouter()

@router.get("/rule-based", response_model=List[BusinessInsight])
def get_rule_based_insights(db: Session = Depends(get_db)):
    return InsightGenerator.generate_rule_based_insights(db=db)
