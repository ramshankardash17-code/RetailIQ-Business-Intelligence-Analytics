"""
RetailIQ — Machine Learning Pipeline & Model Training Suite
Trains and evaluates:
1. Product Demand Forecasting (Random Forest vs Gradient Boosting vs XGBoost)
2. Stockout Risk Classification (Random Forest vs XGBoost)
3. Customer Repeat Purchase Prediction (Logistic Regression vs Random Forest vs XGBoost)
"""

import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
import xgboost as xgb
import warnings
warnings.filterwarnings("ignore")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw"))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "saved_models"))
os.makedirs(MODELS_DIR, exist_ok=True)

def train_demand_forecast_model(df_sales, df_products):
    print("\n" + "="*70)
    print(">>> [ML Pipeline 1] Training Product Demand Forecasting Model...")
    print("="*70)

    # Aggregate daily product sales across stores
    df_sales["order_date"] = pd.to_datetime(df_sales["order_date"])
    daily_prod = df_sales.groupby(["order_date", "product_id", "store_id"]).agg(
        daily_units=("quantity", "sum"),
        avg_unit_price=("unit_price", "mean"),
        avg_discount=("discount_amount", "mean"),
        had_promo=("promo_id", lambda x: 1 if x.notnull().any() else 0)
    ).reset_index()

    # Join product category
    prod_meta = df_products[["product_id", "category", "subcategory", "cost_price"]].copy()
    daily_prod = daily_prod.merge(prod_meta, on="product_id", how="left")

    # Sort for time-series feature engineering
    daily_prod = daily_prod.sort_values(["product_id", "store_id", "order_date"]).reset_index(drop=True)

    # Feature Engineering: Time, Calendar, Lags, Rolling Averages
    daily_prod["dayofweek"] = daily_prod["order_date"].dt.dayofweek
    daily_prod["month"] = daily_prod["order_date"].dt.month
    daily_prod["quarter"] = daily_prod["order_date"].dt.quarter
    daily_prod["is_weekend"] = (daily_prod["dayofweek"] >= 5).astype(int)
    daily_prod["is_q4"] = (daily_prod["month"].isin([11, 12])).astype(int)

    # Grouped lag features
    print("Computing lag features and rolling window statistics...")
    g = daily_prod.groupby(["product_id", "store_id"])["daily_units"]
    daily_prod["lag_1"] = g.shift(1)
    daily_prod["lag_7"] = g.shift(7)
    daily_prod["lag_14"] = g.shift(14)
    daily_prod["rolling_mean_7"] = g.shift(1).rolling(7, min_periods=1).mean()
    daily_prod["rolling_mean_30"] = g.shift(1).rolling(30, min_periods=1).mean()
    daily_prod["rolling_std_7"] = g.shift(1).rolling(7, min_periods=1).std().fillna(0)

    # Price ratio
    daily_prod["price_to_cost_ratio"] = daily_prod["avg_unit_price"] / np.maximum(daily_prod["cost_price"], 1.0)

    # Drop NaNs from shift
    df_clean = daily_prod.dropna(subset=["lag_14"]).copy()

    # Categorical encoding
    cat_cols = ["category", "subcategory"]
    for c in cat_cols:
        df_clean[c] = df_clean[c].astype("category").cat.codes

    features = [
        "dayofweek", "month", "quarter", "is_weekend", "is_q4",
        "avg_unit_price", "avg_discount", "had_promo", "category", "subcategory",
        "price_to_cost_ratio", "lag_1", "lag_7", "lag_14",
        "rolling_mean_7", "rolling_mean_30", "rolling_std_7"
    ]
    target = "daily_units"

    X = df_clean[features]
    y = df_clean[target]

    # Time-based split: Train on 2023-2024, Test on 2025
    train_mask = df_clean["order_date"] < "2025-07-01"
    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[~train_mask], y[~train_mask]

    print(f"Dataset Size: {len(df_clean):,} | Train set: {len(X_train):,} | Test set: {len(X_test):,}")

    models = {
        "Baseline Linear Regression": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, max_depth=6, random_state=42),
        "XGBoost Regressor": xgb.XGBRegressor(n_estimators=120, max_depth=6, learning_rate=0.08, random_state=42, n_jobs=-1)
    }

    best_model_name = None
    best_rmse = float("inf")
    best_model = None
    results = {}

    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        preds = np.maximum(preds, 0) # non-negative demand

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        # Avoid division by zero for MAPE
        mape = np.mean(np.abs((y_test - preds) / np.maximum(y_test, 1))) * 100

        results[name] = {"MAE": round(mae, 4), "RMSE": round(rmse, 4), "R2": round(r2, 4), "MAPE": f"{mape:.2f}%"}
        print(f"  --> {name} | MAE: {mae:.3f} | RMSE: {rmse:.3f} | R²: {r2:.3f} | MAPE: {mape:.2f}%")

        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name
            best_model = model

    print(f"\n[WINNER] Selected Best Demand Forecasting Model: {best_model_name} (RMSE: {best_rmse:.4f})")

    # Feature Importance for best tree model
    if hasattr(best_model, "feature_importances_"):
        fi = dict(zip(features, [round(float(x), 4) for x in best_model.feature_importances_]))
        sorted_fi = dict(sorted(fi.items(), key=lambda item: item[1], reverse=True))
    else:
        sorted_fi = {}

    # Save artifact
    artifact = {
        "model": best_model,
        "model_name": best_model_name,
        "features": features,
        "results": results,
        "feature_importances": sorted_fi,
        "baseline_rmse": results["Baseline Linear Regression"]["RMSE"],
        "best_rmse": results[best_model_name]["RMSE"],
        "best_mae": results[best_model_name]["MAE"],
        "best_r2": results[best_model_name]["R2"]
    }

    out_file = os.path.join(MODELS_DIR, "demand_forecast_model.pkl")
    with open(out_file, "wb") as f:
        pickle.dump(artifact, f)
    print(f"Saved Demand Forecast model to: {out_file}")

    return artifact

