from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.schemas.analytics import StorePerformanceItem

class StoreService:
    @staticmethod
    def get_store_regional_analytics(
        db: Session,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        
        # Regional Breakdown
        reg_sql = """
            SELECT 
                st.region,
                COUNT(DISTINCT st.store_id) AS store_count,
                ROUND(SUM(s.net_revenue), 2) AS regional_revenue,
                ROUND(SUM(s.profit), 2) AS regional_profit,
                ROUND(SUM(s.profit) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS margin_pct,
                COUNT(DISTINCT s.order_id) AS total_orders,
                ROUND(SUM(s.net_revenue) / NULLIF(SUM(st.square_feet), 0), 2) AS rev_per_sqft
            FROM stores st
            LEFT JOIN sales s ON st.store_id = s.store_id
            GROUP BY st.region
            ORDER BY regional_revenue DESC
        """
        reg_rows = db.execute(text(reg_sql)).fetchall()
        tot_rev = sum(float(r.regional_revenue or 0) for r in reg_rows)

        regional_summary = [
            {
                "region": r.region,
                "store_count": int(r.store_count),
                "revenue": float(r.regional_revenue or 0),
                "profit": float(r.regional_profit or 0),
                "margin_pct": float(r.margin_pct or 0),
                "orders": int(r.total_orders or 0),
                "rev_per_sqft": float(r.rev_per_sqft or 0),
                "share_pct": round((float(r.regional_revenue or 0) / tot_rev * 100), 1) if tot_rev > 0 else 0.0
            }
            for r in reg_rows
        ]

        # Store Rankings with Window Functions
        store_sql = f"""
            SELECT 
                st.store_id,
                st.store_name,
                st.city,
                st.state,
                st.region,
                st.store_type,
                st.square_feet,
                ROUND(COALESCE(SUM(s.net_revenue), 0), 2) AS store_rev,
                ROUND(COALESCE(SUM(s.profit), 0), 2) AS store_prof,
                ROUND(COALESCE(SUM(s.profit), 0) / NULLIF(SUM(s.net_revenue), 0) * 100, 2) AS margin_pct,
                COUNT(DISTINCT s.order_id) AS orders_cnt,
                ROUND(COALESCE(SUM(s.net_revenue), 0) / NULLIF(st.square_feet, 0), 2) AS rev_sqft,
                RANK() OVER (ORDER BY COALESCE(SUM(s.net_revenue), 0) DESC) AS overall_rank,
                RANK() OVER (PARTITION BY st.region ORDER BY COALESCE(SUM(s.net_revenue), 0) DESC) AS regional_rank
            FROM stores st
            LEFT JOIN sales s ON st.store_id = s.store_id
            {"WHERE st.region = :reg" if region and region != 'All' else ""}
            GROUP BY st.store_id, st.store_name, st.city, st.state, st.region, st.store_type, st.square_feet
            ORDER BY store_rev DESC
        """
        params = {"reg": region} if region and region != "All" else {}
        store_rows = db.execute(text(store_sql), params).fetchall()

        store_rankings = [
            StorePerformanceItem(
                store_id=r.store_id,
                store_name=r.store_name,
                city=r.city,
                state=r.state,
                region=r.region,
                store_type=r.store_type,
                square_feet=int(r.square_feet),
                total_revenue=float(r.store_rev),
                total_profit=float(r.store_prof),
                profit_margin_pct=float(r.margin_pct or 0),
                total_orders=int(r.orders_cnt),
                revenue_per_sqft=float(r.rev_sqft or 0),
                regional_rank=int(r.regional_rank)
            )
            for r in store_rows
        ]

        # Category Mix by Region
        cat_reg_sql = """
            SELECT 
                st.region,
                p.category,
                ROUND(SUM(s.net_revenue), 2) AS cat_revenue
            FROM sales s
            JOIN stores st ON s.store_id = st.store_id
            JOIN products p ON s.product_id = p.product_id
            GROUP BY st.region, p.category
            ORDER BY st.region, cat_revenue DESC
        """
        cat_reg_rows = db.execute(text(cat_reg_sql)).fetchall()
        category_by_region = {}
        for r in cat_reg_rows:
            if r.region not in category_by_region:
                category_by_region[r.region] = []
            category_by_region[r.region].append({"category": r.category, "revenue": float(r.cat_revenue)})

        return {
            "regional_summary": regional_summary,
            "store_rankings": store_rankings,
            "category_by_region": category_by_region
        }
