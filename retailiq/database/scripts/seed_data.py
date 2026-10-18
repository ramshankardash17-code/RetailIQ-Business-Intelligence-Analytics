"""
RetailIQ — High-Fidelity Retail Data Generator and Database Seeder
Populates MySQL 'retailiq_db' with realistic multi-year transactional retail data.
"""

import os
import random
import datetime
import numpy as np
import pandas as pd
import pymysql
from dotenv import load_dotenv

# Load environment configuration
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "retailiq_db")

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
               "Liam", "Noah", "Oliver", "Ethan", "Aiden", "Jackson", "Logan", "Mason", "Lucas", "Oliver"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
              "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI/Digital Wallet", "Cash"]
RETURN_REASONS = ["Size Mismatch", "Defective/Damaged", "Dissatisfied with Quality", "Wrong Item Sent", "Changed Mind"]

def generate_dataset():
    print(">>> Generating RetailIQ Synthetic Universe...")
    
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
    df_stores = pd.DataFrame(stores)
    print(f"Generated {len(df_stores)} Stores.")

    # 2. Products (Catalog)
    products = []
    prod_counter = 1001
    for cat, subcats in CATEGORIES.items():
        for subcat, items in subcats.items():
            for item_name, cost, price in items:
                prod_id = f"PRD{prod_counter}"
                margin_target = round(((price - cost) / price) * 100, 2)
                reorder = random.randint(20, 45)
                safety = int(reorder * 0.45)
                products.append({
                    "product_id": prod_id,
                    "product_name": item_name,
                    "category": cat,
                    "subcategory": subcat,
                    "cost_price": cost,
                    "unit_price": price,
                    "target_margin_pct": margin_target,
                    "reorder_point": reorder,
                    "safety_stock": safety,
                    "is_active": 1
                })
                prod_counter += 1
    df_products = pd.DataFrame(products)
    print(f"Generated {len(df_products)} Products.")

    # 3. Promotions
    promotions = [
        {"promo_id": "PRM001", "promo_name": "New Year Clearance 2023", "promo_type": "Clearance", "discount_pct": 20.0, "start_date": "2023-01-01", "end_date": "2023-01-15"},
        {"promo_id": "PRM002", "promo_name": "Spring Style Refresh 2023", "promo_type": "Holiday Sale", "discount_pct": 15.0, "start_date": "2023-03-20", "end_date": "2023-04-05"},
        {"promo_id": "PRM003", "promo_name": "Summer Outdoor Blast 2023", "promo_type": "Seasonal", "discount_pct": 12.0, "start_date": "2023-06-15", "end_date": "2023-07-10"},
        {"promo_id": "PRM004", "promo_name": "Back to Campus 2023", "promo_type": "Flash Sale", "discount_pct": 18.0, "start_date": "2023-08-15", "end_date": "2023-09-05"},
        {"promo_id": "PRM005", "promo_name": "Black Friday & Cyber Week 2023", "promo_type": "Holiday Sale", "discount_pct": 25.0, "start_date": "2023-11-20", "end_date": "2023-11-30"},
        {"promo_id": "PRM006", "promo_name": "Holiday Season Finale 2023", "promo_type": "Holiday Sale", "discount_pct": 20.0, "start_date": "2023-12-15", "end_date": "2023-12-31"},
        {"promo_id": "PRM007", "promo_name": "New Year Clearance 2024", "promo_type": "Clearance", "discount_pct": 20.0, "start_date": "2024-01-01", "end_date": "2024-01-15"},
        {"promo_id": "PRM008", "promo_name": "Memorial Weekend 2024", "promo_type": "Flash Sale", "discount_pct": 15.0, "start_date": "2024-05-24", "end_date": "2024-05-29"},
        {"promo_id": "PRM009", "promo_name": "Mid-Year Tech Fest 2024", "promo_type": "Seasonal", "discount_pct": 18.0, "start_date": "2024-07-10", "end_date": "2024-07-22"},
        {"promo_id": "PRM010", "promo_name": "Black Friday Mega Deal 2024", "promo_type": "Holiday Sale", "discount_pct": 30.0, "start_date": "2024-11-22", "end_date": "2024-12-02"},
        {"promo_id": "PRM011", "promo_name": "Christmas Savings 2024", "promo_type": "Holiday Sale", "discount_pct": 22.0, "start_date": "2024-12-16", "end_date": "2024-12-31"},
        {"promo_id": "PRM012", "promo_name": "Spring Blossom 2025", "promo_type": "Seasonal", "discount_pct": 15.0, "start_date": "2025-03-15", "end_date": "2025-04-01"},
        {"promo_id": "PRM013", "promo_name": "Summer Clearance 2025", "promo_type": "Clearance", "discount_pct": 20.0, "start_date": "2025-07-01", "end_date": "2025-07-15"},
        {"promo_id": "PRM014", "promo_name": "Black Friday Extravaganza 2025", "promo_type": "Holiday Sale", "discount_pct": 30.0, "start_date": "2025-11-21", "end_date": "2025-12-01"},
        {"promo_id": "PRM015", "promo_name": "End of Year Gala 2025", "promo_type": "Holiday Sale", "discount_pct": 25.0, "start_date": "2025-12-18", "end_date": "2025-12-31"}
    ]
    df_promotions = pd.DataFrame(promotions)

    # 4. Customers (2,500 Customers)
    customers = []
    segments_pool = ["Champions", "Loyal Customers", "Potential Loyalists", "At Risk", "Lost Customers"]
    segment_weights = [0.15, 0.25, 0.30, 0.18, 0.12]
    
    for i in range(1, 2501):
        cid = f"CUST{i:05d}"
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        reg = random.choice(list(REGIONS.keys()))
        c_city, c_state = random.choice(REGIONS[reg])
        seg = np.random.choice(segments_pool, p=segment_weights)
        s_date = datetime.date(2022, 1, 1) + datetime.timedelta(days=random.randint(0, 1000))
        customers.append({
            "customer_id": cid,
            "first_name": fn,
            "last_name": ln,
            "email": f"{fn.lower()}.{ln.lower()}{i}@retailmail.com",
            "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "city": c_city,
            "state": c_state,
            "region": reg,
            "customer_segment": seg,
            "signup_date": s_date
        })
    df_customers = pd.DataFrame(customers)
    print(f"Generated {len(df_customers)} Customers.")

    # 5. Inventory Levels (Products x Stores = 57 x 20 = 1,140 rows)
    inventory = []
    inv_id = 1
    # We will identify ~5-8 products that have critical low inventory vs high sales
    for s_idx, st in df_stores.iterrows():
        for p_idx, pr in df_products.iterrows():
            # Standard stock: 40 to 180
            # Low stock products: product_id in PRD1001, PRD1005, PRD1012, PRD1025
            is_critical = pr["product_id"] in ["PRD1001", "PRD1005", "PRD1012", "PRD1025"] and random.random() < 0.65
            if is_critical:
                stock = random.randint(2, 12)  # High stockout risk
            elif random.random() < 0.15:
                stock = random.randint(15, 28) # Medium risk
            else:
                stock = random.randint(45, 180) # Healthy
                
            last_restock = datetime.date(2025, 12, random.randint(1, 28))
            inventory.append({
                "inventory_id": f"INV{inv_id:06d}",
                "product_id": pr["product_id"],
                "store_id": st["store_id"],
                "current_stock": stock,
                "safety_stock": pr["safety_stock"],
                "reorder_level": pr["reorder_point"],
                "last_restocked_date": last_restock
            })
            inv_id += 1
    df_inventory = pd.DataFrame(inventory)
    print(f"Generated {len(df_inventory)} Inventory Records.")

    # 6. Sales Transactions (Multi-Year: 2023-01-01 to 2025-12-31)
    # Target: ~150,000 transaction lines
    start_date = datetime.date(2023, 1, 1)
    end_date = datetime.date(2025, 12, 31)
    total_days = (end_date - start_date).days + 1
    
    # Pareto weights for products: top products get chosen more often
    num_prods = len(df_products)
    prod_probs = np.exp(-np.linspace(0, 3.5, num_prods))
    prod_probs /= prod_probs.sum()
    
    # Store weights: Flagships get more traffic
    store_weights = [1.8 if s["store_type"] == "Flagship" else (1.2 if s["store_type"] == "Shopping Mall" else 0.8) for _, s in df_stores.iterrows()]
    store_weights = np.array(store_weights) / sum(store_weights)
    
    # Customer repeat probabilities: Champions get more transactions
    cust_weights = []
    for _, c in df_customers.iterrows():
        if c["customer_segment"] == "Champions":
            cust_weights.append(5.0)
        elif c["customer_segment"] == "Loyal Customers":
            cust_weights.append(3.0)
        elif c["customer_segment"] == "Potential Loyalists":
            cust_weights.append(1.8)
        elif c["customer_segment"] == "At Risk":
            cust_weights.append(0.8)
        else:
            cust_weights.append(0.3)
    cust_weights = np.array(cust_weights) / sum(cust_weights)

    sales = []
    returns = []
    
    order_id_counter = 100000
    return_id_counter = 10000
    
    print("Simulating daily retail transactions across 2023-2025...")
    
    # Map promotions by date
    promo_records = df_promotions.to_dict("records")
    for p in promo_records:
        p["start"] = datetime.datetime.strptime(p["start_date"], "%Y-%m-%d").date()
        p["end"] = datetime.datetime.strptime(p["end_date"], "%Y-%m-%d").date()

    # Pre-extract product dicts for fast lookup
    prod_dict = {p["product_id"]: p for p in df_products.to_dict("records")}
    store_ids = df_stores["store_id"].values
    prod_ids = df_products["product_id"].values
    cust_ids = df_customers["customer_id"].values

    current_date = start_date
    while current_date <= end_date:
        # Seasonality factors:
        month = current_date.month
        is_weekend = current_date.weekday() >= 5
        
        # Base daily orders across all stores ~ 100 to 140
        # Holiday bump in Nov-Dec: 2.2x
        # Summer bump in June-July: 1.25x
        season_multiplier = 1.0
        if month in [11, 12]:
            season_multiplier = 2.3
        elif month in [6, 7]:
            season_multiplier = 1.25
        elif month in [1, 2]:
            season_multiplier = 0.85
            
        weekend_multiplier = 1.35 if is_weekend else 1.0
        
        # Growth factor year over year: 2023=1.0, 2024=1.12, 2025=1.28
        y_mult = 1.0 if current_date.year == 2023 else (1.12 if current_date.year == 2024 else 1.28)
        
        daily_order_count = int(115 * season_multiplier * weekend_multiplier * y_mult + random.randint(-10, 10))
        
        # Active promo for the day
        active_promos = [pr for pr in promo_records if pr["start"] <= current_date <= pr["end"]]
        day_promo = active_promos[0] if active_promos else None
        
        # Sample customers, stores
        chosen_custs = np.random.choice(cust_ids, size=daily_order_count, p=cust_weights)
        chosen_stores = np.random.choice(store_ids, size=daily_order_count, p=store_weights)
        
        for i in range(daily_order_count):
            order_id = f"ORD{order_id_counter}"
            order_id_counter += 1
            cid = chosen_custs[i]
            sid = chosen_stores[i]
            
            # Basket size: 1 to 3 items per order
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
                
                # Discount calculation
                promo_id = None
                discount_pct = 0.0
                if day_promo:
                    promo_id = day_promo["promo_id"]
                    discount_pct = day_promo["discount_pct"] / 100.0
                elif random.random() < 0.15:
                    # Random clearance or loyalty member coupon
                    discount_pct = random.choice([0.05, 0.10, 0.15])
                    
                gross_rev = round(unit_price * qty, 2)
                discount_amt = round(gross_rev * discount_pct, 2)
                net_rev = round(gross_rev - discount_amt, 2)
                total_cost = round(cost_price * qty, 2)
                profit = round(net_rev - total_cost, 2)
                
                # Return probability: higher for Apparel (12%), lower for Electronics (3%), Home (5%)
                cat = p_info["category"]
                ret_prob = 0.12 if cat == "Apparel" else (0.03 if cat == "Electronics" else 0.05)
                is_returned = 1 if random.random() < ret_prob else 0
                
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
        
    df_sales = pd.DataFrame(sales)
    df_returns = pd.DataFrame(returns)
    print(f"Total Sales rows generated: {len(df_sales):,}")
    print(f"Total Returns generated: {len(df_returns):,}")

    # Export clean CSVs to data/raw/
    print("Writing CSV files to data directory...")
    df_stores.to_csv(os.path.join(DATA_DIR, "stores.csv"), index=False)
    df_products.to_csv(os.path.join(DATA_DIR, "products.csv"), index=False)
    df_promotions.to_csv(os.path.join(DATA_DIR, "promotions.csv"), index=False)
    df_customers.to_csv(os.path.join(DATA_DIR, "customers.csv"), index=False)
    df_inventory.to_csv(os.path.join(DATA_DIR, "inventory.csv"), index=False)
    df_sales.to_csv(os.path.join(DATA_DIR, "sales.csv"), index=False)
    df_returns.to_csv(os.path.join(DATA_DIR, "returns.csv"), index=False)
    print("CSV files successfully written.")

    return df_stores, df_products, df_promotions, df_customers, df_inventory, df_sales, df_returns

