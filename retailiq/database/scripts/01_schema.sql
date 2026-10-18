-- =============================================================================
-- RetailIQ — Enterprise Retail Business Intelligence & Predictive Analytics
-- Database DDL & Schema Definition
-- Target DBMS: MySQL 8.0+
-- Database Name: retailiq_db
-- =============================================================================

CREATE DATABASE IF NOT EXISTS retailiq_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE retailiq_db;

-- -----------------------------------------------------------------------------
-- 1. Table: stores
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS stores;

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
    PRIMARY KEY (store_id),
    INDEX idx_stores_region (region),
    INDEX idx_stores_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    PRIMARY KEY (customer_id),
    INDEX idx_customers_region (region),
    INDEX idx_customers_segment (customer_segment),
    INDEX idx_customers_signup (signup_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: products
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    target_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    reorder_point INT NOT NULL DEFAULT 30,
    safety_stock INT NOT NULL DEFAULT 15,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (product_id),
    INDEX idx_products_category (category),
    INDEX idx_products_subcategory (subcategory)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: promotions
-- -----------------------------------------------------------------------------
CREATE TABLE promotions (
    promo_id VARCHAR(20) NOT NULL,
    promo_name VARCHAR(100) NOT NULL,
    promo_type VARCHAR(50) NOT NULL,
    discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    PRIMARY KEY (promo_id),
    INDEX idx_promotions_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: sales
-- -----------------------------------------------------------------------------
CREATE TABLE sales (
    order_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    order_date DATE NOT NULL,
    order_timestamp DATETIME NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    promo_id VARCHAR(20) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gross_revenue DECIMAL(12,2) NOT NULL,
    net_revenue DECIMAL(12,2) NOT NULL,
    profit DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Credit Card',
    is_returned TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (order_id, product_id),
    INDEX idx_sales_date (order_date),
    INDEX idx_sales_customer (customer_id),
    INDEX idx_sales_product (product_id),
    INDEX idx_sales_store (store_id),
    INDEX idx_sales_promo (promo_id),
    INDEX idx_sales_date_store (order_date, store_id),
    INDEX idx_sales_date_product (order_date, product_id),
    CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: returns
-- -----------------------------------------------------------------------------
CREATE TABLE returns (
    return_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    return_date DATE NOT NULL,
    return_reason VARCHAR(100) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (return_id),
    INDEX idx_returns_order_prod (order_id, product_id),
    INDEX idx_returns_date (return_date),
    INDEX idx_returns_reason (return_reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    UNIQUE KEY uq_prod_store (product_id, store_id),
    INDEX idx_inv_stock (current_stock),
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
