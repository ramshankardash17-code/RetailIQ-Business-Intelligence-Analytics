-- =============================================================================
-- RetailIQ Analytical Views for Business Intelligence & Power BI
-- =============================================================================

USE retailiq_db;

-- 1. Daily Sales Summary View
DROP VIEW IF EXISTS vw_daily_sales;
CREATE VIEW vw_daily_sales AS
SELECT 
    s.order_date,
    st.region,
    st.store_id,
    st.store_name,
    p.category,
    COUNT(DISTINCT s.order_id) AS total_orders,
    COUNT(DISTINCT s.customer_id) AS unique_customers,
    SUM(s.quantity) AS total_units_sold,
    SUM(s.gross_revenue) AS gross_revenue,
    SUM(s.discount_amount) AS total_discount,
    SUM(s.net_revenue) AS net_revenue,
    SUM(s.profit) AS total_profit,
    ROUND(SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS profit_margin_pct
FROM sales s
JOIN stores st ON s.store_id = st.store_id
JOIN products p ON s.product_id = p.product_id
GROUP BY s.order_date, st.region, st.store_id, st.store_name, p.category;

-- 2. Monthly Performance View
DROP VIEW IF EXISTS vw_monthly_sales;
CREATE VIEW vw_monthly_sales AS
SELECT 
    YEAR(s.order_date) AS sales_year,
    MONTH(s.order_date) AS sales_month,
    DATE_FORMAT(s.order_date, '%Y-%m') AS period_year_month,
    COUNT(DISTINCT s.order_id) AS total_orders,
    COUNT(DISTINCT s.customer_id) AS unique_customers,
    SUM(s.quantity) AS total_units_sold,
    ROUND(SUM(s.net_revenue), 2) AS total_revenue,
    ROUND(SUM(s.profit), 2) AS total_profit,
    ROUND(SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS profit_margin_pct,
    ROUND(SUM(s.net_revenue) / NULLIF(COUNT(DISTINCT s.order_id), 0), 2) AS average_order_value
FROM sales s
GROUP BY YEAR(s.order_date), MONTH(s.order_date), DATE_FORMAT(s.order_date, '%Y-%m');

-- 3. Product Performance & Inventory View
DROP VIEW IF EXISTS vw_product_performance;
CREATE VIEW vw_product_performance AS
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    p.subcategory,
    p.cost_price,
    p.unit_price,
    p.target_margin_pct,
    COALESCE(SUM(s.quantity), 0) AS total_units_sold,
    ROUND(COALESCE(SUM(s.net_revenue), 0), 2) AS total_revenue,
    ROUND(COALESCE(SUM(s.profit), 0), 2) AS total_profit,
    ROUND(COALESCE(SUM(s.profit), 0) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS realized_margin_pct,
    COUNT(DISTINCT r.return_id) AS return_count,
    ROUND(COUNT(DISTINCT r.return_id) / NULLIF(COUNT(DISTINCT s.order_id), 0) * 100, 2) AS return_rate_pct,
    COALESCE(inv.total_inventory, 0) AS current_total_stock
FROM products p
LEFT JOIN sales s ON p.product_id = s.product_id
LEFT JOIN returns r ON s.order_id = r.order_id AND s.product_id = r.product_id
LEFT JOIN (
    SELECT product_id, SUM(current_stock) AS total_inventory 
    FROM inventory 
    GROUP BY product_id
) inv ON p.product_id = inv.product_id
GROUP BY p.product_id, p.product_name, p.category, p.subcategory, p.cost_price, p.unit_price, p.target_margin_pct, inv.total_inventory;

-- 4. Store and Regional Performance View
DROP VIEW IF EXISTS vw_store_regional_performance;
CREATE VIEW vw_store_regional_performance AS
SELECT 
    st.store_id,
    st.store_name,
    st.city,
    st.state,
    st.region,
    st.store_type,
    st.square_feet,
    COUNT(DISTINCT s.order_id) AS total_orders,
    COUNT(DISTINCT s.customer_id) AS total_customers,
    SUM(s.quantity) AS total_units_sold,
    ROUND(SUM(s.net_revenue), 2) AS total_revenue,
    ROUND(SUM(s.profit), 2) AS total_profit,
    ROUND(SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS profit_margin_pct,
    ROUND(SUM(s.net_revenue) / NULLIF(st.square_feet, 0), 2) AS revenue_per_sqft
FROM stores st
LEFT JOIN sales s ON st.store_id = s.store_id
GROUP BY st.store_id, st.store_name, st.city, st.state, st.region, st.store_type, st.square_feet;

-- 5. Customer RFM View
DROP VIEW IF EXISTS vw_customer_rfm;
CREATE VIEW vw_customer_rfm AS
SELECT 
    agg.customer_id,
    agg.customer_name,
    agg.email,
    agg.region,
    agg.signup_date,
    agg.total_orders AS frequency,
    agg.monetary_value,
    agg.avg_order_value,
    agg.last_order_date,
    agg.recency_days,
    CASE 
        WHEN agg.total_orders >= 10 AND agg.recency_days <= 45 THEN 'Champions'
        WHEN agg.total_orders >= 6 AND agg.recency_days <= 90 THEN 'Loyal Customers'
        WHEN agg.total_orders >= 3 AND agg.recency_days <= 120 THEN 'Potential Loyalists'
        WHEN agg.total_orders >= 2 AND agg.recency_days > 120 THEN 'At Risk'
        ELSE 'Lost Customers'
    END AS rfm_segment
FROM (
    SELECT 
        c.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.email,
        c.region,
        c.signup_date,
        COUNT(DISTINCT s.order_id) AS total_orders,
        COALESCE(SUM(s.quantity), 0) AS total_units,
        COALESCE(ROUND(SUM(s.net_revenue), 2), 0) AS monetary_value,
        COALESCE(ROUND(AVG(s.net_revenue), 2), 0) AS avg_order_value,
        MAX(s.order_date) AS last_order_date,
        DATEDIFF('2025-12-31', MAX(s.order_date)) AS recency_days
    FROM customers c
    LEFT JOIN sales s ON c.customer_id = s.customer_id
    GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.region, c.signup_date
) agg;

-- 6. Inventory Risk Table View
DROP VIEW IF EXISTS vw_inventory_risk;
CREATE VIEW vw_inventory_risk AS
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    st.store_id,
    st.store_name,
    st.region,
    i.current_stock,
    i.safety_stock,
    i.reorder_level,
    COALESCE(dd.avg_daily_demand_90d, 0.5) AS avg_daily_demand,
    ROUND(i.current_stock / NULLIF(COALESCE(dd.avg_daily_demand_90d, 0.5), 0), 1) AS estimated_days_of_inventory,
    CASE 
        WHEN i.current_stock <= i.safety_stock OR (i.current_stock / NULLIF(COALESCE(dd.avg_daily_demand_90d, 0.5), 0)) <= 7 THEN 'HIGH'
        WHEN i.current_stock <= i.reorder_level OR (i.current_stock / NULLIF(COALESCE(dd.avg_daily_demand_90d, 0.5), 0)) <= 20 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS stockout_risk
FROM inventory i
JOIN products p ON i.product_id = p.product_id
JOIN stores st ON i.store_id = st.store_id
LEFT JOIN (
    SELECT 
        product_id,
        store_id,
        ROUND(SUM(quantity) / 90.0, 2) AS avg_daily_demand_90d
    FROM sales
    WHERE order_date >= '2025-10-01'
    GROUP BY product_id, store_id
) dd ON i.product_id = dd.product_id AND i.store_id = dd.store_id;
