-- =============================================================================
-- RetailIQ — Enterprise Retail Business Intelligence & Predictive Analytics
-- Database DDL & Schema Definition
-- Target DBMS: PostgreSQL 14+ / Render PostgreSQL
-- =============================================================================

-- Clean up existing tables and views
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Table: stores
-- -----------------------------------------------------------------------------
CREATE TABLE stores (
    store_id VARCHAR(20) NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    region VARCHAR(30) NOT NULL,
    store_type VARCHAR(40) NOT NULL,
    square_feet INT NOT NULL DEFAULT 5000,
    opening_date DATE NOT NULL,
    manager_name VARCHAR(100) NULL,
    PRIMARY KEY (store_id)
);

CREATE INDEX idx_stores_region ON stores (region);
CREATE INDEX idx_stores_city ON stores (city);

-- -----------------------------------------------------------------------------
-- 2. Table: customers
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    customer_id VARCHAR(20) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    region VARCHAR(30) NOT NULL,
    customer_segment VARCHAR(40) NOT NULL DEFAULT 'Potential Loyalists',
    signup_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id)
);

CREATE INDEX idx_customers_region ON customers (region);
CREATE INDEX idx_customers_segment ON customers (customer_segment);
CREATE INDEX idx_customers_signup ON customers (signup_date);

-- -----------------------------------------------------------------------------
-- 3. Table: products
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50) NOT NULL,
    cost_price NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    target_margin_pct NUMERIC(5,2) NOT NULL DEFAULT 35.00,
    reorder_point INT NOT NULL DEFAULT 30,
    safety_stock INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (product_id)
);

CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_subcategory ON products (subcategory);

-- -----------------------------------------------------------------------------
-- 4. Table: promotions
-- -----------------------------------------------------------------------------
CREATE TABLE promotions (
    promo_id VARCHAR(20) NOT NULL,
    promo_name VARCHAR(100) NOT NULL,
    promo_type VARCHAR(50) NOT NULL,
    discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    PRIMARY KEY (promo_id)
);

CREATE INDEX idx_promotions_dates ON promotions (start_date, end_date);

-- -----------------------------------------------------------------------------
-- 5. Table: sales
-- -----------------------------------------------------------------------------
CREATE TABLE sales (
    order_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    order_date DATE NOT NULL,
    order_timestamp TIMESTAMP NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    promo_id VARCHAR(20) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    gross_revenue NUMERIC(12,2) NOT NULL,
    net_revenue NUMERIC(12,2) NOT NULL,
    profit NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Credit Card',
    is_returned BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_promo FOREIGN KEY (promo_id) REFERENCES promotions (promo_id) ON DELETE SET NULL
);

CREATE INDEX idx_sales_date ON sales (order_date);
CREATE INDEX idx_sales_customer ON sales (customer_id);
CREATE INDEX idx_sales_product ON sales (product_id);
CREATE INDEX idx_sales_store ON sales (store_id);
CREATE INDEX idx_sales_promo ON sales (promo_id);
CREATE INDEX idx_sales_date_store ON sales (order_date, store_id);
CREATE INDEX idx_sales_date_product ON sales (order_date, product_id);

-- -----------------------------------------------------------------------------
-- 6. Table: returns
-- -----------------------------------------------------------------------------
CREATE TABLE returns (
    return_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    return_date DATE NOT NULL,
    return_reason VARCHAR(100) NOT NULL,
    refund_amount NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (return_id)
);

CREATE INDEX idx_returns_order_prod ON returns (order_id, product_id);
CREATE INDEX idx_returns_date ON returns (return_date);
CREATE INDEX idx_returns_reason ON returns (return_reason);

-- -----------------------------------------------------------------------------
-- 7. Table: inventory
-- -----------------------------------------------------------------------------
CREATE TABLE inventory (
    inventory_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    safety_stock INT NOT NULL DEFAULT 15,
    reorder_level INT NOT NULL DEFAULT 30,
    last_restocked_date DATE NOT NULL,
    PRIMARY KEY (inventory_id),
    CONSTRAINT uq_prod_store UNIQUE (product_id, store_id),
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
);

CREATE INDEX idx_inv_stock ON inventory (current_stock);
