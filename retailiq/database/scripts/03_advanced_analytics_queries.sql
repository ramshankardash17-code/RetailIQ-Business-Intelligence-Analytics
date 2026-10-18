-- =============================================================================
-- RetailIQ — Advanced SQL Analytics & Portfolio Queries
-- Demonstrating CTEs, Window Functions (ROW_NUMBER, RANK, LAG, LEAD, Rolling Avg),
-- YoY / MoM Growth, RFM Segmentation, Inventory Turnover, and Return Impact
-- Target DBMS: PostgreSQL 14+ / Render PostgreSQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Query 1: Monthly Revenue, Profit, MoM and YoY Growth using CTE & LAG Window Function
-- -----------------------------------------------------------------------------
WITH MonthlyAgg AS (
    SELECT 
        EXTRACT(YEAR FROM order_date)::INT AS yr,
        EXTRACT(MONTH FROM order_date)::INT AS mth,
        TO_CHAR(order_date, 'YYYY-MM') AS ym,
        ROUND(SUM(net_revenue)::numeric, 2) AS monthly_revenue,
        ROUND(SUM(profit)::numeric, 2) AS monthly_profit,
        COUNT(DISTINCT order_id) AS total_orders
    FROM sales
    GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date), TO_CHAR(order_date, 'YYYY-MM')
),
MonthlyWithLag AS (
    SELECT 
        yr,
        mth,
        ym,
        monthly_revenue,
        monthly_profit,
        total_orders,
        -- Prior month revenue for MoM
        LAG(monthly_revenue, 1) OVER (ORDER BY yr, mth) AS prev_month_rev,
        -- Prior year same month revenue for YoY
        LAG(monthly_revenue, 12) OVER (ORDER BY yr, mth) AS prev_year_rev
    FROM MonthlyAgg
)
SELECT 
    ym,
    monthly_revenue,
    monthly_profit,
    ROUND(((monthly_profit / NULLIF(monthly_revenue, 0)) * 100)::numeric, 2) AS profit_margin_pct,
    ROUND((((monthly_revenue - prev_month_rev) / NULLIF(prev_month_rev, 0)) * 100)::numeric, 2) AS mom_revenue_growth_pct,
    ROUND((((monthly_revenue - prev_year_rev) / NULLIF(prev_year_rev, 0)) * 100)::numeric, 2) AS yoy_revenue_growth_pct
FROM MonthlyWithLag
ORDER BY ym;

-- -----------------------------------------------------------------------------
-- Query 2: Top Products by Revenue within Each Category (Partitioned RANK & ROW_NUMBER)
-- -----------------------------------------------------------------------------
WITH ProductCatRevenue AS (
    SELECT 
        p.category,
        p.product_id,
        p.product_name,
        SUM(s.quantity) AS units_sold,
        ROUND(SUM(s.net_revenue)::numeric, 2) AS total_revenue,
        ROUND(SUM(s.profit)::numeric, 2) AS total_profit,
        ROUND(((SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0)) * 100)::numeric, 2) AS profit_margin_pct
    FROM products p
    JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.category, p.product_id, p.product_name
),
RankedProducts AS (
    SELECT 
        category,
        product_name,
        units_sold,
        total_revenue,
        total_profit,
        profit_margin_pct,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_revenue DESC) AS category_rank
    FROM ProductCatRevenue
)
SELECT 
    category,
    product_name,
    units_sold,
    total_revenue,
    total_profit,
    profit_margin_pct,
    category_rank
FROM RankedProducts
WHERE category_rank <= 3
ORDER BY category, category_rank;

-- -----------------------------------------------------------------------------
-- Query 3: 30-Day Rolling Average Daily Revenue (Moving Average Window Function)
-- -----------------------------------------------------------------------------
WITH DailyRevenue AS (
    SELECT 
        order_date,
        ROUND(SUM(net_revenue)::numeric, 2) AS daily_rev,
        COUNT(DISTINCT order_id) AS daily_orders
    FROM sales
    GROUP BY order_date
)
SELECT 
    order_date,
    daily_rev,
    daily_orders,
    ROUND((AVG(daily_rev) OVER (
        ORDER BY order_date 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ))::numeric, 2) AS rolling_30d_avg_revenue
