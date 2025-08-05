const { RDSClient } = require('@aws-sdk/client-rds');
const { Signer } = require('@aws-sdk/rds-signer');

// Load environment variables
const {
  DB_PROXY_ENDPOINT,
  DB_NAME,
  DB_USERNAME,
  REGION
} = process.env;

// Initialize RDS client
const rdsClient = new RDSClient({ region: REGION });

// Function to generate an authentication token for RDS IAM authentication
const getAuthToken = async () => {
  try {
    const signer = new Signer({
      region: REGION,
      hostname: DB_PROXY_ENDPOINT,
      port: 5432,
      username: DB_USERNAME || 'rewards_rw'
    });

    const token = await signer.getAuthToken();
    console.log('Successfully generated auth token');
    return token;
  } catch (error) {
    console.error('Error in getAuthToken:', error);
    throw error;
  }
};

// Get JDBC URL format (for reference)
const getJdbcUrl = () => {
  return `jdbc:postgresql://${DB_PROXY_ENDPOINT}/${DB_NAME}?ssl=true&sslmode=verify-full&targetServerType=primary`;
};

module.exports = {
  getAuthToken,
  dbConfig: {
    host: DB_PROXY_ENDPOINT,
    port: 5432,
    database: DB_NAME || 'postgres',
    user: DB_USERNAME || 'rewards_rw',
    ssl: true,
    // RDS Proxy specific settings
    application_name: 'RewardsApp-NodeJS',
    connectionTimeoutMillis: 10000,
    // Remove statement_timeout as it's not supported by RDS Proxy
    query_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 30000
  }
};