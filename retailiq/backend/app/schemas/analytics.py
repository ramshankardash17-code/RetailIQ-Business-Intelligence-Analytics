from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Dashboard & KPI Schemas
# -----------------------------------------------------------------------------
class KPIMetric(BaseModel):
    label: str
    value: float
    formatted: str
    previous_value: float
    delta_pct: float
    is_positive: bool

class DashboardSummaryResponse(BaseModel):
    total_revenue: KPIMetric
    total_profit: KPIMetric
    profit_margin: KPIMetric
    total_orders: KPIMetric
    unique_customers: KPIMetric
    units_sold: KPIMetric
    average_order_value: KPIMetric
    yoy_growth: KPIMetric

class RevenueProfitTrend(BaseModel):
    period: str
    revenue: float
    profit: float
    orders: int
    units: int
    margin_pct: float

class CategoryShare(BaseModel):
    category: str
    revenue: float
    profit: float
    margin_pct: float
    units_sold: int
    revenue_share_pct: float

class RegionalShare(BaseModel):
    region: str
    revenue: float
    profit: float
    orders: int
    store_count: int
    margin_pct: float

class TopItem(BaseModel):
    id: str
    name: str
    subtitle: str
    metric_value: float
    metric_formatted: str
    secondary_value: float
    secondary_formatted: str

class ExecutiveDashboardResponse(BaseModel):
    kpis: DashboardSummaryResponse
    trends: List[RevenueProfitTrend]
    category_shares: List[CategoryShare]
    regional_shares: List[RegionalShare]
    top_products: List[TopItem]
    top_stores: List[TopItem]

# -----------------------------------------------------------------------------
# Product Analytics Schemas
# -----------------------------------------------------------------------------
class ProductListItem(BaseModel):
    product_id: str
    product_name: str
    category: str
    subcategory: str
    unit_price: float
    cost_price: float
    target_margin_pct: float

class ProductDetailAnalytics(BaseModel):
    product_id: str
    product_name: str
    category: str
    subcategory: str
    unit_price: float
    cost_price: float
    total_revenue: float
    total_profit: float
    realized_margin_pct: float
    units_sold: int
    average_discount_pct: float
    return_rate_pct: float
    current_inventory: int
    monthly_sales_trend: List[Dict[str, Any]]
    regional_sales: List[Dict[str, Any]]
    store_performance: List[Dict[str, Any]]

# -----------------------------------------------------------------------------
# Customer Analytics Schemas
# -----------------------------------------------------------------------------
class CustomerSegmentMetric(BaseModel):
    segment: str
    customer_count: int
    pct_of_customers: float
    total_revenue: float
    pct_of_revenue: float
    avg_order_value: float
    avg_frequency: float
    churn_risk: str

class CustomerDetail(BaseModel):
    customer_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = "N/A"
    state: Optional[str] = "N/A"
    region: Optional[str] = "National"
    segment: str
    signup_date: Optional[str] = "N/A"
    total_orders: int
    monetary_value: float
    avg_order_value: float
    last_order_date: str
    recency_days: int

# -----------------------------------------------------------------------------
# Store & Region Schemas
# -----------------------------------------------------------------------------
class StorePerformanceItem(BaseModel):
    store_id: str
    store_name: str
    city: str
    state: str
    region: str
    store_type: str
    square_feet: int
    total_revenue: float
    total_profit: float
    profit_margin_pct: float
    total_orders: int
    revenue_per_sqft: float
    regional_rank: int

# -----------------------------------------------------------------------------
# Inventory Schemas
# -----------------------------------------------------------------------------
class InventoryHealthSummary(BaseModel):
    total_products: int
    total_stock_units: int
    total_inventory_value: float
    high_risk_count: int
    medium_risk_count: int
    healthy_count: int
    inventory_turnover_ratio: float
    avg_days_of_inventory: float

class InventoryRiskRow(BaseModel):
    product_id: str
    product_name: str
    category: str
    store_id: str
    store_name: str
    region: str
    current_stock: int
    safety_stock: int
    reorder_level: int
    avg_daily_demand: float
    forecast_daily_demand: float
    estimated_days_of_inventory: float
    stockout_risk: str

# -----------------------------------------------------------------------------
# Rule-Based Insights
# -----------------------------------------------------------------------------
class BusinessInsight(BaseModel):
    id: str
    category: str # Revenue, Margin, Inventory, Customer, Regional
    severity: str # critical, warning, positive, info
    title: str
    message: str
    metric: str
    action_recommendation: str