FROM DailyRevenue
ORDER BY order_date;

-- -----------------------------------------------------------------------------
-- Query 4: Store Regional Performance & Revenue Share using SUM() OVER (PARTITION BY Region)
-- -----------------------------------------------------------------------------
WITH StoreSales AS (
    SELECT 
        st.region,
        st.store_id,
        st.store_name,
        ROUND(SUM(s.net_revenue)::numeric, 2) AS store_revenue,
        ROUND(SUM(s.profit)::numeric, 2) AS store_profit,
        COUNT(DISTINCT s.order_id) AS total_orders
    FROM stores st
    JOIN sales s ON st.store_id = s.store_id
    GROUP BY st.region, st.store_id, st.store_name
)
SELECT 
    region,
    store_name,
    store_revenue,
    store_profit,
    ROUND(((store_profit / NULLIF(store_revenue, 0)) * 100)::numeric, 2) AS profit_margin_pct,
    SUM(store_revenue) OVER (PARTITION BY region) AS regional_total_revenue,
    ROUND(((store_revenue / NULLIF(SUM(store_revenue) OVER (PARTITION BY region), 0)) * 100)::numeric, 2) AS share_of_region_pct,
    RANK() OVER (PARTITION BY region ORDER BY store_revenue DESC) AS store_regional_rank
FROM StoreSales
ORDER BY region, store_regional_rank;

-- -----------------------------------------------------------------------------
-- Query 5: Discount Impact Analysis on Margin and Volume (Binned Case Study)
-- -----------------------------------------------------------------------------
WITH BinnedSales AS (
    SELECT 
        CASE 
            WHEN discount_amount = 0 THEN '0% No Discount'
            WHEN (discount_amount / NULLIF(gross_revenue, 0)) <= 0.10 THEN '1% - 10% Low Discount'
            WHEN (discount_amount / NULLIF(gross_revenue, 0)) <= 0.20 THEN '11% - 20% Moderate Discount'
            ELSE '21%+ High Clearance Discount'
        END AS discount_tier,
        order_id,
        quantity,
        gross_revenue,
        discount_amount,
        net_revenue,
        profit
    FROM sales
)
SELECT 
    discount_tier,
    COUNT(DISTINCT order_id) AS order_count,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(gross_revenue)::numeric, 2) AS gross_sales,
    ROUND(SUM(discount_amount)::numeric, 2) AS total_discount_given,
    ROUND(SUM(net_revenue)::numeric, 2) AS net_revenue,
    ROUND(SUM(profit)::numeric, 2) AS total_profit,
    ROUND(((SUM(profit) / NULLIF(SUM(net_revenue), 0)) * 100)::numeric, 2) AS profit_margin_pct
FROM BinnedSales
GROUP BY discount_tier
ORDER BY net_revenue DESC;

-- -----------------------------------------------------------------------------
-- Query 6: Customer Lifetime Value (CLV) & Purchasing Behavior Quintiles (NTILE)
-- -----------------------------------------------------------------------------
WITH CustomerMetrics AS (
    SELECT 
        c.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS full_name,
        c.region,
        c.signup_date,
        COUNT(DISTINCT s.order_id) AS order_count,
        ROUND(SUM(s.net_revenue)::numeric, 2) AS total_spent,
        ROUND(AVG(s.net_revenue)::numeric, 2) AS avg_basket_size,
        (DATE '2025-12-31' - MAX(s.order_date))::INT AS days_since_last_purchase
    FROM customers c
    JOIN sales s ON c.customer_id = s.customer_id
    GROUP BY c.customer_id, c.first_name, c.last_name, c.region, c.signup_date
)
SELECT 
    customer_id,
    full_name,
    region,
    order_count,
    total_spent,
    avg_basket_size,
    days_since_last_purchase,
    NTILE(5) OVER (ORDER BY total_spent DESC) AS clv_quintile,
    CASE 
        WHEN NTILE(5) OVER (ORDER BY total_spent DESC) = 1 THEN 'Tier 1 - Platinum VIP'
        WHEN NTILE(5) OVER (ORDER BY total_spent DESC) = 2 THEN 'Tier 2 - Gold High Value'
        WHEN NTILE(5) OVER (ORDER BY total_spent DESC) = 3 THEN 'Tier 3 - Silver Regular'
        WHEN NTILE(5) OVER (ORDER BY total_spent DESC) = 4 THEN 'Tier 4 - Bronze Occasional'
        ELSE 'Tier 5 - One-time / Inactive'
    END AS clv_tier