def train_stockout_risk_model(df_sales, df_inventory, df_products):
    print("\n" + "="*70)
    print(">>> [ML Pipeline 2] Training Stockout Risk Classification Model...")
    print("="*70)

    # Compute daily sales velocity (last 30 days and last 90 days)
    df_sales["order_date"] = pd.to_datetime(df_sales["order_date"])
    recent_30 = df_sales[df_sales["order_date"] >= "2025-12-01"]
    recent_90 = df_sales[df_sales["order_date"] >= "2025-10-01"]

    velocity_30 = recent_30.groupby(["product_id", "store_id"])["quantity"].sum() / 31.0
    velocity_90 = recent_90.groupby(["product_id", "store_id"])["quantity"].sum() / 92.0

    df_inv = df_inventory.copy()
    df_inv = df_inv.merge(df_products[["product_id", "category", "target_margin_pct", "unit_price"]], on="product_id", how="left")

    df_inv["velocity_30d"] = df_inv.set_index(["product_id", "store_id"]).index.map(velocity_30).fillna(0.3)
    df_inv["velocity_90d"] = df_inv.set_index(["product_id", "store_id"]).index.map(velocity_90).fillna(0.3)

    # Days of inventory
    df_inv["days_of_inventory"] = df_inv["current_stock"] / np.maximum(df_inv["velocity_30d"], 0.1)
    df_inv["stock_to_safety_ratio"] = df_inv["current_stock"] / np.maximum(df_inv["safety_stock"], 1.0)
    df_inv["stock_to_reorder_ratio"] = df_inv["current_stock"] / np.maximum(df_inv["reorder_level"], 1.0)
    df_inv["velocity_trend"] = df_inv["velocity_30d"] / np.maximum(df_inv["velocity_90d"], 0.1)

    # Define Ground Truth Risk Categories based on rigorous supply chain business rules:
    # HIGH: days_of_inventory <= 7 OR current_stock <= safety_stock
    # MEDIUM: days_of_inventory between 8 and 20 OR current_stock <= reorder_level
    # LOW: healthy stock > 20 days
    conditions = [
        (df_inv["days_of_inventory"] <= 7.0) | (df_inv["current_stock"] <= df_inv["safety_stock"]),
        (df_inv["days_of_inventory"] <= 20.0) | (df_inv["current_stock"] <= df_inv["reorder_level"])
    ]
    choices = ["HIGH", "MEDIUM"]
    df_inv["risk_level"] = np.select(conditions, choices, default="LOW")

    print(f"Risk Class Distribution:\n{df_inv['risk_level'].value_counts()}")

    # Encode features
    df_inv["category_code"] = df_inv["category"].astype("category").cat.codes
    risk_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    inv_risk_map = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
    df_inv["risk_label"] = df_inv["risk_level"].map(risk_map)

    features = [
        "current_stock", "safety_stock", "reorder_level", "velocity_30d",
        "velocity_90d", "days_of_inventory", "stock_to_safety_ratio",
        "stock_to_reorder_ratio", "velocity_trend", "target_margin_pct", "unit_price", "category_code"
    ]

    X = df_inv[features]
    y = df_inv["risk_label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    models = {
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
        "XGBoost Classifier": xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    }

    best_model_name = None
    best_f1 = 0
    best_model = None
    results = {}

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average="weighted")
        prec = precision_score(y_test, preds, average="weighted")
        rec = recall_score(y_test, preds, average="weighted")
        results[name] = {"Accuracy": round(acc, 4), "F1": round(f1, 4), "Precision": round(prec, 4), "Recall": round(rec, 4)}
        print(f"  --> {name} | Accuracy: {acc*100:.2f}% | F1: {f1:.3f} | Precision: {prec:.3f} | Recall: {rec:.3f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model

    print(f"\n[WINNER] Selected Best Stockout Risk Model: {best_model_name} (F1: {best_f1:.4f})")

    # Feature Importance
    fi = dict(zip(features, [round(float(x), 4) for x in best_model.feature_importances_]))
    sorted_fi = dict(sorted(fi.items(), key=lambda item: item[1], reverse=True))

    artifact = {
        "model": best_model,
        "model_name": best_model_name,
        "features": features,
        "risk_map": risk_map,
        "inv_risk_map": inv_risk_map,
        "results": results,
        "feature_importances": sorted_fi
    }

    out_file = os.path.join(MODELS_DIR, "stockout_risk_model.pkl")
    with open(out_file, "wb") as f:
        pickle.dump(artifact, f)
    print(f"Saved Stockout Risk model to: {out_file}")

    return artifact

def train_repeat_purchase_model(df_sales, df_customers):
    print("\n" + "="*70)
    print(">>> [ML Pipeline 3] Training Customer Repeat Purchase Predictor...")
    print("="*70)

    df_sales["order_date"] = pd.to_datetime(df_sales["order_date"])
    max_date = df_sales["order_date"].max()

    # Observation split: Train features from transactions prior to 2025-10-01, target = purchased in Q4 2025 (next 90 days)
    cutoff_date = pd.to_datetime("2025-10-01")
    df_obs = df_sales[df_sales["order_date"] < cutoff_date]
    df_target = df_sales[df_sales["order_date"] >= cutoff_date]

    # Target: Did customer purchase between 2025-10-01 and 2025-12-31?
    repeat_purchasers = set(df_target["customer_id"].unique())

    # Build RFM and behavioral features up to cutoff date
    cust_rfm = df_obs.groupby("customer_id").agg(
        recency_days=("order_date", lambda x: (cutoff_date - x.max()).days),
        total_orders=("order_id", "nunique"),
        total_units=("quantity", "sum"),
        monetary_value=("net_revenue", "sum"),
        avg_order_value=("net_revenue", "mean"),
        total_discount=("discount_amount", "sum"),
        return_count=("is_returned", "sum")
    ).reset_index()

    # Discount affinity
    cust_rfm["discount_affinity"] = cust_rfm["total_discount"] / np.maximum(cust_rfm["monetary_value"], 1.0)
    cust_rfm["return_rate"] = cust_rfm["return_count"] / np.maximum(cust_rfm["total_orders"], 1.0)

    # Customer tenure (days from signup to cutoff date)
    df_customers["signup_date"] = pd.to_datetime(df_customers["signup_date"])
    cust_rfm = cust_rfm.merge(df_customers[["customer_id", "signup_date", "region", "customer_segment"]], on="customer_id", how="left")
    cust_rfm["tenure_days"] = (cutoff_date - cust_rfm["signup_date"]).dt.days

    # Target variable: 1 if customer placed an order in Q4 2025, else 0
    cust_rfm["will_repeat_90d"] = cust_rfm["customer_id"].apply(lambda cid: 1 if cid in repeat_purchasers else 0)

    print(f"Repeat Purchase Target Balance:\n{cust_rfm['will_repeat_90d'].value_counts(normalize=True)}")

    # Encode categories
    cust_rfm["region_code"] = cust_rfm["region"].astype("category").cat.codes
    cust_rfm["segment_code"] = cust_rfm["customer_segment"].astype("category").cat.codes

    features = [
        "recency_days", "total_orders", "total_units", "monetary_value",
        "avg_order_value", "discount_affinity", "return_rate",
        "tenure_days", "region_code", "segment_code"
    ]

    X = cust_rfm[features]
    y = cust_rfm["will_repeat_90d"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    models = {
        "Logistic Regression (Balanced)": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=42),
        "XGBoost Classifier": xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, scale_pos_weight=1.5, random_state=42)
    }

    best_model_name = None
    best_roc_auc = 0
    best_model = None
    results = {}

    for name, model in models.items():
        model.fit(X_train, y_train)
        probs = model.predict_proba(X_test)[:, 1]
        preds = model.predict(X_test)

        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds)
        rec = recall_score(y_test, preds)
        f1 = f1_score(y_test, preds)
        auc = roc_auc_score(y_test, probs)

        results[name] = {"Accuracy": round(acc, 4), "Precision": round(prec, 4), "Recall": round(rec, 4), "F1": round(f1, 4), "ROC-AUC": round(auc, 4)}
        print(f"  --> {name} | ROC-AUC: {auc:.4f} | F1: {f1:.3f} | Recall: {rec:.3f} | Precision: {prec:.3f}")

        if auc > best_roc_auc:
            best_roc_auc = auc
            best_model_name = name
            best_model = model

    print(f"\n[WINNER] Selected Best Repeat Purchase Model: {best_model_name} (ROC-AUC: {best_roc_auc:.4f})")

    # Feature Importance
    if hasattr(best_model, "feature_importances_"):
        fi = dict(zip(features, [round(float(x), 4) for x in best_model.feature_importances_]))
        sorted_fi = dict(sorted(fi.items(), key=lambda item: item[1], reverse=True))
    else:
        sorted_fi = {}

    artifact = {
        "model": best_model,
        "model_name": best_model_name,
        "features": features,
        "results": results,
        "feature_importances": sorted_fi,
        "best_roc_auc": results[best_model_name]["ROC-AUC"],
        "best_f1": results[best_model_name]["F1"]
    }

    out_file = os.path.join(MODELS_DIR, "repeat_purchase_model.pkl")
    with open(out_file, "wb") as f:
        pickle.dump(artifact, f)
    print(f"Saved Repeat Purchase model to: {out_file}")

    return artifact

if __name__ == "__main__":
    print("Loading data for training...")
    df_sales = pd.read_csv(os.path.join(DATA_DIR, "sales.csv"))
    df_products = pd.read_csv(os.path.join(DATA_DIR, "products.csv"))
    df_customers = pd.read_csv(os.path.join(DATA_DIR, "customers.csv"))
    df_inventory = pd.read_csv(os.path.join(DATA_DIR, "inventory.csv"))

    train_demand_forecast_model(df_sales, df_products)
    train_stockout_risk_model(df_sales, df_inventory, df_products)
    train_repeat_purchase_model(df_sales, df_customers)
    print("\n>>> ALL 3 MACHINE LEARNING PIPELINES TRAINED & SAVED SUCCESSFULLY!")
