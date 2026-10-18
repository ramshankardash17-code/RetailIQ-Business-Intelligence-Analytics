from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.schemas.analytics import ProductListItem, ProductDetailAnalytics

class ProductService:
    @staticmethod
    def list_products(
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ProductListItem]:
        
        sql = "SELECT product_id, product_name, category, subcategory, unit_price, cost_price, target_margin_pct FROM products WHERE 1=1"
        params = {}
        if category and category != "All":
            sql += " AND category = :category"
            params["category"] = category
        if search:
            sql += " AND (product_name ILIKE :search OR product_id ILIKE :search)"
            params["search"] = f"%{search}%"
        sql += " ORDER BY category, product_name ASC"

        rows = db.execute(text(sql), params).fetchall()
        return [
            ProductListItem(
                product_id=r.product_id,
                product_name=r.product_name,
                category=r.category,
                subcategory=r.subcategory,
                unit_price=float(r.unit_price),
                cost_price=float(r.cost_price),
                target_margin_pct=float(r.target_margin_pct)
            )
            for r in rows
        ]

    @staticmethod
    def get_product_detail(db: Session, product_id: str) -> Optional[ProductDetailAnalytics]:
        # Product Metadata
        p_sql = "SELECT product_id, product_name, category, subcategory, unit_price, cost_price, target_margin_pct FROM products WHERE product_id = :pid"
        p_row = db.execute(text(p_sql), {"pid": product_id}).fetchone()
        if not p_row:
            return None

        # Cumulative Metrics
        m_sql = """
            SELECT 
                COALESCE(SUM(s.net_revenue), 0) AS total_revenue,
                COALESCE(SUM(s.profit), 0) AS total_profit,
                COALESCE(SUM(s.quantity), 0) AS units_sold,
                COALESCE(AVG(s.discount_amount), 0) AS avg_discount,
                COUNT(DISTINCT s.order_id) AS total_orders,
                COUNT(DISTINCT CASE WHEN s.is_returned IS TRUE THEN s.order_id END) AS return_orders
            FROM sales s
            WHERE s.product_id = :pid
        """
        m_row = db.execute(text(m_sql), {"pid": product_id}).fetchone()
        
        tot_rev = float(m_row.total_revenue)
        tot_prof = float(m_row.total_profit)
        units = int(m_row.units_sold)
        tot_orders = int(m_row.total_orders)
        ret_orders = int(m_row.return_orders)
        avg_disc = float(m_row.avg_discount)

        margin_pct = round((tot_prof / tot_rev * 100), 2) if tot_rev > 0 else 0.0
        return_rate_pct = round((ret_orders / tot_orders * 100), 2) if tot_orders > 0 else 0.0

        # Current total inventory across all stores
        inv_sql = "SELECT COALESCE(SUM(current_stock), 0) FROM inventory WHERE product_id = :pid"
        curr_inv = int(db.execute(text(inv_sql), {"pid": product_id}).scalar() or 0)

        # Monthly sales trend
        trend_sql = """
            SELECT 
                TO_CHAR(s.order_date, 'YYYY-MM') AS ym,
                ROUND(SUM(s.net_revenue)::numeric, 2) AS rev,
                ROUND(SUM(s.profit)::numeric, 2) AS prof,
                SUM(s.quantity) AS units
            FROM sales s
            WHERE s.product_id = :pid
            GROUP BY TO_CHAR(s.order_date, 'YYYY-MM')
            ORDER BY ym ASC
        """
        trend_rows = db.execute(text(trend_sql), {"pid": product_id}).fetchall()
        monthly_trend = [
            {"period": r.ym, "revenue": float(r.rev), "profit": float(r.prof), "units": int(r.units)}
            for r in trend_rows
        ]

        # Regional performance
        reg_sql = """
            SELECT 
                st.region,
                ROUND(SUM(s.net_revenue)::numeric, 2) AS rev,
                SUM(s.quantity) AS units
            FROM sales s
            JOIN stores st ON s.store_id = st.store_id
            WHERE s.product_id = :pid
            GROUP BY st.region
            ORDER BY rev DESC
        """
        reg_rows = db.execute(text(reg_sql), {"pid": product_id}).fetchall()
        regional_sales = [
            {"region": r.region, "revenue": float(r.rev), "units": int(r.units)}
            for r in reg_rows
        ]

        # Store breakdown with current stock in that store
        store_sql = """
            SELECT 
                st.store_id,
                st.store_name,
                st.city,
                st.region,
                COALESCE(SUM(s.net_revenue), 0) AS store_rev,
                COALESCE(SUM(s.quantity), 0) AS store_units,
                COALESCE(inv.current_stock, 0) AS stock_in_store
            FROM stores st
            LEFT JOIN sales s ON st.store_id = s.store_id AND s.product_id = :pid
            LEFT JOIN inventory inv ON st.store_id = inv.store_id AND inv.product_id = :pid
            GROUP BY st.store_id, st.store_name, st.city, st.region, inv.current_stock
            ORDER BY store_rev DESC
        """
        store_rows = db.execute(text(store_sql), {"pid": product_id}).fetchall()
        store_performance = [
            {
                "store_id": r.store_id,
                "store_name": r.store_name,
                "city": r.city,
                "region": r.region,
                "revenue": float(r.store_rev),
                "units": int(r.store_units),
                "stock": int(r.stock_in_store)
            }
            for r in store_rows
        ]

        return ProductDetailAnalytics(
            product_id=p_row.product_id,
            product_name=p_row.product_name,
            category=p_row.category,
            subcategory=p_row.subcategory,
            unit_price=float(p_row.unit_price),
            cost_price=float(p_row.cost_price),
            target_margin_pct=float(p_row.target_margin_pct),
            total_revenue=tot_rev,
            total_profit=tot_prof,
            realized_margin_pct=margin_pct,
            total_units_sold=units,
            total_orders=tot_orders,
            avg_discount_amount=avg_disc,
            return_rate_pct=return_rate_pct,
            current_total_stock=curr_inv,
            monthly_trend=monthly_trend,
            regional_sales=regional_sales,
            store_performance=store_performance
        )
