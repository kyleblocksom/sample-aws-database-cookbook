-- Create schema for retail rewards application
CREATE SCHEMA IF NOT EXISTS xpoints;

-- Create customers table
CREATE TABLE IF NOT EXISTS xpoints.customers (
    customer_id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    region VARCHAR(20) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS xpoints.products (
    product_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    inventory_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    region VARCHAR(20) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS xpoints.orders (
    order_id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES xpoints.customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT,
    region VARCHAR(20) NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS xpoints.order_items (
    order_item_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES xpoints.orders(order_id),
    product_id VARCHAR(36) NOT NULL REFERENCES xpoints.products(product_id),
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS xpoints.rewards (
    reward_id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES xpoints.customers(customer_id),
    points_balance INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    region VARCHAR(20) NOT NULL
);

-- Create reward_transactions table
CREATE TABLE IF NOT EXISTS xpoints.reward_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    reward_id VARCHAR(36) NOT NULL REFERENCES xpoints.rewards(reward_id),
    points_change INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_id VARCHAR(36) REFERENCES xpoints.orders(order_id),
    notes TEXT,
    region VARCHAR(20) NOT NULL,
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust'))
);