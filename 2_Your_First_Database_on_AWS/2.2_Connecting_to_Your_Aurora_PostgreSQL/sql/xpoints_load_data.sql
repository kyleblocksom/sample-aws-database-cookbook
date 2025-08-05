-- Install the aws_s3 extension
CREATE EXTENSION aws_s3 CASCADE;

-- Truncate tables
TRUNCATE TABLE xpoints.shopping_cart_items CASCADE;
TRUNCATE TABLE xpoints.order_items CASCADE;
TRUNCATE TABLE xpoints.transactions CASCADE;
TRUNCATE TABLE xpoints.points_balances CASCADE;
TRUNCATE TABLE xpoints.catalog_images CASCADE;
TRUNCATE TABLE xpoints.catalog_items CASCADE;
TRUNCATE TABLE xpoints.customers CASCADE;
TRUNCATE TABLE xpoints.images CASCADE;

-- Important: Set your S3 bucket name and AWS region here
DO $$
DECLARE
    bucket_name TEXT := 'your-s3-bucket-name'; -- e.g. my-bucket
    aws_region TEXT := 'your-region'; -- e.g. us-east-1
BEGIN
    -- Store variables in temporary table for use in subsequent queries
    DROP TABLE IF EXISTS temp_s3_config;
    CREATE TABLE temp_s3_config (bucket_name TEXT, aws_region TEXT);
    INSERT INTO temp_s3_config VALUES (bucket_name, aws_region);
END $$;

-- Disable foreign key checks (if your PostgreSQL version supports it)
SET session_replication_role = 'replica';

-- 1. Import images table (No foreign key dependencies)
SELECT aws_s3.table_import_from_s3(
   'xpoints.images',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/images.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 2. Import customers table (No foreign key dependencies)
SELECT aws_s3.table_import_from_s3(
   'xpoints.customers',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/customers.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 3. Import catalog_items table (Only depends on images for thumbnail_id, which is nullable)
SELECT aws_s3.table_import_from_s3(
   'xpoints.catalog_items',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/catalog_items.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 4. Import catalog_images table (Depends on catalog_items and images)
SELECT aws_s3.table_import_from_s3(
   'xpoints.catalog_images',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/catalog_images.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 5. Import points_balances table (Depends on customers)
SELECT aws_s3.table_import_from_s3(
   'xpoints.points_balances',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/points_balances.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 6. Import transactions table (Depends on customers)
SELECT aws_s3.table_import_from_s3(
   'xpoints.transactions',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/transactions.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 7. Import order_items table (Depends on transactions and catalog_items)
SELECT aws_s3.table_import_from_s3(
   'xpoints.order_items',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/order_items.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- 8. Import shopping_cart_items table (Depends on customers and catalog_items)
SELECT aws_s3.table_import_from_s3(
   'xpoints.shopping_cart_items',
   '',
   '(format csv, delimiter '','', escape ''\'')',
   aws_commons.create_s3_uri(
       (SELECT bucket_name FROM temp_s3_config),
       'sql/data/shopping_cart_items.csv',
       (SELECT aws_region FROM temp_s3_config)
   )
);

-- Re-enable foreign key checks
SET session_replication_role = 'origin';