# RetailIQ — REST API Reference

Base URL: `http://127.0.0.1:8000`  
Swagger UI Documentation: `http://127.0.0.1:8000/docs`  
ReDoc Documentation: `http://127.0.0.1:8000/redoc`

---

## 1. System Endpoints

### `GET /` & `GET /health` & `GET /api/health`
Health check and database connectivity probe.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "api": "RetailIQ — Business Intelligence & Predictive Analytics Platform",
  "version": "1.0.0",
  "database": "Connected",
  "indexed_sales_transactions": 257000
}
```

---

## 2. Analytics & KPI Endpoints

### `GET /api/dashboard/kpis`
Fetches executive macro metrics (Gross Revenue, Net Profit, Margin %, AOV, Total Units), monthly trend series, category share distribution, and top-ranking products/stores.

### `GET /api/sales`
Fetches comprehensive sales intelligence:
- Monthly sales trajectory with MoM and YoY percentage deltas.
- Discount tier revenue impact (No Discount, 10-15%, 20-30%, 40%+).
- Channel payment method share distribution.
- Category return volumes and net refund sums.

### `GET /api/products`
Lists all merchandise products in the catalog with SKU, category, cost price, retail price, and target margin.

### `GET /api/products/{id}`
Returns granular historical performance for an individual SKU:
- Total units merchandised and net revenue generated.
- Average realized margin percentage.
- Monthly sales trend curve across FY23–FY25.
- Cross-store inventory matrix showing localized units on hand.
- Instant 30-day demand forecast.

### `GET /api/customers`
Returns RFM segmentation analytics:
- Segment customer count and total monetary contribution.
- Average Recency, Frequency, and Monetary scores per segment.
- Top VIP customer leaderboard with detail links.

### `GET /api/customers/{id}`
Returns customer behavioral profile, registration date, lifetime spend, order count, and assigned RFM segment.

### `GET /api/stores`
Returns regional performance summaries and sortable store rankings across all 20 outlets (total revenue, profit, units, square footage, and revenue/sqft).

### `GET /api/inventory`
Returns supply chain inventory health overview:
- Total warehouse valuation ($).
- Annual turnover ratio.
- Fast-moving vs slow-moving merchandise lists.
- Full inventory risk table with `LOW`, `MEDIUM`, `HIGH` stockout severity flags.

---

## 3. Predictive Machine Learning Endpoints

### `POST /api/predict/demand`
Executes the Gradient Boosting demand forecasting model for a designated product-store pair.
- **Request Body:**
```json
{
  "product_id": "PRD1001",
  "store_id": "STR101",
  "forecast_days": 30,
  "promo_planned": false,
  "discount_pct": 0.0
}
```
- **Response `200 OK`:**
```json
{
  "product_id": "PRD1001",
  "store_id": "STR101",
  "forecast_days": 30,
  "predicted_daily_units": 3.82,
  "predicted_total_units": 115,
  "model_used": "Gradient Boosting Regressor",
  "confidence_interval": [98, 132]
}
```

### `POST /api/predict/stockout`
Executes the Random Forest stockout classifier to calculate risk category and days of cover.
- **Request Body:**
```json
{
  "product_id": "PRD1001",
  "store_id": "STR101",
  "current_stock": 14,
  "safety_stock": 25,
  "reorder_level": 50,
  "daily_velocity_30d": 3.8
}
```
- **Response `200 OK`:**
```json
{
  "product_id": "PRD1001",
  "store_id": "STR101",
  "risk_level": "HIGH",
  "probability": 0.942,
  "days_of_cover": 3.68,
  "recommended_action": "TRIGGER_EMERGENCY_REORDER"
}
```

### `POST /api/predict/repeat-purchase`
Predicts the likelihood that a customer will place a repeat purchase within 30–90 days.
- **Request Body:**
```json
{
  "customer_id": "CUST001",
  "recency_days": 18,
  "total_orders": 8,
  "total_monetary": 1420.50
}
```

---

## 4. Ingestion & Insights Endpoints

### `POST /api/upload`
Ingests a CSV or XLSX dataset containing sales or inventory updates into MySQL with full ACID validation and reporting.

### `GET /api/insights/rule-based`
Executes deterministic mathematical business heuristics against database tables to produce actionable operational directives.
