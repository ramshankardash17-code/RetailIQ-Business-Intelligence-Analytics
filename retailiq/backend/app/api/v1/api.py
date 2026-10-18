from fastapi import APIRouter
from retailiq.backend.app.api.v1.endpoints import (
    dashboard,
    sales,
    products,
    customers,
    stores,
    inventory,
    predictions,
    upload,
    insights
)

api_router = APIRouter()

# Core Domain Endpoints
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Executive Dashboard"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales Analytics"])
api_router.include_router(products.router, prefix="/products", tags=["Product Analytics"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customer Analytics"])
api_router.include_router(stores.router, prefix="/stores", tags=["Store & Regional Analytics"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory Analytics"])

# Top-level /analytics alias endpoints for exact prompt matching
api_router.include_router(sales.router, prefix="/analytics/sales", tags=["Analytics Alias"])
api_router.include_router(products.router, prefix="/analytics/products", tags=["Analytics Alias"])
api_router.include_router(customers.router, prefix="/analytics/customers", tags=["Analytics Alias"])
api_router.include_router(stores.router, prefix="/analytics/regions", tags=["Analytics Alias"])

# Machine Learning Predictions
api_router.include_router(predictions.router, prefix="/predict", tags=["Prediction Center"])

# Data Management
api_router.include_router(upload.router, prefix="/upload", tags=["Data Management"])

# Rule-Based Insights
api_router.include_router(insights.router, prefix="/insights", tags=["Business Insights"])
