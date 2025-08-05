-- Clean up
drop table if exists xpoints.order_items;
drop table if exists xpoints.transactions;
drop table if exists xpoints.points_balances;
drop table if exists xpoints.shopping_cart_items;
drop table if exists xpoints.catalog_images;
drop table if exists xpoints.catalog_items;
drop table if exists xpoints.customers;
drop table if exists xpoints.image_urls;
drop table if exists xpoints.images;

drop schema if exists xpoints cascade;

drop role if exists rewards_ro;
drop role if exists rewards_rw;

-- Create tables
CREATE SCHEMA xpoints;

CREATE TABLE xpoints.customers
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) UNIQUE,
    first_name  VARCHAR(50),
    last_name   VARCHAR(50),
    maiden_name VARCHAR(50),
    gender      VARCHAR(10),
    email       VARCHAR(50),
    phone_num   VARCHAR(20),
    age         INT,
    address     VARCHAR(100),
    city        VARCHAR(50),
    state       VARCHAR(25),
    state_code  VARCHAR(20),
    postal_code VARCHAR(10)
);

CREATE TABLE xpoints.catalog_items
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(50),
    description         VARCHAR(200),
    category            VARCHAR(20),
    usd_price           NUMERIC(8,2),
    points_price        INT,
    rating              REAL,
    sku                 VARCHAR(20),
    weight              REAL,
    width               REAL,
    height              REAL,
    depth               REAL,
    thumbnail_id        UUID
);

CREATE TABLE xpoints.catalog_images
(
    item_id             UUID,
    image_id            UUID,
    PRIMARY KEY (item_id, image_id),
    FOREIGN KEY (item_id) REFERENCES xpoints.catalog_items(id)
);

CREATE INDEX ON xpoints.catalog_images (item_id);

CREATE TABLE xpoints.shopping_cart_items
(
    customer_id     UUID,
    item_id         UUID,
    quantity        INT,
    PRIMARY KEY (customer_id, item_id),
    FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id),
    FOREIGN KEY (item_id) REFERENCES xpoints.catalog_items(id)
);

CREATE INDEX ON xpoints.shopping_cart_items (customer_id);

CREATE TABLE xpoints.points_balances
(
    customer_id     UUID PRIMARY KEY,
    points_balance  BIGINT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id)
);

CREATE TABLE xpoints.transactions
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID,
    tx_type             VARCHAR(10),
    points              BIGINT,
    tx_dt               TIMESTAMP DEFAULT now(),
    tx_description      VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id)
);

CREATE INDEX ON xpoints.transactions (customer_id);

CREATE TABLE xpoints.order_items
(
    tx_id               UUID,
    cat_item_id         UUID,
    unit_cnt            INT,
    unit_points_price   INT,
    PRIMARY KEY (tx_id, cat_item_id),
    FOREIGN KEY (tx_id) REFERENCES xpoints.transactions(id),
    FOREIGN KEY (cat_item_id) REFERENCES xpoints.catalog_items(id)
);

CREATE INDEX ON xpoints.order_items (tx_id);

CREATE TABLE xpoints.images
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    VARCHAR(100)
);

CREATE TABLE xpoints.image_urls
(
    image_id           UUID,
    region             VARCHAR(20),
    presigned_url      VARCHAR(2000),
    created            TIMESTAMP DEFAULT now(),
    PRIMARY KEY (image_id, region),
    FOREIGN KEY (image_id) REFERENCES xpoints.images(id)
);

-- Create roles
CREATE ROLE rewards_ro WITH LOGIN;
GRANT USAGE ON SCHEMA xpoints TO rewards_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA xpoints TO rewards_ro;

CREATE ROLE rewards_rw WITH LOGIN;
GRANT USAGE ON SCHEMA xpoints TO rewards_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA xpoints TO rewards_rw;