FROM CustomerMetrics
ORDER BY total_spent DESC
LIMIT 100;

-- -----------------------------------------------------------------------------
-- Query 7: Fast-Moving vs Slow-Moving Products & Inventory Turnover Velocity
-- -----------------------------------------------------------------------------
WITH ProductVelocity AS (
    SELECT 
        p.product_id,
        p.product_name,
        p.category,
        COALESCE(SUM(s.quantity), 0) AS units_sold_180d,
        ROUND((COALESCE(SUM(s.quantity), 0)::numeric / 180.0), 2) AS daily_sales_velocity,
        COALESCE(inv.current_stock, 0) AS total_inventory
    FROM products p
    LEFT JOIN sales s ON p.product_id = s.product_id AND s.order_date >= '2025-07-01'
    LEFT JOIN (
        SELECT product_id, SUM(current_stock) AS current_stock 
        FROM inventory 
        GROUP BY product_id
    ) inv ON p.product_id = inv.product_id
    GROUP BY p.product_id, p.product_name, p.category, inv.current_stock
)
SELECT 
    product_id,
    product_name,
    category,
    units_sold_180d,
    daily_sales_velocity,
    total_inventory,
    ROUND((total_inventory::numeric / NULLIF(daily_sales_velocity, 0)), 1) AS estimated_days_to_stockout,
    CASE 
        WHEN daily_sales_velocity >= 5.0 AND (total_inventory::numeric / NULLIF(daily_sales_velocity, 0)) < 15 THEN 'Fast-Moving (High Stockout Risk)'
        WHEN daily_sales_velocity >= 3.0 THEN 'Fast-Moving (Healthy)'
        WHEN daily_sales_velocity BETWEEN 0.8 AND 2.9 THEN 'Moderate Turnover'
        ELSE 'Slow-Moving / Overstocked'
    END AS velocity_classification
FROM ProductVelocity
ORDER BY daily_sales_velocity DESC;

-- -----------------------------------------------------------------------------
-- Query 8: Category Return Rates and Revenue Lost to Returns
-- -----------------------------------------------------------------------------
SELECT 
    p.category,
    COUNT(DISTINCT s.order_id) AS total_orders,
    COUNT(DISTINCT r.return_id) AS total_returns,
    ROUND(((COUNT(DISTINCT r.return_id)::numeric / NULLIF(COUNT(DISTINCT s.order_id), 0)) * 100)::numeric, 2) AS return_rate_pct,
    ROUND(SUM(s.net_revenue)::numeric, 2) AS gross_sales_volume,
    ROUND(COALESCE(SUM(r.refund_amount), 0)::numeric, 2) AS total_refunded_amount,
    ROUND(((COALESCE(SUM(r.refund_amount), 0) / NULLIF(SUM(s.net_revenue), 0)) * 100)::numeric, 2) AS refund_pct_of_sales
FROM products p
JOIN sales s ON p.product_id = s.product_id
LEFT JOIN returns r ON s.order_id = r.order_id AND s.product_id = r.product_id
GROUP BY p.category
ORDER BY return_rate_pct DESC;
