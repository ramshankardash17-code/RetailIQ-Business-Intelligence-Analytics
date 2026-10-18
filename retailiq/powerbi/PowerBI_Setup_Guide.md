# RetailIQ — Power BI Architecture, Modeling & Implementation Guide

This guide details the complete process for connecting Microsoft Power BI to the **RetailIQ MySQL Database (`retailiq_db`)**, creating the enterprise Star Schema data model, implementing DAX measures, and configuring the 7-page analytical report suite.

---

## 1. Data Connection Architecture

RetailIQ is designed for direct integration with **Power BI Desktop** and **Power BI Service** using MySQL DirectQuery or Import mode.

### Database Credentials
- **Server:** `127.0.0.1:3306` (or `localhost:3306`)
- **Database:** `retailiq_db`
- **Driver:** MySQL Connector/NET (8.0.32 or newer)
- **Data Mode:** Import Mode (recommended for high-speed local DAX aggregations) or DirectQuery.

### Tables / Views to Ingest
Import the following tables and views created by RetailIQ:
1. `sales` (Fact Table)
2. `customers` (Dimension)
3. `products` (Dimension)
4. `stores` (Dimension)
5. `promotions` (Dimension)
6. `inventory` (Fact Table)
7. `returns` (Fact Table)
8. `vw_monthly_sales` (Aggregated Reporting View)
9. `vw_inventory_risk` (Pre-calculated Supply Chain View)

---

## 2. Enterprise Star Schema Relationships

Configure the relationships in the **Power BI Model View** as follows:

| From Table (Fact / Source) | Foreign Key Column | To Table (Dimension) | Primary Key Column | Cardinality | Cross Filter Direction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sales` | `customer_id` | `customers` | `customer_id` | Many-to-One (*:1) | Single |
| `sales` | `product_id` | `products` | `product_id` | Many-to-One (*:1) | Single |
| `sales` | `store_id` | `stores` | `store_id` | Many-to-One (*:1) | Single |
| `sales` | `promo_id` | `promotions` | `promo_id` | Many-to-One (*:1) | Single |
| `sales` | `order_date` | `Dim_Date` | `Date` | Many-to-One (*:1) | Single |
| `inventory` | `product_id` | `products` | `product_id` | Many-to-One (*:1) | Single |
| `inventory` | `store_id` | `stores` | `store_id` | Many-to-One (*:1) | Single |
| `returns` | `order_id` | `sales` | `order_id` | Many-to-One (*:1) | Both (or Inactive) |

---

## 3. Dedicated Date Dimension (DAX Calendar)

Create a central calendar table in Power BI:

```dax
Dim_Date = 
VAR MinYear = 2023
VAR MaxYear = 2026
RETURN
ADDCOLUMNS (
    CALENDAR (DATE(MinYear, 1, 1), DATE(MaxYear, 12, 31)),
    "Year", YEAR([Date]),
    "Quarter", "Q" & FORMAT([Date], "Q"),
    "Month Num", MONTH([Date]),
    "Month Name", FORMAT([Date], "MMMM"),
    "Month Short", FORMAT([Date], "MMM"),
    "Year-Month", FORMAT([Date], "YYYY-MM"),
    "Day of Week", FORMAT([Date], "dddd"),
    "Day Num", WEEKDAY([Date], 2),
    "Is Weekend", IF(WEEKDAY([Date], 2) >= 6, "Weekend", "Weekday")
)
```

---

## 4. 7-Page Enterprise Report Layout Architecture

### Page 1: Executive Overview
- **Visuals:**
  - KPI Cards: Net Revenue, Net Profit, Profit Margin %, Total Orders, Unique Customers, Units Sold, YoY Growth %.
  - Dual-Axis Area/Line Chart: Net Revenue vs Net Profit by Month.
  - Donut Chart: Revenue Contribution by Category.
  - Stacked Bar Chart: Regional Revenue Share.
  - Top 5 Products & Top 5 Stores Tables with Data Bars.
- **Slicers:** Date Range Slider, Region, Store Type.

### Page 2: Sales Analysis
- **Visuals:**
  - Monthly Trajectory with MoM Growth Bar Chart.
  - Discount Tier Matrix (Volume vs Margin Compression).
  - Payment Method Breakdown Donut.
  - Returns Rate Impact by Category.
  - Sales Fact Transaction Log with Pagination.

### Page 3: Product Performance & Catalog Drill-down
- **Visuals:**
  - SKU Dropdown Selector.
  - Metric Cards: Unit Price, Realized Margin, Units Sold, Current Stock.
  - 12-Month Sales Trajectory for Selected SKU.
  - Store Inventory Distribution Bar Chart.
  - Category Margin Scatter Plot (Margin % vs Revenue Volume).

### Page 4: Customer Intelligence & RFM
- **Visuals:**
  - Customer Segment Distribution Treemap (Champions, Loyal, Potential Loyalists, At Risk, Lost).
  - Segment Value Comparison (Total Monetary Spend vs Customer Count).
  - Customer Lifetime Value Distribution Histogram.
  - High-Value VIP Customer Table with Recency Days and Segment Flags.

### Page 5: Store & Regional Analysis
- **Visuals:**
  - Regional Map with Bubble Sizing by Net Revenue.
  - Store Performance Ranking Table with Revenue per Square Foot.
  - Category Mix by Region Stacked 100% Bar Chart.
  - Store Efficiency Matrix (Square Feet vs Profit Margin).

### Page 6: Inventory Velocity & Supply Chain
- **Visuals:**
  - Supply Chain Health Cards: Inventory Valuation, Annual Turnover Ratio, Average Days Cover.
  - **Inventory Risk Matrix Table:** Product Name | Store Name | Stock | 30D Velocity | Days Cover | Risk Level (Conditional Formatting: Red for HIGH, Amber for MEDIUM, Green for LOW).
  - Fast-Moving vs Slow-Moving Merchandise Treemap.
  - Reorder Approaching List.

### Page 7: Predictive Analytics & Demand Forecast Center
- **Visuals:**
  - 30/60/90 Day Forecast Curve with Confidence Intervals.
  - Expected Shortage / Surplus Projection.
  - Customer Repeat Purchase Probability Distribution.
  - Stockout Risk Classification Drivers.

---

## 5. Web Embedding Instructions

To embed your published Power BI report into the RetailIQ React web frontend:
1. Publish report to **Power BI Service (app.powerbi.com)** in a Pro or Premium workspace.
2. Select **File > Embed Report > Publish to web (public)** or **Website or portal (secure Azure AD / Power BI Embedded)**.
3. Copy the Embed URL.
4. Open `retailiq/frontend/src/pages/PowerBIReports.jsx` and paste the URL into `EMBED_URL`.
5. The React frontend includes a built-in interactive responsive container with full-screen toggles, export bookmarks, and DAX query inspector.
