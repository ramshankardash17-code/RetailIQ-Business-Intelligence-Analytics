"""
RetailIQ — High-Fidelity Retail Data Generator and Database Seeder
Target: PostgreSQL (Render or local)
Populates 'retailiq_db' with realistic multi-year transactional retail data.
"""

import os
import sys
import random
import argparse
import datetime
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from retailiq.backend.app.core.config import settings
from retailiq.database.scripts.init_db import init_database

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# Data paths
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw"))
os.makedirs(DATA_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# Metadata Definitions
# -----------------------------------------------------------------------------
REGIONS = {
    "North": [("New York", "NY"), ("Boston", "MA"), ("Philadelphia", "PA"), ("Chicago", "IL")],
    "West": [("Los Angeles", "CA"), ("San Francisco", "CA"), ("Seattle", "WA"), ("Denver", "CO")],
    "South": [("Houston", "TX"), ("Dallas", "TX"), ("Austin", "TX"), ("Atlanta", "GA"), ("Miami", "FL")],
    "East": [("Washington", "DC"), ("Charlotte", "NC"), ("Baltimore", "MD")],
    "Central": [("Phoenix", "AZ"), ("Indianapolis", "IN"), ("Columbus", "OH"), ("Detroit", "MI")]
}

STORE_TYPES = ["Flagship", "Shopping Mall", "High Street", "Outlet"]

CATEGORIES = {
    "Electronics": {
        "Audio": [("Noise Cancelling Headphones", 80.0, 199.99), ("Bluetooth Speaker", 35.0, 79.99), ("Soundbar 5.1", 120.0, 279.99), ("True Wireless Earbuds", 45.0, 119.99)],
        "Computers": [("Pro Laptop 15-inch", 650.0, 1299.99), ("Ultrabook Slim", 520.0, 999.99), ("Mechanical Keyboard", 40.0, 89.99), ("Ergonomic Wireless Mouse", 22.0, 49.99), ("27-inch 4K Monitor", 180.0, 349.99)],
        "Mobile": [("Flagship Smartphone 5G", 480.0, 899.99), ("Mid-range Smartphone", 210.0, 429.99), ("Fast Charging Pad", 12.0, 29.99), ("Rugged Phone Case", 6.0, 24.99)],
        "Wearables": [("Smart Fitness Watch", 90.0, 219.99), ("GPS Sports Watch", 140.0, 299.99), ("Fitness Tracker Band", 25.0, 59.99)]
    },
    "Apparel": {
        "Men's Clothing": [("Classic Oxford Shirt", 18.0, 49.99), ("Slim-Fit Denim Jeans", 24.0, 69.99), ("Wool Blend Overcoat", 75.0, 189.99), ("Cotton Chinos", 20.0, 54.99), ("Casual Crewneck Tee", 8.0, 24.99)],
        "Women's Clothing": [("Floral Summer Dress", 22.0, 64.99), ("High-Waist Denim", 26.0, 74.99), ("Cashmere Cardigan", 45.0, 129.99), ("Tailored Blazer", 40.0, 119.99), ("Silk Evening Blouse", 30.0, 84.99)],
        "Footwear": [("Pro Running Shoes", 45.0, 129.99), ("Leather Chelsea Boots", 55.0, 149.99), ("Casual Canvas Sneakers", 20.0, 59.99), ("Trail Hiking Shoes", 50.0, 139.99)],
        "Accessories": [("Polarized Sunglasses", 25.0, 79.99), ("Leather Bi-fold Wallet", 15.0, 45.00), ("Canvas Travel Backpack", 28.0, 69.99)]
    },
    "Home & Kitchen": {
        "Small Appliances": [("Digital Air Fryer XL", 45.0, 109.99), ("Espresso Coffee Maker", 110.0, 249.99), ("High-Speed Blender", 38.0, 89.99), ("Electric Kettle 1.7L", 16.0, 39.99), ("Smart Robotic Vacuum", 130.0, 299.99)],
        "Cookware": [("10-Piece Non-Stick Cookware Set", 70.0, 179.99), ("Cast Iron Dutch Oven", 35.0, 89.99), ("Stainless Steel Chef Knife", 18.0, 49.99)],
        "Home Decor": [("Ceramic Table Lamp", 22.0, 59.99), ("Egyptian Cotton Bedding Set", 40.0, 119.99), ("Memory Foam Pillow Set", 20.0, 54.99)]
    },
    "Health & Beauty": {
        "Skincare": [("Vitamin C Radiance Serum", 12.0, 38.00), ("Hyaluronic Acid Moisturizer", 14.0, 42.00), ("SPF 50 Daily Sunscreen", 9.0, 26.00), ("Anti-Aging Night Cream", 18.0, 54.00)],
        "Personal Care": [("Sonic Electric Toothbrush", 30.0, 79.99), ("Ionic Hair Dryer", 28.0, 74.99), ("Beard Grooming Kit", 15.0, 39.99)],
        "Fragrance": [("Luxury Eau De Parfum 100ml", 35.0, 110.00), ("Floral Citrus Cologne", 22.0, 65.00)]
    },
    "Sports & Outdoors": {
        "Fitness Equipment": [("Adjustable Dumbbell Set", 90.0, 229.99), ("Eco Yoga Mat with Strap", 12.0, 34.99), ("Resistance Bands Set", 8.0, 24.99), ("Speed Jump Rope", 5.0, 16.99)],
        "Outdoor Gear": [("4-Person Waterproof Camping Tent", 65.0, 169.99), ("Thermal Sleeping Bag", 28.0, 74.99), ("Insulated Stainless Steel Water Bottle", 9.0, 27.99), ("Trekking Poles Pair", 16.0, 44.99)]
    }
}

FIRST_NAMES = ["James", "Emma", "Michael", "Sophia", "David", "Olivia", "Daniel", "Isabella", "Alexander", "Mia",
               "William", "Charlotte", "Matthew", "Amelia", "Lucas", "Harper", "Benjamin", "Evelyn", "Elijah", "Abigail",
               "Henry", "Emily", "Sebastian", "Elizabeth", "Jack", "Avery", "Owen", "Ella", "Samuel", "Scarlett",
               "Liam", "Noah", "Oliver", "Ethan", "Aiden", "Jackson", "Logan", "Mason"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
              "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI/Digital Wallet", "Cash"]
RETURN_REASONS = ["Size Mismatch", "Defective/Damaged", "Dissatisfied with Quality", "Wrong Item Sent", "Changed Mind"]

def generate_dataset(is_demo: bool = False):
    mode_str = "Demo Dataset (~5,000 transactions)" if is_demo else "Full Multi-Year Enterprise Universe (257,000+ transactions)"
    print(f">>> Generating RetailIQ Synthetic Universe ({mode_str})...")
    
    # 1. Stores (20 Stores)
    stores = []
    store_counter = 101
    for region, cities in REGIONS.items():
        for city, state in cities:
            store_id = f"STR{store_counter}"
            store_name = f"RetailIQ {city} {random.choice(['Center', 'Plaza', 'Galleria', 'Square'])}"
            stype = random.choice(STORE_TYPES)
            sqft = random.choice([4500, 6000, 8500, 12000, 15000]) if stype == "Flagship" else random.choice([3000, 4500, 5500, 7000])
            open_date = datetime.date(random.randint(2018, 2022), random.randint(1, 12), random.randint(1, 28))
            manager = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            stores.append({
                "store_id": store_id,
                "store_name": store_name,
                "city": city,
                "state": state,
                "region": region,
                "store_type": stype,
                "square_feet": sqft,
                "opening_date": open_date,
                "manager_name": manager
            })
            store_counter += 1

    # 2. Products (61 SKUs)
    products = []
    prod_counter = 1001
    for cat, subcats in CATEGORIES.items():
        for subcat, items in subcats.items():
            for name, cost, price in items:
                prod_id = f"PRD{prod_counter}"
                margin = round(((price - cost) / price) * 100, 2)
                products.append({
                    "product_id": prod_id,
                    "product_name": name,
                    "category": cat,
                    "subcategory": subcat,
                    "cost_price": cost,
                    "unit_price": price,
                    "target_margin_pct": margin,
                    "reorder_point": random.choice([20, 25, 30, 40, 50]),
                    "safety_stock": random.choice([10, 15, 20, 25]),
                    "is_active": True
                })
                prod_counter += 1

    # 3. Promotions (7 Key Campaigns)
    promotions = [
        {"promo_id": "PRM101", "promo_name": "New Year Clearance 2023", "promo_type": "Seasonal Clearance", "discount_pct": 15.0, "start_date": datetime.date(2023, 1, 2), "end_date": datetime.date(2023, 1, 20)},
        {"promo_id": "PRM102", "promo_name": "Spring Fling 2023", "promo_type": "Promotional", "discount_pct": 10.0, "start_date": datetime.date(2023, 4, 10), "end_date": datetime.date(2023, 4, 25)},
        {"promo_id": "PRM103", "promo_name": "Summer Prime Fest 2023", "promo_type": "Volume Discount", "discount_pct": 20.0, "start_date": datetime.date(2023, 7, 5), "end_date": datetime.date(2023, 7, 18)},
        {"promo_id": "PRM104", "promo_name": "Black Friday Mega Sale 2023", "promo_type": "Flash Sale", "discount_pct": 25.0, "start_date": datetime.date(2023, 11, 20), "end_date": datetime.date(2023, 11, 30)},
        {"promo_id": "PRM105", "promo_name": "Holiday Blitz 2024", "promo_type": "Holiday Sale", "discount_pct": 20.0, "start_date": datetime.date(2024, 12, 12), "end_date": datetime.date(2024, 12, 28)},
        {"promo_id": "PRM106", "promo_name": "Mid-Year Bonanza 2025", "promo_type": "Promotional", "discount_pct": 15.0, "start_date": datetime.date(2025, 6, 1), "end_date": datetime.date(2025, 6, 20)},
        {"promo_id": "PRM107", "promo_name": "Cyber Week Finale 2025", "promo_type": "Flash Sale", "discount_pct": 25.0, "start_date": datetime.date(2025, 11, 24), "end_date": datetime.date(2025, 12, 5)},
    ]

    # 4. Customers
    cust_count = 500 if is_demo else 2500
    customers = []
    all_regions = list(REGIONS.keys())
    for i in range(1, cust_count + 1):
        cid = f"CUST{i:05d}"
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        domain = random.choice(["gmail.com", "yahoo.com", "outlook.com", "corporate.org"])
        email = f"{fn.lower()}.{ln.lower()}{random.randint(10, 99)}@{domain}"
        reg = random.choice(all_regions)
        city_pair = random.choice(REGIONS[reg])
        city, st = city_pair
        phone = f"+1-{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
        sdate = datetime.date(2022, 1, 1) + datetime.timedelta(days=random.randint(0, 1200))
        customers.append({
            "customer_id": cid,
            "first_name": fn,
            "last_name": ln,
            "email": email,
            "phone": phone,
            "city": city,
            "state": st,
            "region": reg,
            "customer_segment": "Potential Loyalists",
            "signup_date": sdate
        })

    # 5. Inventory (Store x Product pairs = 20 * 61 = 1220 rows)
    inventory = []
    inv_counter = 1
    for s in stores:
        for p in products:
            inv_id = f"INV{inv_counter:05d}"
            curr_stock = random.randint(5, 120)
            safety = p["safety_stock"]
            reorder = p["reorder_point"]
            last_restock = datetime.date(2025, random.randint(10, 12), random.randint(1, 28))
            inventory.append({
                "inventory_id": inv_id,
                "product_id": p["product_id"],
                "store_id": s["store_id"],
                "current_stock": curr_stock,
                "safety_stock": safety,
                "reorder_level": reorder,
                "last_restocked_date": last_restock
            })
            inv_counter += 1

    # 6. Sales & Returns
    sales = []
    returns = []
    order_id_counter = 100001
    return_id_counter = 50001
    
    start_date = datetime.date(2025, 7, 1) if is_demo else datetime.date(2023, 1, 1)
    end_date = datetime.date(2025, 12, 31)
    days_range = (end_date - start_date).days + 1

    prod_ids = [p["product_id"] for p in products]
    prod_dict = {p["product_id"]: p for p in products}
    cust_ids = [c["customer_id"] for c in customers]
    store_ids = [s["store_id"] for s in stores]

    cat_weights = {"Electronics": 0.35, "Apparel": 0.28, "Home & Kitchen": 0.18, "Health & Beauty": 0.12, "Sports & Outdoors": 0.07}
    prod_probs = []
    for p in products:
        base_w = cat_weights[p["category"]]
        prod_probs.append(base_w / 12.0)
    prod_probs = np.array(prod_probs)
    prod_probs /= prod_probs.sum()

    current_date = start_date
    for day_idx in range(days_range):
        is_q4 = current_date.month in [10, 11, 12]
        is_weekend = current_date.weekday() >= 5
        season_boost = 1.35 if is_q4 else (1.10 if is_weekend else 1.0)
        
        day_promo = None
        for p in promotions:
            if p["start_date"] <= current_date <= p["end_date"]:
                day_promo = p
                season_boost *= 1.4
                break
                
        base_orders = int(random.randint(8, 20) * season_boost) if is_demo else int(random.randint(160, 270) * season_boost)
        chosen_custs = np.random.choice(cust_ids, size=base_orders, replace=True)
        chosen_stores = np.random.choice(store_ids, size=base_orders, replace=True)
        
        for i in range(base_orders):
            order_id = f"ORD{order_id_counter}"
            order_id_counter += 1
            cid = chosen_custs[i]
            sid = chosen_stores[i]
            
            basket_size = 1 if random.random() < 0.70 else (2 if random.random() < 0.90 else 3)
            chosen_prods = np.random.choice(prod_ids, size=basket_size, replace=False, p=prod_probs)
            
            hr = random.randint(9, 21)
            mn = random.randint(0, 59)
            sec = random.randint(0, 59)
            order_ts = datetime.datetime.combine(current_date, datetime.time(hr, mn, sec))
            pay_method = random.choice(PAYMENT_METHODS)
            
            for pid in chosen_prods:
                p_info = prod_dict[pid]
                qty = 1 if random.random() < 0.85 else (2 if random.random() < 0.95 else random.randint(3, 4))
                unit_price = p_info["unit_price"]
                cost_price = p_info["cost_price"]
                
                promo_id = None
                discount_pct = 0.0
                if day_promo:
                    promo_id = day_promo["promo_id"]
                    discount_pct = day_promo["discount_pct"] / 100.0
                elif random.random() < 0.15:
                    discount_pct = random.choice([0.05, 0.10, 0.15])
                    
                gross_rev = round(unit_price * qty, 2)
                discount_amt = round(gross_rev * discount_pct, 2)
                net_rev = round(gross_rev - discount_amt, 2)
                total_cost = round(cost_price * qty, 2)
                profit = round(net_rev - total_cost, 2)
                
                cat = p_info["category"]
                ret_prob = 0.12 if cat == "Apparel" else (0.03 if cat == "Electronics" else 0.05)
                is_returned = random.random() < ret_prob
                
                sales.append({
                    "order_id": order_id,
                    "product_id": pid,
                    "order_date": current_date,
                    "order_timestamp": order_ts,
                    "customer_id": cid,
                    "store_id": sid,
                    "promo_id": promo_id,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "cost_price": cost_price,
                    "discount_amount": discount_amt,
                    "gross_revenue": gross_rev,
                    "net_revenue": net_rev,
                    "profit": profit,
                    "payment_method": pay_method,
                    "is_returned": is_returned
                })
                
                if is_returned:
                    ret_days = random.randint(2, 21)
                    ret_date = current_date + datetime.timedelta(days=ret_days)
                    returns.append({
                        "return_id": f"RET{return_id_counter}",
                        "order_id": order_id,
                        "product_id": pid,
                        "return_date": ret_date,
                        "return_reason": random.choice(RETURN_REASONS),
                        "refund_amount": net_rev
                    })
                    return_id_counter += 1
                    
        current_date += datetime.timedelta(days=1)
        
    df_stores = pd.DataFrame(stores)
    df_products = pd.DataFrame(products)
    df_promotions = pd.DataFrame(promotions)
    df_customers = pd.DataFrame(customers)
    df_inventory = pd.DataFrame(inventory)
    df_sales = pd.DataFrame(sales)
    df_returns = pd.DataFrame(returns)

    print(f"Total Sales rows generated: {len(df_sales):,}")
    print(f"Total Returns generated: {len(df_returns):,}")

    return df_stores, df_products, df_promotions, df_customers, df_inventory, df_sales, df_returns

def populate_postgres(df_stores, df_products, df_promotions, df_customers, df_inventory, df_sales, df_returns, db_url: str = None):
    url = db_url or settings.database_url
    print(f"\n>>> Connecting to PostgreSQL to seed data: {url.split('@')[-1] if '@' in url else url}...")
    engine = create_engine(url, echo=False)

    # Initialize schema first if not already initialized
    init_database(url)

    print("Populating PostgreSQL tables...")
    
    with engine.begin() as conn:
        print("  Inserting stores...")
        df_stores.to_sql("stores", conn, if_exists="append", index=False, method="multi", chunksize=1000)
        
        print("  Inserting customers...")
        df_customers.to_sql("customers", conn, if_exists="append", index=False, method="multi", chunksize=1000)
        
        print("  Inserting products...")
        df_products.to_sql("products", conn, if_exists="append", index=False, method="multi", chunksize=1000)
        
        print("  Inserting promotions...")
        df_promotions.to_sql("promotions", conn, if_exists="append", index=False, method="multi", chunksize=1000)
        
        print("  Inserting inventory...")
        df_inventory.to_sql("inventory", conn, if_exists="append", index=False, method="multi", chunksize=1000)

        # Sales and Returns batch insert
        print(f"  Inserting {len(df_sales):,} sales records in batches...")
        df_sales.to_sql("sales", conn, if_exists="append", index=False, method="multi", chunksize=2000)

        print(f"  Inserting {len(df_returns):,} return records...")
        df_returns.to_sql("returns", conn, if_exists="append", index=False, method="multi", chunksize=2000)

    # Re-apply views
    views_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "views", "02_views.sql"))
    with open(views_path, "r", encoding="utf-8") as f:
        views_sql = f.read()

    with engine.begin() as conn:
        for stmt in views_sql.split(";"):
            s = stmt.strip()
            if s:
                conn.execute(text(s))

    # Verify counts
    with engine.connect() as conn:
        sales_cnt = conn.execute(text("SELECT COUNT(*) FROM sales")).scalar() or 0
        cust_cnt = conn.execute(text("SELECT COUNT(*) FROM customers")).scalar() or 0
        prod_cnt = conn.execute(text("SELECT COUNT(*) FROM products")).scalar() or 0
        store_cnt = conn.execute(text("SELECT COUNT(*) FROM stores")).scalar() or 0
        inv_cnt = conn.execute(text("SELECT COUNT(*) FROM inventory")).scalar() or 0
        ret_cnt = conn.execute(text("SELECT COUNT(*) FROM returns")).scalar() or 0

    print("\n=======================================================")
    print(" PostgreSQL Database Seeding Completed Successfully!")
    print(f" Stores:     {store_cnt}")
    print(f" Products:   {prod_cnt}")
    print(f" Customers:  {cust_cnt}")
    print(f" Inventory:  {inv_cnt}")
    print(f" Sales:      {sales_cnt:,}")
    print(f" Returns:    {ret_cnt:,}")
    print("=======================================================\n")

def seed_database(is_demo: bool = True, db_url: str = None):
    stores, prods, promos, custs, inv, sales, rets = generate_dataset(is_demo=is_demo)
    populate_postgres(stores, prods, promos, custs, inv, sales, rets, db_url=db_url)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed RetailIQ PostgreSQL Database")
    parser.add_argument("--full", action="store_true", help="Generate full 257k+ records universe (takes longer)")
    parser.add_argument("--demo", action="store_true", help="Generate lightweight demo dataset (~5,000 records)")
    args = parser.parse_args()

    is_demo = not args.full # Default to demo for safe, fast cloud deployments
    seed_database(is_demo=is_demo)
