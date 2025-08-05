const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require("https");
const url = require("url");

// Initialize clients
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

// Response object for CloudFormation custom resources
const response = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  
  send: function(event, context, responseStatus, responseData) {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: responseData ? JSON.stringify(responseData) : "See CloudWatch Logs",
      PhysicalResourceId: context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData || {}
    });
    
    console.log("Response body:", responseBody);
    
    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: "PUT",
      headers: {
        "content-type": "",
        "content-length": responseBody.length
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = https.request(options, function(response) {
        console.log(`Status code: ${response.statusCode}`);
        resolve();
      });
      
      request.on("error", function(error) {
        console.log("Error sending response:", error);
        reject(error);
      });
      
      request.write(responseBody);
      request.end();
    });
  }
};

exports.handler = async (event, context) => {
  // Check if this is a CloudFormation custom resource request
  const isCustomResource = event.StackId && event.RequestType;
  
  try {
    // Handle CloudFormation delete event or rollback
    if (isCustomResource && (event.RequestType === 'Delete' || event.RequestType === 'Update')) {
      console.log(`Handling ${event.RequestType} event for custom resource`);
      await response.send(event, context, response.SUCCESS);
      return;
    }
    
    // Get database credentials from Secrets Manager
    const secretCommand = new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN
    });
    const secretData = await secretsClient.send(secretCommand);
    
    const { username, password } = JSON.parse(secretData.SecretString);
    
    // Get app user credentials from Secrets Manager
    const appSecretCommand = new GetSecretValueCommand({
      SecretId: process.env.APP_USER_SECRET_ARN
    });
    const appSecretData = await secretsClient.send(appSecretCommand);
    
    const appSecret = JSON.parse(appSecretData.SecretString);
    
    // Connect to the database
    const client = new Client({
      host: process.env.DB_ENDPOINT,
      port: 5432,
      database: process.env.DB_NAME,
      user: username,
      password: password
    });
    
    await client.connect();
    console.log('Connected to database');
    
    // Execute schema SQL
    const schemaSQL = `
      -- Create schema
      CREATE SCHEMA IF NOT EXISTS xpoints;
      
      -- Create tables
      CREATE TABLE IF NOT EXISTS xpoints.customers
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
      
      CREATE INDEX IF NOT EXISTS idx_customers_username ON xpoints.customers (username);
      
      CREATE TABLE IF NOT EXISTS xpoints.catalog_items
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
      
      CREATE TABLE IF NOT EXISTS xpoints.catalog_images
      (
          item_id             UUID,
          image_id            UUID,
          PRIMARY KEY (item_id, image_id),
          FOREIGN KEY (item_id) REFERENCES xpoints.catalog_items(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_catalog_images_item_id ON xpoints.catalog_images (item_id);
      
      CREATE TABLE IF NOT EXISTS xpoints.shopping_cart_items
      (
          customer_id     UUID,
          item_id         UUID,
          quantity        INT,
          PRIMARY KEY (customer_id, item_id),
          FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id),
          FOREIGN KEY (item_id) REFERENCES xpoints.catalog_items(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_customer_id ON xpoints.shopping_cart_items (customer_id);
      
      CREATE TABLE IF NOT EXISTS xpoints.points_balances
      (
          customer_id     UUID PRIMARY KEY,
          points_balance  BIGINT NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id)
      );
      
      CREATE TABLE IF NOT EXISTS xpoints.transactions
      (
          id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id         UUID,
          tx_type             VARCHAR(10),
          points              BIGINT,
          tx_dt               TIMESTAMP DEFAULT now(),
          tx_description      VARCHAR(50),
          FOREIGN KEY (customer_id) REFERENCES xpoints.customers(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON xpoints.transactions (customer_id);
      
      CREATE TABLE IF NOT EXISTS xpoints.order_items
      (
          tx_id               UUID,
          cat_item_id         UUID,
          unit_cnt            INT,
          unit_points_price   INT,
          PRIMARY KEY (tx_id, cat_item_id),
          FOREIGN KEY (tx_id) REFERENCES xpoints.transactions(id),
          FOREIGN KEY (cat_item_id) REFERENCES xpoints.catalog_items(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_order_items_tx_id ON xpoints.order_items (tx_id);
      
      CREATE TABLE IF NOT EXISTS xpoints.images
      (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filename    VARCHAR(100)
      );
      
      CREATE TABLE IF NOT EXISTS xpoints.image_urls
      (
          image_id           UUID,
          region             VARCHAR(20),
          presigned_url      VARCHAR(2000),
          created            TIMESTAMP DEFAULT now(),
          PRIMARY KEY (image_id, region),
          FOREIGN KEY (image_id) REFERENCES xpoints.images(id)
      );
    `;
    
    await client.query(schemaSQL);
    console.log('Schema created successfully');
    
    // Create application user with credentials from the secret
    const createUserSQL = `
      -- Create application user
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${appSecret.username}') THEN
          CREATE ROLE ${appSecret.username} WITH LOGIN PASSWORD '${appSecret.password}';
        ELSE
          ALTER ROLE ${appSecret.username} WITH LOGIN PASSWORD '${appSecret.password}';
        END IF;
      END
      $$;
      
      -- Grant permissions to application user
      GRANT CONNECT ON DATABASE ${process.env.DB_NAME} TO ${appSecret.username};
      GRANT USAGE ON SCHEMA xpoints TO ${appSecret.username};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA xpoints TO ${appSecret.username};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA xpoints TO ${appSecret.username};
      ALTER DEFAULT PRIVILEGES IN SCHEMA xpoints GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appSecret.username};
      ALTER DEFAULT PRIVILEGES IN SCHEMA xpoints GRANT USAGE, SELECT ON SEQUENCES TO ${appSecret.username};
    `;
    
    await client.query(createUserSQL);
    console.log('Application user created successfully');
    
    // Load data from S3
    const loadDataSQL = `
      -- Create aws_s3 extension if it doesn't exist
      CREATE EXTENSION IF NOT EXISTS aws_s3 CASCADE;
      
      -- Verify the extension exists
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'aws_s3') THEN
          RAISE EXCEPTION 'aws_s3 extension is not installed';
        END IF;
      END
      $$;
      
      -- Truncate tables in reverse dependency order
      TRUNCATE TABLE xpoints.shopping_cart_items CASCADE;
      TRUNCATE TABLE xpoints.order_items CASCADE;
      TRUNCATE TABLE xpoints.transactions CASCADE;
      TRUNCATE TABLE xpoints.points_balances CASCADE;
      TRUNCATE TABLE xpoints.catalog_images CASCADE;
      TRUNCATE TABLE xpoints.catalog_items CASCADE;
      TRUNCATE TABLE xpoints.customers CASCADE;
      TRUNCATE TABLE xpoints.images CASCADE;
      
      -- Disable foreign key checks
      SET session_replication_role = 'replica';

      -- Import data in dependency order
      SELECT aws_s3.table_import_from_s3(
         'xpoints.images',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/images.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.customers',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/customers.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.catalog_items',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/catalog_items.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.catalog_images',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/catalog_images.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.points_balances',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/points_balances.csv', '${process.env.REGION}')
      );

      SELECT aws_s3.table_import_from_s3(
         'xpoints.transactions',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/transactions.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.order_items',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/order_items.csv', '${process.env.REGION}')
      );
      
      SELECT aws_s3.table_import_from_s3(
         'xpoints.shopping_cart_items',
         '',
         '(format csv, delimiter '','', escape ''\\'')',
         aws_commons.create_s3_uri('${process.env.S3_BUCKET}', 'sql/shopping_cart_items.csv', '${process.env.REGION}')
      );
      
      -- Re-enable foreign key checks
      SET session_replication_role = 'origin';
    `;
    
    await client.query(loadDataSQL);
    console.log('Data loaded successfully');
    
    await client.end();
    console.log('Database initialization completed successfully');
    
    // Send success response for CloudFormation custom resource
    if (isCustomResource) {
      await response.send(event, context, response.SUCCESS, {
        Message: "Database initialized successfully"
      });
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database initialized successfully' })
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    
    // Send failure response for CloudFormation custom resource
    if (isCustomResource) {
      try {
        await response.send(event, context, response.FAILED, {
          Message: `Database initialization failed: ${error.message}`
        });
      } catch (responseError) {
        console.error('Failed to send response to CloudFormation:', responseError);
      }
    }
    
    throw error;
  } finally {
    // Ensure a response is sent even if there's an uncaught exception
    if (isCustomResource && !context.callbackWaitsForEmptyEventLoop) {
      try {
        await response.send(event, context, response.FAILED, {
          error: 'Function execution failed or timed out'
        });
      } catch (finallyError) {
        console.error('Failed to send final response to CloudFormation:', finallyError);
      }
    }
  }
};