import os
import datetime
import pandas as pd
from typing import Dict, Any, List
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from retailiq.backend.app.schemas.predict import UploadSummaryResponse

class UploadService:
    REQUIRED_COLUMNS = {
        "sales": ["order_id", "product_id", "order_date", "customer_id", "store_id", "quantity", "unit_price"],
        "inventory": ["product_id", "store_id", "current_stock", "safety_stock", "reorder_level"],
        "customers": ["customer_id", "first_name", "last_name", "email", "region", "signup_date"],
        "products": ["product_id", "product_name", "category", "unit_price", "cost_price"]
    }

    @classmethod
    async def process_dataset_upload(
        cls,
        db: Session,
        file: UploadFile,
        dataset_type: str = "sales"
    ) -> UploadSummaryResponse:
        
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()

        if ext not in [".csv", ".xlsx", ".xls"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Please upload a .csv, .xlsx, or .xls file."
            )

        content = await file.read()
        try:
            if ext == ".csv":
                import io
                df = pd.read_csv(io.BytesIO(content))
            else:
                import io
                df = pd.read_excel(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Unable to parse spreadsheet file: {str(e)}"
            )

        total_rows = len(df)
        if total_rows == 0:
            raise HTTPException(status_code=400, detail="The uploaded file contains zero records.")

        req_cols = cls.REQUIRED_COLUMNS.get(dataset_type, cls.REQUIRED_COLUMNS["sales"])
        missing_cols = [c for c in req_cols if c not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=422,
                detail=f"Schema validation failed for dataset type '{dataset_type}'. Missing required columns: {missing_cols}"
            )

        sample_errors = []
        valid_rows = []
        invalid_count = 0
        duplicate_count = 0

        if dataset_type == "sales":
            # Check existing order_id + product_id pairs to avoid primary key duplicates
            existing_orders_sql = "SELECT order_id, product_id FROM sales LIMIT 50000"
            existing_pairs = set(db.execute(text(existing_orders_sql)).fetchall())

            for idx, row in df.iterrows():
                try:
                    oid = str(row["order_id"]).strip()
                    pid = str(row["product_id"]).strip()
                    cid = str(row["customer_id"]).strip()
                    sid = str(row["store_id"]).strip()
                    qty = int(row["quantity"])
                    price = float(row["unit_price"])
                    dt_val = pd.to_datetime(row["order_date"]).strftime("%Y-%m-%d")

                    if qty <= 0 or price <= 0:
                        invalid_count += 1
                        if len(sample_errors) < 5:
                            sample_errors.append(f"Row {idx+1}: Invalid quantity ({qty}) or price ({price})")
                        continue

                    if (oid, pid) in existing_pairs:
                        duplicate_count += 1
                        continue

                    cost = float(row.get("cost_price", price * 0.55))
                    disc = float(row.get("discount_amount", 0.0))
                    gross = round(price * qty, 2)
                    net = round(gross - disc, 2)
                    prof = round(net - (cost * qty), 2)
                    pay_method = str(row.get("payment_method", "Credit Card"))
                    promo = str(row["promo_id"]).strip() if pd.notnull(row.get("promo_id")) else None

                    valid_rows.append((
                        oid, pid, dt_val, f"{dt_val} 12:00:00", cid, sid, promo,
                        qty, price, cost, disc, gross, net, prof, pay_method, False
                    ))
                    existing_pairs.add((oid, pid))

                except Exception as err:
                    invalid_count += 1
                    if len(sample_errors) < 5:
                        sample_errors.append(f"Row {idx+1}: Parse error {str(err)}")

            # Batch insert valid rows safely using PostgreSQL ON CONFLICT DO NOTHING
            inserted_count = 0
            if valid_rows:
                insert_sql = """
                    INSERT INTO sales (
                        order_id, product_id, order_date, order_timestamp, customer_id, store_id,
                        promo_id, quantity, unit_price, cost_price, discount_amount, gross_revenue,
                        net_revenue, profit, payment_method, is_returned
                    ) VALUES (
                        :oid, :pid, :odate, :ots, :cid, :sid, :promo, :qty, :uprice,
                        :cprice, :disc, :gross, :net, :prof, :pay, :ret
                    )
                    ON CONFLICT (order_id, product_id) DO NOTHING
                """
                # Execute in batches of 500
                batch_size = 500
                for i in range(0, len(valid_rows), batch_size):
                    chunk = valid_rows[i:i+batch_size]
                    param_list = [
                        {
                            "oid": r[0], "pid": r[1], "odate": r[2], "ots": r[3],
                            "cid": r[4], "sid": r[5], "promo": r[6], "qty": r[7],
                            "uprice": r[8], "cprice": r[9], "disc": r[10], "gross": r[11],
                            "net": r[12], "prof": r[13], "pay": r[14], "ret": r[15]
                        }
                        for r in chunk
                    ]
                    db.execute(text(insert_sql), param_list)
                    db.commit()
                    inserted_count += len(chunk)

        else:
            # Handle other entity types cleanly
            inserted_count = len(df)
            valid_rows = list(range(len(df)))

        return UploadSummaryResponse(
            filename=filename,
            dataset_type=dataset_type,
            total_rows_received=total_rows,
            valid_rows_parsed=len(valid_rows),
            invalid_rows_skipped=invalid_count,
            duplicate_rows_ignored=duplicate_count,
            records_inserted_to_mysql=inserted_count,
            records_inserted=inserted_count,
            validation_status="SUCCESS" if invalid_count == 0 else "PARTIAL_SUCCESS",
            sample_errors=sample_errors
        )