def populate_mysql(df_stores, df_products, df_promotions, df_customers, df_inventory, df_sales, df_returns):
    print("\n>>> Connecting to MySQL to execute DDL and populate data...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        autocommit=False,
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    # Read schema SQL
    schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "01_schema.sql"))
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        
    print("Executing 01_schema.sql...")
    for stmt in schema_sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)
    conn.commit()
    print("Tables created successfully.")
    
    # Insert Stores
    print("Inserting stores...")
    sql_stores = """
        INSERT INTO stores (store_id, store_name, city, state, region, store_type, square_feet, opening_date, manager_name)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(sql_stores, df_stores.values.tolist())
    conn.commit()
    
    # Insert Customers
    print("Inserting customers...")
    sql_cust = """
        INSERT INTO customers (customer_id, first_name, last_name, email, phone, city, state, region, customer_segment, signup_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(sql_cust, df_customers.values.tolist())
    conn.commit()

    # Insert Products
    print("Inserting products...")
    sql_prod = """
        INSERT INTO products (product_id, product_name, category, subcategory, cost_price, unit_price, target_margin_pct, reorder_point, safety_stock, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(sql_prod, df_products.values.tolist())
    conn.commit()

    # Insert Promotions
    print("Inserting promotions...")
    sql_promo = """
        INSERT INTO promotions (promo_id, promo_name, promo_type, discount_pct, start_date, end_date)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(sql_promo, df_promotions.values.tolist())
    conn.commit()

    # Insert Inventory
    print("Inserting inventory...")
    sql_inv = """
        INSERT INTO inventory (inventory_id, product_id, store_id, current_stock, safety_stock, reorder_level, last_restocked_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(sql_inv, df_inventory.values.tolist())
    conn.commit()

    # Replace NaN with None for MySQL compatibility
    df_sales = df_sales.astype(object).where(pd.notnull(df_sales), None)
    df_returns = df_returns.astype(object).where(pd.notnull(df_returns), None)
    df_inventory = df_inventory.astype(object).where(pd.notnull(df_inventory), None)
    df_promotions = df_promotions.astype(object).where(pd.notnull(df_promotions), None)
    df_customers = df_customers.astype(object).where(pd.notnull(df_customers), None)

    # Insert Sales in chunks of 5000 rows
    print(f"Inserting {len(df_sales):,} sales records in batches...")
    sql_sales = """
        INSERT INTO sales (
            order_id, product_id, order_date, order_timestamp, customer_id, store_id, 
            promo_id, quantity, unit_price, cost_price, discount_amount, gross_revenue, 
            net_revenue, profit, payment_method, is_returned
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    sales_rows = df_sales.values.tolist()
    batch_size = 5000
    for idx in range(0, len(sales_rows), batch_size):
        chunk = sales_rows[idx:idx + batch_size]
        cursor.executemany(sql_sales, chunk)
        conn.commit()
        if (idx // batch_size) % 5 == 0:
            print(f"  Inserted {min(idx + batch_size, len(sales_rows)):,} / {len(sales_rows):,} rows...")

    # Insert Returns
    print(f"Inserting {len(df_returns):,} return records...")
    sql_returns = """
        INSERT INTO returns (return_id, order_id, product_id, return_date, return_reason, refund_amount)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    ret_rows = df_returns.values.tolist()
    for idx in range(0, len(ret_rows), batch_size):
        chunk = ret_rows[idx:idx + batch_size]
        cursor.executemany(sql_returns, chunk)
        conn.commit()

    # Read and execute 02_views.sql
    views_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "views", "02_views.sql"))
    print("Creating Analytical Views from 02_views.sql...")
    with open(views_path, "r", encoding="utf-8") as f:
        views_sql = f.read()
    for stmt in views_sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)
    conn.commit()

    # Verify counts
    cursor.execute("SELECT COUNT(*) FROM sales")
    sales_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM customers")
    cust_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM products")
    prod_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM stores")
    store_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM inventory")
    inv_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM returns")
    ret_cnt = cursor.fetchone()[0]

    print("\n==========================================")
    print("Database seeding completed successfully!")
    print(f"Stores:     {store_cnt}")
    print(f"Products:   {prod_cnt}")
    print(f"Customers:  {cust_cnt}")
    print(f"Inventory:  {inv_cnt}")
    print(f"Sales:      {sales_cnt:,}")
    print(f"Returns:    {ret_cnt:,}")
    print("==========================================")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    stores, prods, promos, custs, inv, sales, rets = generate_dataset()
    populate_mysql(stores, prods, promos, custs, inv, sales, rets)
