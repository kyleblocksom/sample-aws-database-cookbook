const db = require('../utils/db');

const getPoints = async (customerId) => {
  const query = `
    SELECT points_balance
    FROM xpoints.points_balances
    WHERE customer_id = $1
  `;
  
  try {
    const result = await db.query(query, [customerId]);
    return { 
      points: Array.isArray(result) && result.length > 0 ? result[0].points_balance : 0 
    };
  } catch (error) {
    return { points: 0 };
  }
};

const getTransactions = async (customerId) => {
  const query = `
    SELECT t.id, t.customer_id, t.tx_type, t.points, t.tx_dt, t.tx_description
    FROM xpoints.transactions t
    WHERE t.customer_id = $1
    ORDER BY t.tx_dt DESC
  `;
  
  try {
    const result = await db.query(query, [customerId]);
    return { transactions: Array.isArray(result) ? result : [] };
  } catch (error) {
    return { transactions: [] };
  }
};

const getTransaction = async (txId) => {
  const query = `
    SELECT t.*, oi.cat_item_id, oi.unit_cnt, oi.unit_points_price, p.name as product_name, 
           p.description, ci.image_id, i.presigned_url as image_url
    FROM xpoints.transactions t
    LEFT JOIN xpoints.order_items oi ON t.id = oi.tx_id
    LEFT JOIN xpoints.catalog_items p ON oi.cat_item_id = p.id
    LEFT JOIN xpoints.catalog_images ci ON p.id = ci.item_id
    LEFT JOIN xpoints.image_urls i ON ci.image_id = i.image_id AND i.region = $2
    WHERE t.id = $1
    ORDER BY oi.cat_item_id, ci.image_id
  `;
  
  try {
    const result = await db.query(query, [txId, process.env.REGION]);
    if (!Array.isArray(result) || result.length === 0) {
      return { transaction: null };
    }
    
    const transaction = {
      id: result[0].id,
      customer_id: result[0].customer_id,
      tx_type: result[0].tx_type,
      points: result[0].points,
      tx_dt: result[0].tx_dt,
      tx_description: result[0].tx_description,
      items: []
    };
    
    // Group by cat_item_id to handle multiple images per item
    const itemMap = new Map();
    result.forEach(row => {
      if (row.cat_item_id) {
        if (!itemMap.has(row.cat_item_id)) {
          itemMap.set(row.cat_item_id, {
            cat_item_id: row.cat_item_id,
            product_name: row.product_name,
            description: row.description,
            image_url: row.image_url, // Take first image
            unit_cnt: row.unit_cnt,
            unit_points_price: row.unit_points_price
          });
        }
      }
    });
    
    transaction.items = Array.from(itemMap.values());
    
    // Backward compatibility for single item
    if (transaction.items.length === 1) {
      transaction.product_name = transaction.items[0].product_name;
      transaction.description = transaction.items[0].description;
      transaction.image_url = transaction.items[0].image_url;
      transaction.unit_cnt = transaction.items[0].unit_cnt;
      transaction.unit_points_price = transaction.items[0].unit_points_price;
    }
    
    return { transaction };
  } catch (error) {
    console.error('Error in getTransaction:', error);
    return { transaction: null };
  }
};

const createTransaction = async (customerId, txType, points, description, items = []) => {
  const queries = [
    {
      text: `INSERT INTO xpoints.transactions (customer_id, tx_type, points, tx_description)
             VALUES ($1, $2, $3, $4) RETURNING id`,
      params: [customerId, txType, points, description]
    }
  ];
  
  // Add order items queries
  if (Array.isArray(items) && items.length > 0) {
    items.forEach(item => {
      queries.push({
        text: `INSERT INTO xpoints.order_items (tx_id, cat_item_id, unit_cnt, unit_points_price)
               VALUES ($1, $2, $3, $4)`,
        params: ['TX_ID_PLACEHOLDER', item.item_id || item.id, item.quantity, item.points_price]
      });
    });
  }
  
  // Add balance update query
  queries.push({
    text: `INSERT INTO xpoints.points_balances (customer_id, points_balance)
           VALUES ($1, $2)
           ON CONFLICT (customer_id) DO UPDATE
           SET points_balance = xpoints.points_balances.points_balance + $2`,
    params: [customerId, points]
  });
  
  try {
    const results = await db.transaction(queries);
    const txId = results[0][0]?.id;
    
    if (!txId) {
      throw new Error('Failed to create transaction');
    }
    
    return { success: true, txId };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    return { success: false, error: error.message };
  }
};

const createTransactionWithBalanceCheck = async (customerId, txType, points, description, items = []) => {
  const queries = [
    // Check current balance with row lock
    {
      text: `SELECT points_balance FROM xpoints.points_balances 
             WHERE customer_id = $1 FOR UPDATE`,
      params: [customerId]
    },
    // Insert transaction
    {
      text: `INSERT INTO xpoints.transactions (customer_id, tx_type, points, tx_description)
             VALUES ($1, $2, $3, $4) RETURNING id`,
      params: [customerId, txType, points, description]
    }
  ];
  
  // Add order items queries
  if (Array.isArray(items) && items.length > 0) {
    items.forEach(item => {
      queries.push({
        text: `INSERT INTO xpoints.order_items (tx_id, cat_item_id, unit_cnt, unit_points_price)
               VALUES ($1, $2, $3, $4)`,
        params: ['TX_ID_PLACEHOLDER', item.item_id || item.id, item.quantity, item.points_price]
      });
    });
  }
  
  // Update balance
  queries.push({
    text: `UPDATE xpoints.points_balances 
           SET points_balance = points_balance + $2 
           WHERE customer_id = $1`,
    params: [customerId, points]
  });
  
  try {
    const results = await db.transaction(queries);
    
    // Check balance from first query
    const currentBalance = results[0][0]?.points_balance || 0;
    if (points < 0 && currentBalance < Math.abs(points)) {
      throw new Error(`Insufficient points. Available: ${currentBalance}, Required: ${Math.abs(points)}`);
    }
    
    const txId = results[1][0]?.id;
    if (!txId) {
      throw new Error('Failed to create transaction');
    }
    
    return { success: true, txId, previousBalance: currentBalance };
  } catch (error) {
    console.error('Transaction with balance check failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getPoints,
  getBalance: getPoints,
  getTransactions,
  getTransaction,
  getTransactionById: getTransaction,
  createTransaction,
  createTransactionWithBalanceCheck
};