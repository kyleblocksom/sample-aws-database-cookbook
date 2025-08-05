const db = require('../utils/db');

const getCustomer = async (username) => {
  // Try to find customer by username or email
  const query = `
    SELECT *
    FROM xpoints.customers
    WHERE username = $1 OR email = $1
  `;
  
  try {
    const result = await db.query(query, [username]);
    return { 
      customer: Array.isArray(result) && result.length > 0 ? result[0] : null 
    };
  } catch (error) {
    console.error('Error fetching customer:', { username, error: error.message });
    return { customer: null };
  }
};

const getById = async (customerId) => {
  const query = `
    SELECT *
    FROM xpoints.customers
    WHERE id = $1
  `;
  
  try {
    const result = await db.query(query, [customerId]);
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching customer by ID:', { customerId, error: error.message });
    return null;
  }
};

const createCustomer = async (email, firstName, lastName) => {
  const query = `
    INSERT INTO xpoints.customers (username, email, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [email, email, firstName, lastName]);
    const customer = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    if (customer) {
      // Initialize points balance for new customer
      await db.query(
        'INSERT INTO xpoints.points_balances (customer_id, points_balance) VALUES ($1, $2)',
        [customer.id, 1000] // Give new customers 1000 points
      );
    }
    
    return customer;
  } catch (error) {
    console.error('Error creating customer:', { email, error: error.message });
    throw error;
  }
};

module.exports = {
  getCustomer,
  getByUsername: getCustomer,
  getById,
  createCustomer
};