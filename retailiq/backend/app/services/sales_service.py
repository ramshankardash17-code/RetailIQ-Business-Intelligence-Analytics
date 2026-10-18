from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

class SalesService:
    @staticmethod
    def get_sales_analytics(
        db: Session,
        year: Optional[int] = None,
        region: Optional[str] = None,
        store_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        
        filters = ["1=1"]
        params = {}

        if year:
            filters.append("YEAR(s.order_date) = :year")
            params["year"] = year
        else:
            filters.append("s.order_date >= '2023-01-01'")

        if region and region != "All":
            filters.append("st.region = :region")
            params["region"] = region

        if store_id and store_id != "All":
            filters.append("s.store_id = :store_id")
            params["store_id"] = store_id

        if category and category != "All":
            filters.append("p.category = :category")
            params["category"] = category

        where_clause = " AND ".join(filters)

        # 1. Macro Totals
        totals_sql = f"""
            SELECT 
                COALESCE(SUM(s.net_revenue), 0) AS revenue,
                COALESCE(SUM(s.profit), 0) AS profit,
                COALESCE(SUM(s.quantity), 0) AS units_sold,
                COUNT(DISTINCT s.order_id) AS total_orders,
                COALESCE(SUM(s.discount_amount), 0) AS total_discount,
                COUNT(DISTINCT CASE WHEN s.is_returned = 1 THEN s.order_id END) AS returned_orders
            FROM sales s
            JOIN stores st ON s.store_id = st.store_id
            JOIN products p ON s.product_id = p.product_id
            WHERE {where_clause}
        """
        row = db.execute(text(totals_sql), params).fetchone()
        rev = float(row.revenue)
        prof = float(row.profit)
        units = int(row.units_sold)
        orders = int(row.total_orders)
        discount = float(row.total_discount)
        returned = int(row.returned_orders)

        margin_pct = round((prof / rev * 100), 2) if rev > 0 else 0.0
        aov = round((rev / orders), 2) if orders > 0 else 0.0
        return_rate_pct = round((returned / orders * 100), 2) if orders > 0 else 0.0

        # 2. Monthly Trend with MoM and YoY calculations
        monthly_sql = f"""
            WITH MonthlyAgg AS (
                SELECT 
                    YEAR(s.order_date) AS yr,
                    MONTH(s.order_date) AS mth,
                    DATE_FORMAT(s.order_date, '%Y-%m') AS ym,
                    ROUND(SUM(s.net_revenue), 2) AS monthly_revenue,
                    ROUND(SUM(s.profit), 2) AS monthly_profit,
                    SUM(s.quantity) AS monthly_units,
                    COUNT(DISTINCT s.order_id) AS monthly_orders
                FROM sales s
                JOIN stores st ON s.store_id = st.store_id
                JOIN products p ON s.product_id = p.product_id
                WHERE {where_clause}
                GROUP BY YEAR(s.order_date), MONTH(s.order_date), DATE_FORMAT(s.order_date, '%Y-%m')
            ),
            MonthlyLagged AS (
                SELECT 
                    yr, mth, ym,
                    monthly_revenue, monthly_profit, monthly_units, monthly_orders,
                    LAG(monthly_revenue, 1) OVER (ORDER BY yr, mth) AS prev_mth_rev,
                    LAG(monthly_revenue, 12) OVER (ORDER BY yr, mth) AS prev_yr_rev
                FROM MonthlyAgg
            )
            SELECT 
                ym,
                monthly_revenue,
                monthly_profit,
                monthly_units,
                monthly_orders,
                ROUND((monthly_profit / NULLIF(monthly_revenue, 0)) * 100, 2) AS margin_pct,
                ROUND(((monthly_revenue - prev_mth_rev) / NULLIF(prev_mth_rev, 0)) * 100, 2) AS mom_growth_pct,
                ROUND(((monthly_revenue - prev_yr_rev) / NULLIF(prev_yr_rev, 0)) * 100, 2) AS yoy_growth_pct
            FROM MonthlyLagged
            ORDER BY ym ASC
        """
        monthly_rows = db.execute(text(monthly_sql), params).fetchall()
        monthly_trajectory = [
            {
                "period": r.ym,
                "revenue": float(r.monthly_revenue),
                "profit": float(r.monthly_profit),
                "units": int(r.monthly_units),
                "orders": int(r.monthly_orders),
                "margin_pct": float(r.margin_pct) if r.margin_pct is not None else 0.0,
                "mom_growth_pct": float(r.mom_growth_pct) if r.mom_growth_pct is not None else 0.0,
                "yoy_growth_pct": float(r.yoy_growth_pct) if r.yoy_growth_pct is not None else 0.0
            }
            for r in monthly_rows
        ]

        # 3. Discount Tier Impact
        disc_sql = f"""
            SELECT 
                CASE 
                    WHEN s.discount_amount = 0 THEN 'No Discount'
                    WHEN (s.discount_amount / s.gross_revenue) <= 0.10 THEN '1% - 10% Low'
                    WHEN (s.discount_amount / s.gross_revenue) <= 0.20 THEN '11% - 20% Moderate'
                    ELSE '21%+ Clearance'
                END AS discount_tier,
                COUNT(DISTINCT s.order_id) AS orders_count,
                SUM(s.quantity) AS units_sold,
                ROUND(SUM(s.gross_revenue), 2) AS gross_revenue,
                ROUND(SUM(s.discount_amount), 2) AS discount_amount,
                ROUND(SUM(s.net_revenue), 2) AS net_revenue,
                ROUND(SUM(s.profit), 2) AS profit,
                ROUND(SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS margin_pct
            FROM sales s
            JOIN stores st ON s.store_id = st.store_id
            JOIN products p ON s.product_id = p.product_id
            WHERE {where_clause}
            GROUP BY discount_tier
            ORDER BY net_revenue DESC
        """
        disc_rows = db.execute(text(disc_sql), params).fetchall()
        discount_impact = [
            {
                "tier": r.discount_tier,
                "orders": int(r.orders_count),
                "units": int(r.units_sold),
                "gross_revenue": float(r.gross_revenue),
                "discount_amount": float(r.discount_amount),
                "net_revenue": float(r.net_revenue),
                "profit": float(r.profit),
                "margin_pct": float(r.margin_pct) if r.margin_pct is not None else 0.0
            }
            for r in disc_rows
        ]

        # 4. Payment Method Breakdown
        pay_sql = f"""
            SELECT 
                s.payment_method,
                COUNT(DISTINCT s.order_id) AS orders_count,
                ROUND(SUM(s.net_revenue), 2) AS net_revenue,
                ROUND(AVG(s.net_revenue), 2) AS avg_ticket
            FROM sales s
            JOIN stores st ON s.store_id = st.store_id
            JOIN products p ON s.product_id = p.product_id
            WHERE {where_clause}
            GROUP BY s.payment_method
            ORDER BY net_revenue DESC
        """
        pay_rows = db.execute(text(pay_sql), params).fetchall()
        payment_methods = [
            {
                "method": r.payment_method,
                "orders": int(r.orders_count),
                "revenue": float(r.net_revenue),
                "aov": float(r.avg_ticket),
                "share_pct": round((float(r.net_revenue) / rev * 100), 2) if rev > 0 else 0.0
            }
            for r in pay_rows
        ]

        # 5. Returns Impact by Category
        ret_sql = f"""
            SELECT 
                p.category,
                COUNT(DISTINCT s.order_id) AS total_orders,
                COUNT(DISTINCT CASE WHEN s.is_returned = 1 THEN s.order_id END) AS return_orders,
                ROUND(COUNT(DISTINCT CASE WHEN s.is_returned = 1 THEN s.order_id END) / NULLIF(COUNT(DISTINCT s.order_id), 0) * 100, 2) AS return_rate_pct,
                ROUND(SUM(CASE WHEN s.is_returned = 1 THEN s.net_revenue ELSE 0 END), 2) AS refunded_amount
            FROM sales s
            JOIN products p ON s.product_id = p.product_id
            JOIN stores st ON s.store_id = st.store_id
            WHERE {where_clause}
            GROUP BY p.category
            ORDER BY return_rate_pct DESC
        """
        ret_rows = db.execute(text(ret_sql), params).fetchall()
        returns_impact = [
            {
                "category": r.category,
                "orders": int(r.total_orders),
                "returns": int(r.return_orders),
                "return_rate_pct": float(r.return_rate_pct) if r.return_rate_pct is not None else 0.0,
                "refunded_amount": float(r.refunded_amount) if r.refunded_amount is not None else 0.0
            }
            for r in ret_rows
        ]

        return {
            "summary": {
                "revenue": rev,
                "profit": prof,
                "margin_pct": margin_pct,
                "orders": orders,
                "units_sold": units,
                "aov": aov,
                "total_discount": discount,
                "return_rate_pct": return_rate_pct
            },
            "monthly_trajectory": monthly_trajectory,
            "discount_impact": discount_impact,
            "payment_methods": payment_methods,
            "returns_impact": returns_impact
        }
