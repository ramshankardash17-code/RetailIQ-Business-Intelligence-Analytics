from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.schemas.analytics import InventoryHealthSummary, InventoryRiskRow

class InventoryService:
    @staticmethod
    def get_inventory_analytics(
        db: Session,
        region: Optional[str] = None,
        risk_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        
        # 1. Health Summary
        sum_sql = """
            SELECT 
                COUNT(DISTINCT product_id) AS total_products,
                SUM(current_stock) AS total_stock_units,
                SUM(current_stock * cost_price) AS total_inventory_value
            FROM (
                SELECT i.product_id, i.current_stock, p.cost_price 
                FROM inventory i 
                JOIN products p ON i.product_id = p.product_id
            ) inv_meta
        """
        sum_row = db.execute(text(sum_sql)).fetchone()
        tot_prods = int(sum_row.total_products or 0)
        tot_units = int(sum_row.total_stock_units or 0)
        tot_val = float(sum_row.total_inventory_value or 0)

        # Risk count from vw_inventory_risk
        risk_cnt_sql = """
            SELECT 
                stockout_risk,
                COUNT(*) AS cnt
            FROM vw_inventory_risk
            GROUP BY stockout_risk
        """
        risk_counts = dict(db.execute(text(risk_cnt_sql)).fetchall())
        high_cnt = int(risk_counts.get("HIGH", 0))
        med_cnt = int(risk_counts.get("MEDIUM", 0))
        low_cnt = int(risk_counts.get("LOW", 0))

        # Overall turnover ratio (COGS / Average Inventory Value)
        cogs_sql = "SELECT COALESCE(SUM(cost_price * quantity), 0) FROM sales WHERE order_date >= '2025-01-01'"
        annual_cogs = float(db.execute(text(cogs_sql)).scalar() or 0)
        turnover_ratio = round((annual_cogs / tot_val), 1) if tot_val > 0 else 4.2
        avg_days = round((365.0 / turnover_ratio), 1) if turnover_ratio > 0 else 86.0

        health = InventoryHealthSummary(
            total_products=tot_prods,
            total_stock_units=tot_units,
            total_inventory_value=tot_val,
            high_risk_count=high_cnt,
            medium_risk_count=med_cnt,
            healthy_count=low_cnt,
            inventory_turnover_ratio=turnover_ratio,
            avg_days_of_inventory=avg_days
        )

        # 2. Risk Table (from vw_inventory_risk)
        filters = ["1=1"]
        params = {}
        if region and region != "All":
            filters.append("region = :region")
            params["region"] = region
        if risk_filter and risk_filter != "All":
            filters.append("stockout_risk = :risk")
            params["risk"] = risk_filter

        where_str = " AND ".join(filters)
        table_sql = f"""
            SELECT 
                product_id,
                product_name,
                category,
                store_id,
                store_name,
                region,
                current_stock,
                safety_stock,
                reorder_level,
                avg_daily_demand,
                estimated_days_of_inventory,
                stockout_risk
            FROM vw_inventory_risk
            WHERE {where_str}
            ORDER BY 
                CASE stockout_risk 
                    WHEN 'HIGH' THEN 1 
                    WHEN 'MEDIUM' THEN 2 
                    ELSE 3 
                END,
                estimated_days_of_inventory ASC
            LIMIT 100
        """
        table_rows = db.execute(text(table_sql), params).fetchall()

        risk_table = [
            InventoryRiskRow(
                product_id=r.product_id,
                product_name=r.product_name,
                category=r.category,
                store_id=r.store_id,
                store_name=r.store_name,
                region=r.region,
                current_stock=int(r.current_stock),
                safety_stock=int(r.safety_stock),
                reorder_level=int(r.reorder_level),
                avg_daily_demand=float(r.avg_daily_demand),
                forecast_daily_demand=round(float(r.avg_daily_demand) * 1.15, 2), # Projected 15% velocity growth
                estimated_days_of_inventory=float(r.estimated_days_of_inventory or 99.0),
                stockout_risk=r.stockout_risk
            )
            for r in table_rows
        ]

        # 3. Fast-Moving vs Slow-Moving Top 5
        fast_sql = """
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                ROUND(SUM(s.quantity) / 90.0, 2) AS daily_velocity,
                COALESCE(inv.stock, 0) AS current_stock
            FROM products p
            JOIN sales s ON p.product_id = s.product_id AND s.order_date >= '2025-10-01'
            LEFT JOIN (SELECT product_id, SUM(current_stock) AS stock FROM inventory GROUP BY product_id) inv ON p.product_id = inv.product_id
            GROUP BY p.product_id, p.product_name, p.category, inv.stock
            ORDER BY daily_velocity DESC
            LIMIT 5
        """
        fast_rows = db.execute(text(fast_sql)).fetchall()
        fast_moving = [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "category": r.category,
                "daily_velocity": float(r.daily_velocity),
                "current_stock": int(r.current_stock)
            }
            for r in fast_rows
        ]

        slow_sql = """
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                ROUND(COALESCE(SUM(s.quantity), 0) / 90.0, 2) AS daily_velocity,
                COALESCE(inv.stock, 0) AS current_stock
            FROM products p
            LEFT JOIN sales s ON p.product_id = s.product_id AND s.order_date >= '2025-10-01'
            LEFT JOIN (SELECT product_id, SUM(current_stock) AS stock FROM inventory GROUP BY product_id) inv ON p.product_id = inv.product_id
            GROUP BY p.product_id, p.product_name, p.category, inv.stock
            ORDER BY daily_velocity ASC, current_stock DESC
            LIMIT 5
        """
        slow_rows = db.execute(text(slow_sql)).fetchall()
        slow_moving = [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "category": r.category,
                "daily_velocity": float(r.daily_velocity),
                "current_stock": int(r.current_stock)
            }
            for r in slow_rows
        ]

        return {
            "health_summary": health,
            "risk_table": risk_table,
            "fast_moving": fast_moving,
            "slow_moving": slow_moving
        }
