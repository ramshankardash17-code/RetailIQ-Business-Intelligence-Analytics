from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Demand Forecasting Schemas
# -----------------------------------------------------------------------------
class DemandForecastRequest(BaseModel):
    product_id: str = Field(..., example="PRD1005")
    store_id: str = Field(..., example="STR101")
    forecast_days: int = Field(default=30, ge=7, le=90)
    planned_discount_pct: float = Field(default=0.0, ge=0.0, le=50.0)
    has_promotion: bool = Field(default=False)

class DailyForecastPoint(BaseModel):
    date: str
    day_name: str
    predicted_units: float
    is_weekend: bool

class DemandForecastResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    store_id: str
    store_name: str
    forecast_days: int
    total_predicted_demand: int
    avg_daily_demand: float
    current_inventory: int
    expected_inventory_balance: int
    inventory_status: str # "SURPLUS", "BALANCED", "DEFICIT / CRITICAL SHORTAGE"
    stockout_risk: str # "LOW", "MEDIUM", "HIGH"
    stockout_expected_day: Optional[int] = None
    daily_forecast: List[DailyForecastPoint]
    model_name: str
    model_metrics: Dict[str, Any]

# -----------------------------------------------------------------------------
# Stockout Risk Schemas
# -----------------------------------------------------------------------------
class StockoutRiskRequest(BaseModel):
    product_id: str = Field(..., example="PRD1005")
    store_id: str = Field(..., example="STR101")

class StockoutRiskResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    store_id: str
    store_name: str
    current_stock: int
    safety_stock: int
    reorder_level: int
    velocity_30d: float
    days_of_inventory: float
    risk_level: str # "LOW", "MEDIUM", "HIGH"
    confidence_score: float
    factors: List[str]
    suggested_action: str

# -----------------------------------------------------------------------------
# Repeat Purchase Schemas
# -----------------------------------------------------------------------------
class RepeatPurchaseRequest(BaseModel):
    customer_id: str = Field(..., example="CUST00001")
    timeframe_days: int = Field(default=90, ge=30, le=180)

class RepeatPurchaseResponse(BaseModel):
    customer_id: str
    customer_name: str
    customer_segment: str
    recency_days: int
    frequency: int
    monetary_value: float
    avg_order_value: float
    repeat_probability: float
    repeat_probability_pct: str
    predicted_class: str # "Likely Repeat Buyer", "Unlikely Repeat Buyer"
    churn_risk_level: str # "LOW", "MEDIUM", "HIGH"
    key_drivers: List[str]
    recommended_retention_action: str

# -----------------------------------------------------------------------------
# Data Upload Schemas
# -----------------------------------------------------------------------------
class UploadSummaryResponse(BaseModel):
    filename: str
    dataset_type: str
    total_rows_received: int
    valid_rows_parsed: int
    invalid_rows_skipped: int
    duplicate_rows_ignored: int
    records_inserted_to_mysql: int
    validation_status: str
    sample_errors: List[str]
