const db = require('../utils/db');

const getCart = async (customerId) => {
  const query = `
    SELECT c.customer_id, c.item_id, c.quantity, p.name, p.description, p.points_price, p.usd_price, 
           COALESCE(MIN(i.presigned_url), '') as image_url
    FROM xpoints.shopping_cart_items c
    JOIN xpoints.catalog_items p ON c.item_id = p.id
    LEFT JOIN xpoints.catalog_images ci ON p.id = ci.item_id
    LEFT JOIN xpoints.images img ON ci.image_id = img.id
    LEFT JOIN xpoints.image_urls i ON img.id = i.image_id AND i.region = $2
    WHERE c.customer_id = $1
    GROUP BY c.customer_id, c.item_id, c.quantity, p.name, p.description, p.points_price, p.usd_price
    ORDER BY c.item_id
  `;
  
  try {
    const result = await db.query(query, [customerId, process.env.REGION || 'us-east-1']);
    console.log('Cart items for customer:', customerId, 'Count:', result?.length);
    result?.forEach((item, index) => {
      console.log(`Cart item ${index + 1}:`, {
        item_id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        points_price: item.points_price,
        total: item.quantity * item.points_price
      });
    });
    return { items: Array.isArray(result) ? result : [] };
  } catch (error) {
    console.error('Error getting cart:', error);
    return { items: [] };
  }
};

const addItem = async (customerId, itemId, quantity) => {
  const query = `
    INSERT INTO xpoints.shopping_cart_items (customer_id, item_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (customer_id, item_id) DO UPDATE
    SET quantity = xpoints.shopping_cart_items.quantity + $3
    RETURNING *
  `;
  
  try {
    console.log('Adding item to cart:', { customerId, itemId, quantity });
    const result = await db.query(query, [customerId, itemId, quantity]);
    console.log('Item added/updated, result:', result?.[0]);
    return { 
      success: true, 
      item: Array.isArray(result) && result.length > 0 ? result[0] : null 
    };
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return { success: false, error: error.message };
  }
};

const removeItem = async (customerId, itemId) => {
  const deleteQuery = `DELETE FROM xpoints.shopping_cart_items WHERE customer_id = $1 AND item_id = $2 RETURNING *`;
  
  try {
    console.log('Removing item from cart:', { customerId, itemId });
    const result = await db.query(deleteQuery, [customerId, itemId]);
    console.log('Item removed, rows affected:', result?.length);
    
    return { 
      success: true, 
      item: Array.isArray(result) && result.length > 0 ? result[0] : null 
    };
  } catch (error) {
    console.error('Error removing item:', error);
    return { success: false, error: error.message };
  }
};

const clearCart = async (customerId) => {
  const query = `
    DELETE FROM xpoints.shopping_cart_items
    WHERE customer_id = $1
    RETURNING *
  `;
  
  try {
    console.log('Clearing cart for customer:', customerId);
    const result = await db.query(query, [customerId]);
    console.log('Cart cleared, items removed:', result?.length);
    return { 
      success: true, 
      count: Array.isArray(result) ? result.length : 0 
    };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: error.message };
  }
};

const checkout = async (customerId) => {
  try {
    // Get current balance for logging
    const Points = require('./points');
    const balance = await Points.getPoints(customerId);
    console.log('Current customer balance:', balance.points);
    
    // Get fresh cart items
    const cart = await getCart(customerId);
    if (!cart.items || cart.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }
    
    // Calculate total points needed
    const totalPoints = cart.items.reduce((sum, item) => sum + (item.points_price * item.quantity), 0);
    console.log('Checkout - Total points needed:', totalPoints);
    console.log('Cart calculation breakdown:');
    cart.items.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ${item.name} - ${item.quantity} x ${item.points_price} = ${item.quantity * item.points_price}`);
    });
    
    // Execute entire checkout in single atomic transaction
    const queries = [
      // Check and update balance with constraint
      {
        text: `UPDATE xpoints.points_balances 
               SET points_balance = points_balance - $2 
               WHERE customer_id = $1 AND points_balance >= $2
               RETURNING points_balance + $2 as previous_balance`,
        params: [customerId, totalPoints]
      },
      // Create transaction record
      {
        text: `INSERT INTO xpoints.transactions (customer_id, tx_type, points, tx_description)
               VALUES ($1, 'SPEND', $2, 'Spent points on purchase') RETURNING id`,
        params: [customerId, -totalPoints]
      }
    ];
    
    // Add order items
    cart.items.forEach(item => {
      queries.push({
        text: `INSERT INTO xpoints.order_items (tx_id, cat_item_id, unit_cnt, unit_points_price)
               VALUES ($1, $2, $3, $4)`,
        params: ['TX_ID_PLACEHOLDER', item.item_id, item.quantity, item.points_price]
      });
    });
    
    // Clear cart
    queries.push({
      text: `DELETE FROM xpoints.shopping_cart_items WHERE customer_id = $1`,
      params: [customerId]
    });
    
    const results = await db.transaction(queries);
    
    // Check if balance update succeeded
    if (!results[0] || results[0].length === 0) {
      return { success: false, error: `Insufficient points. Required: ${totalPoints}` };
    }
    
    const previousBalance = results[0][0].previous_balance;
    const txId = results[1][0]?.id;
    
    if (!txId) {
      throw new Error('Failed to create transaction');
    }
    
    console.log('Checkout completed successfully. Transaction ID:', txId);
    return { success: true, txId, totalPoints, previousBalance };
    
  } catch (error) {
    console.error('Checkout error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getCart,
  addItem,
  removeItem,
  clearCart,
  checkout
};