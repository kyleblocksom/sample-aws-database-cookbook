// Import required modules
const { Pool } = require('pg');
const dbConfig = require('../../config/database').dbConfig;
const getAuthToken = require('../../config/database').getAuthToken;

// Create a connection pool
let pool;
let connectionStartTime;
const MAX_CONNECTION_DURATION_MS = 55 * 60 * 1000; // 55 minutes
const MAX_DB_RETRIES = 5;

// Initialize the database connection pool
const initializePool = async (forceReconnect = false) => {
  try {
    const currentTime = Date.now();
    
    // Check if we need to create a new pool
    if (!forceReconnect && pool && 
        connectionStartTime && 
        currentTime < connectionStartTime + MAX_CONNECTION_DURATION_MS) {
      return pool;
    }
    
    // Close existing pool if it exists
    if (pool) {
      console.log('Closing existing connection pool');
      await pool.end();
      pool = null;
    }
    
    // Get authentication token for IAM authentication
    console.log('Generating auth token for IAM authentication');
    const authToken = await getAuthToken();
    console.log('Auth token generated successfully');
    
    // Create a new pool with IAM authentication
    console.log('Creating new connection pool with IAM authentication');
    pool = new Pool({
      ...dbConfig,
      password: authToken,
      // Set a reasonable pool size for Lambda
      max: 1,
      idleTimeoutMillis: 120000,
      connectionTimeoutMillis: 10000
    });
    
    // Add error handler to the pool
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Force reconnect on next query
      connectionStartTime = 0;
    });
    
    // Test the connection
    console.log('Testing database connection');
    const client = await pool.connect();
    try {
      // Get session information for logging
      const result = await client.query('SELECT pg_backend_pid()');
      const sessionId = result.rows[0].pg_backend_pid;
      console.log('New database connection established. Session ID:', sessionId);
      
      // Get additional connection info
      await logConnectionInfo(client);
    } finally {
      client.release();
    }
    
    connectionStartTime = currentTime;
    return pool;
  } catch (error) {
    console.error('Error initializing database pool:', error);
    throw error;
  }
};

// Log connection information for debugging
const logConnectionInfo = async (client) => {
  try {
    // Get application name
    const appNameResult = await client.query('SHOW application_name');
    console.debug('Application name:', appNameResult.rows[0].application_name);
    
    // Get current user
    const userResult = await client.query('SELECT current_user');
    console.debug('Current user:', userResult.rows[0].current_user);
    
    // Get connection stats
    const statsResult = await client.query(
      'SELECT state, backend_type, wait_event_type, wait_event ' +
      'FROM pg_stat_activity WHERE pid = pg_backend_pid()'
    );
    
    if (statsResult.rows.length > 0) {
      const stats = statsResult.rows[0];
      console.debug('Connection details:');
      console.debug('State:', stats.state);
      console.debug('Backend Type:', stats.backend_type);
      console.debug('Wait Event Type:', stats.wait_event_type);
      console.debug('Wait Event:', stats.wait_event);
    }
  } catch (error) {
    console.warn('Error getting connection details:', error);
    // Don't throw the exception as this is just diagnostic information
  }
};

// Check if an error is retryable
const isRetryableError = (error) => {
  if (!error) return false;
  
  // Check for connection errors
  if (error.code && (
      error.code.startsWith('08') || // Connection errors
      error.code === '57P01' ||      // Admin shutdown
      error.code === '57P02' ||      // Crash shutdown
      error.code === '57P03'         // Cannot connect now
  )) {
    return true;
  }
  
  // Check for concurrency conflicts
  if (error.code && (
      error.code === '40001' || // Serialization failure
      error.code === '40P01' || // Deadlock detected
      error.code === '55P03'    // Lock not available
  )) {
    return true;
  }
  
  // Check error message for common retryable issues
  const message = error.message ? error.message.toLowerCase() : '';
  return message.includes('timeout') ||
         message.includes('connection') ||
         message.includes('proxy') ||
         message.includes('could not connect');
};

// Backoff function for retries
const backoff = async (attempt) => {
  const JITTER_BASE = 20;
  const JITTER_MAX = 5000;
  
  const duration = Math.min(
    JITTER_MAX, 
    JITTER_BASE * Math.pow(2, attempt)
  ) * Math.random();
  
  return new Promise(resolve => setTimeout(resolve, duration));
};

// Execute a query with parameters and retry logic
const query = async (text, params = []) => {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < MAX_DB_RETRIES) {
    attempt++;
    
    if (attempt > 1) {
      await backoff(attempt);
    }
    
    try {
      const currentPool = await initializePool(attempt > 1);
      const client = await currentPool.connect();
      
      try {
        const result = await client.query(text, params);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error('Database error:', error);
      
      if (attempt >= MAX_DB_RETRIES || !isRetryableError(error)) {
        console.error('Fatal database error:', error.message);
        break;
      } else {
        console.warn('Retryable error:', error.message);
      }
    }
  }
  
  throw lastError || new Error('Failed to execute query after multiple attempts');
};

// Execute a transaction with multiple queries
const transaction = async (queries) => {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < MAX_DB_RETRIES) {
    attempt++;
    
    if (attempt > 1) {
      await backoff(attempt);
    }
    
    const currentPool = await initializePool(attempt > 1);
    const client = await currentPool.connect();
    
    try {
      await client.query('BEGIN');
      const results = [];
      let txId = null;
      
      for (let i = 0; i < queries.length; i++) {
        const { text, params } = queries[i];
        
        // Replace TX_ID_PLACEHOLDER with actual transaction ID
        const actualParams = params.map(param => 
          param === 'TX_ID_PLACEHOLDER' ? txId : param
        );
        
        const result = await client.query(text, actualParams);
        results.push(result.rows);
        
        // Capture transaction ID from INSERT INTO transactions
        if (text.includes('INSERT INTO xpoints.transactions') && result.rows[0]?.id) {
          txId = result.rows[0].id;
        }
      }
      
      await client.query('COMMIT');
      client.release();
      return results;
    } catch (error) {
      lastError = error;
      console.error('Transaction error:', error);
      
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      } finally {
        client.release();
      }
      
      if (attempt >= MAX_DB_RETRIES || !isRetryableError(error)) {
        console.error('Fatal transaction error:', error.message);
        break;
      } else {
        console.warn('Retryable transaction error:', error.message);
      }
    }
  }
  
  throw lastError || new Error('Failed to execute transaction after multiple attempts');
};

module.exports = {
  query,
  transaction,
  initializePool
};