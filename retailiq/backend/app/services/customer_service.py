from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.schemas.analytics import CustomerSegmentMetric, CustomerDetail

class CustomerService:
    @staticmethod
    def get_rfm_analytics(db: Session) -> Dict[str, Any]:
        # Macro Customer KPIs from vw_customer_rfm
        macro_sql = """
            SELECT 
                COUNT(*) AS total_customers,
                COUNT(CASE WHEN frequency > 1 THEN 1 END) AS repeat_customers,
                ROUND(AVG(monetary_value)::numeric, 2) AS avg_clv,
                ROUND(AVG(frequency)::numeric, 1) AS avg_frequency,
                ROUND(AVG(avg_order_value)::numeric, 2) AS overall_aov
            FROM vw_customer_rfm
        """
        macro = db.execute(text(macro_sql)).fetchone()
        tot_cust = int(macro.total_customers)
        repeat_cust = int(macro.repeat_customers)
        new_cust = tot_cust - repeat_cust
        avg_clv = float(macro.avg_clv or 0)
        avg_freq = float(macro.avg_frequency or 0)
        overall_aov = float(macro.overall_aov or 0)
        repeat_rate_pct = round((repeat_cust / tot_cust * 100), 2) if tot_cust > 0 else 0.0

        # RFM Segment Breakdown from vw_customer_rfm
        rfm_sql = """
            SELECT 
                rfm_segment,
                COUNT(*) AS cust_cnt,
                ROUND(SUM(monetary_value)::numeric, 2) AS segment_revenue,
                ROUND(AVG(monetary_value)::numeric, 2) AS avg_clv,
                ROUND(AVG(frequency)::numeric, 1) AS avg_freq,
                ROUND(AVG(avg_order_value)::numeric, 2) AS avg_ticket,
                ROUND(AVG(recency_days)::numeric, 0) AS avg_recency
            FROM vw_customer_rfm
            GROUP BY rfm_segment
            ORDER BY segment_revenue DESC
        """
        rfm_rows = db.execute(text(rfm_sql)).fetchall()
        tot_rev = sum(float(r.segment_revenue) for r in rfm_rows)

        churn_risk_map = {
            "Champions": "Very Low",
            "Loyal Customers": "Low",
            "Potential Loyalists": "Medium",
            "At Risk": "High",
            "Lost Customers": "Critical"
        }

        segments = [
            CustomerSegmentMetric(
                segment=r.rfm_segment,
                customer_count=int(r.cust_cnt),
                pct_of_customers=round((int(r.cust_cnt) / tot_cust * 100), 1) if tot_cust > 0 else 0.0,
                total_revenue=float(r.segment_revenue),
                pct_of_revenue=round((float(r.segment_revenue) / tot_rev * 100), 1) if tot_rev > 0 else 0.0,
                avg_order_value=float(r.avg_ticket),
                avg_frequency=float(r.avg_freq),
                churn_risk=churn_risk_map.get(r.rfm_segment, "Medium")
            )
            for r in rfm_rows
        ]

        # Top 10 High Value VIP Customers
        top_sql = """
            SELECT 
                customer_id,
                customer_name,
                email,
                region,
                rfm_segment,
                signup_date,
                frequency,
                monetary_value,
                avg_order_value,
                last_order_date,
                recency_days
            FROM vw_customer_rfm
            ORDER BY monetary_value DESC
            LIMIT 10
        """
        top_rows = db.execute(text(top_sql)).fetchall()
        top_customers = [
            CustomerDetail(
                customer_id=r.customer_id,
                full_name=r.customer_name,
                email=r.email,
                region=r.region,
                segment=r.rfm_segment,
                signup_date=str(r.signup_date),
                total_orders=int(r.frequency),
                monetary_value=float(r.monetary_value),
                avg_order_value=float(r.avg_order_value),
                last_order_date=str(r.last_order_date) if r.last_order_date else "N/A",
                recency_days=int(r.recency_days) if r.recency_days is not None else 999
            )
            for r in top_rows
        ]

        return {
            "summary": {
                "total_customers": tot_cust,
                "new_customers": new_cust,
                "repeat_customers": repeat_cust,
                "repeat_rate_pct": repeat_rate_pct,
                "avg_clv": avg_clv,
                "avg_frequency": avg_freq,
                "overall_aov": overall_aov
            },
            "segments": segments,
            "top_customers": top_customers
        }

    @staticmethod
    def get_customer_profile(db: Session, customer_id: str) -> Optional[CustomerDetail]:
        sql = """
            SELECT 
                customer_id,
                customer_name,
                email,
                region,
                rfm_segment,
                signup_date,
                frequency,
                monetary_value,
                avg_order_value,
                last_order_date,
                recency_days
            FROM vw_customer_rfm
            WHERE customer_id = :cid
        """
        r = db.execute(text(sql), {"cid": customer_id}).fetchone()
        if not r:
            return None
        return CustomerDetail(
            customer_id=r.customer_id,
            full_name=r.customer_name,
            email=r.email,
            region=r.region,
            segment=r.rfm_segment,
            signup_date=str(r.signup_date),
            total_orders=int(r.frequency),
            monetary_value=float(r.monetary_value),
            avg_order_value=float(r.avg_order_value),
            last_order_date=str(r.last_order_date) if r.last_order_date else "N/A",
            recency_days=int(r.recency_days) if r.recency_days is not None else 999
        )
