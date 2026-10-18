# RetailIQ — Database Schema & Data Dictionary

Database: **`retailiq_db`**  
Target DBMS: **MySQL 8.0+**  
Character Set: `utf8mb4` | Collation: `utf8mb4_unicode_ci`

---

## 1. Relational Tables

### 1.1 `stores`
Stores organizational metadata for each retail store outlet.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `store_id` | VARCHAR(20) | PK, NOT NULL | Unique store identifier (e.g., STR101) |
| `store_name` | VARCHAR(100) | NOT NULL | Store display name |
| `city` | VARCHAR(50) | NOT NULL | City location |
| `state` | VARCHAR(50) | NOT NULL | State / Province code |
| `region` | VARCHAR(30) | NOT NULL | Regional territory (North, South, East, West, Central) |
| `store_type` | VARCHAR(40) | NOT NULL | Outlet format (Flagship, Shopping Mall, High Street, Outlet) |
| `square_feet` | INT | NOT NULL, DEFAULT 5000 | Store retail square footage |
| `opening_date` | DATE | NOT NULL | Store inception date |
| `manager_name` | VARCHAR(100) | NULL | Store manager in charge |

### 1.2 `products`
Master catalog containing merchandise SKUs, hierarchy, costs, and safety stock parameters.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `product_id` | VARCHAR(20) | PK, NOT NULL | Unique product identifier (e.g., PRD1001) |
| `product_name` | VARCHAR(150) | NOT NULL | Product name / title |
| `category` | VARCHAR(50) | NOT NULL | Master merchandise department |
| `subcategory` | VARCHAR(50) | NOT NULL | Sub-department classification |
| `cost_price` | DECIMAL(10,2) | NOT NULL | COGS / wholesale acquisition cost |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Recommended retail price |
| `target_margin_pct` | DECIMAL(5,2) | NOT NULL | Planned profit margin percentage |
| `reorder_point` | INT | NOT NULL, DEFAULT 50 | Reorder threshold quantity |
| `safety_stock` | INT | NOT NULL, DEFAULT 25 | Buffer safety stock |

### 1.3 `customers`
Customer demographic and RFM behavioral records.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | VARCHAR(20) | PK, NOT NULL | Unique customer identifier (e.g., CUST001) |
| `first_name` | VARCHAR(50) | NOT NULL | Customer first name |
| `last_name` | VARCHAR(50) | NOT NULL | Customer surname |
| `email` | VARCHAR(120) | NOT NULL, UNIQUE | Customer email address |
| `region` | VARCHAR(30) | NOT NULL | Primary geographic territory |
| `customer_segment` | VARCHAR(40) | NOT NULL | RFM segment (Champions, Loyal, At Risk, etc.) |
| `signup_date` | DATE | NOT NULL | Account creation date |

### 1.4 `promotions`
Promotional campaigns and promotional discount percentages.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `promo_id` | VARCHAR(20) | PK, NOT NULL | Unique promotion code |
| `promo_name` | VARCHAR(100) | NOT NULL | Campaign name |
| `discount_pct` | DECIMAL(5,2) | NOT NULL | Applied discount percentage |
| `start_date` | DATE | NOT NULL | Campaign launch date |
| `end_date` | DATE | NOT NULL | Campaign conclusion date |

### 1.5 `sales`
Line-item transaction ledger containing over 257,000+ sales records.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `order_id` | VARCHAR(30) | NOT NULL | Transaction order identifier |
| `product_id` | VARCHAR(20) | NOT NULL, FK(`products.product_id`) | Merchandised product SKU |
| `order_date` | DATE | NOT NULL | Date transaction was executed |
| `customer_id` | VARCHAR(20) | NOT NULL, FK(`customers.customer_id`) | Purchasing customer ID |
| `store_id` | VARCHAR(20) | NOT NULL, FK(`stores.store_id`) | Fulfilling retail store |
| `promo_id` | VARCHAR(20) | NULL, FK(`promotions.promo_id`) | Applied promotion (if any) |
| `quantity` | INT | NOT NULL | Units purchased |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Realized retail unit price |
| `cost_price` | DECIMAL(10,2) | NOT NULL | Unit cost of goods sold |
| `discount_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Total discount given |
| `net_revenue` | DECIMAL(12,2) | NOT NULL | Total gross sales minus discount |
| `profit` | DECIMAL(12,2) | NOT NULL | Net revenue minus total cost |
| `payment_method` | VARCHAR(40) | NOT NULL | Payment instrument |
| `is_returned` | BOOLEAN | NOT NULL, DEFAULT FALSE | Return flag |

### 1.6 `inventory`
Store-level stock balances and replenishment tracking.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `inventory_id` | VARCHAR(30) | PK, NOT NULL | Unique inventory record identifier |
| `product_id` | VARCHAR(20) | NOT NULL, FK(`products.product_id`) | Product SKU |
| `store_id` | VARCHAR(20) | NOT NULL, FK(`stores.store_id`) | Store location |
| `current_stock` | INT | NOT NULL | Units physically on hand |
| `safety_stock` | INT | NOT NULL | Buffer stock threshold |
| `reorder_level` | INT | NOT NULL | Reorder trigger level |
| `last_restocked_date`| DATE | NOT NULL | Date of most recent replenishment |

### 1.7 `returns`
Merchandise return records and refund accounting.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `return_id` | VARCHAR(30) | PK, NOT NULL | Return transaction identifier |
| `order_id` | VARCHAR(30) | NOT NULL | Corresponding order ID |
| `product_id` | VARCHAR(20) | NOT NULL | Returned product SKU |
| `return_date` | DATE | NOT NULL | Date return was processed |
| `return_reason` | VARCHAR(100) | NOT NULL | Customer justification |
| `refund_amount` | DECIMAL(10,2) | NOT NULL | Net refunded sum |

---

## 2. Analytical SQL Views
The database includes 6 specialized analytical views defined in `database/views/02_views.sql`:
1. **`vw_monthly_sales`**: Monthly aggregated revenue, profit, unit volume, transactions, realized margin %, and AOV.
2. **`vw_daily_sales`**: Daily aggregated sales by region, store, and merchandise category.
3. **`vw_product_performance`**: SKU-level realized margin, units merchandised, return rates, and stock distribution.
4. **`vw_store_regional_performance`**: Store and regional rankings, total sales, profit, and revenue per square foot.
5. **`vw_customer_rfm`**: Recency days, frequency, monetary spend, and assigned RFM segments.
6. **`vw_inventory_risk`**: Real-time inventory status, 90-day daily velocity, days of cover, and stockout risk classifications.
