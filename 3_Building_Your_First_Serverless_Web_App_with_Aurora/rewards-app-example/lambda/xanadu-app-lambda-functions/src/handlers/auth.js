const Customer = require('../models/customer');
const { success, badRequest, serverError } = require('../utils/response');

// Extract username from event
const getUsernameFromEvent = (event) => {
  
  // Extract from Cognito claims (API Gateway integration)
  if (event.requestContext?.authorizer?.claims) {
    const claims = event.requestContext.authorizer.claims;
    const email = claims.email;
    const username = claims['cognito:username'] || claims.username;
    // Prioritize email for user identification
    if (email) return email;
    if (username) return username;
  }
  
  // Extract from JWT token in Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const chunks = token.split('.');
      
      if (chunks.length === 3) {
        // Add padding if needed for base64 decoding
        let payload = chunks[1];
        while (payload.length % 4) {
          payload += '=';
        }
        
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        
        // Validate token
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.error('Token expired');
          return null;
        }
        if (!decoded.iss || !decoded.iss.includes('cognito')) {
          console.error('Invalid Cognito token');
          return null;
        }
        
        return decoded.email || decoded.username || decoded['cognito:username'];
      }
    } catch (error) {
      console.error('JWT parsing error:', error.message);
    }
  }
  
  console.log('No username extracted from token');
  return null;
};

// Get customer ID from username
const getCustomerId = async (event) => {
  try {
    const username = getUsernameFromEvent(event);
    
    if (!username) {
      throw new Error('No auth token - user not signed in: undefined');
    }
    
    // Try to find customer by username or email
    const result = await Customer.getByUsername(username);
    let customer = result.customer;
    
    // If customer doesn't exist in database but user is authenticated, create them
    if (!customer) {
      console.log('Customer not found in database, creating new record for:', username);
      
      // Extract user info from JWT token
      let email = username;
      let firstName = 'User';
      let lastName = '';
      
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const chunks = token.split('.');
          if (chunks.length === 3) {
            let payload = chunks[1];
            while (payload.length % 4) {
              payload += '=';
            }
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            
            email = decoded.email || username;
            firstName = decoded.given_name || decoded.name || 'User';
            lastName = decoded.family_name || '';
          }
        } catch (error) {
          console.error('Error parsing JWT for user info:', error);
        }
      }
      
      // Create new customer record
      customer = await Customer.createCustomer(email, firstName, lastName);
      console.log('Created new customer:', customer.id);
    } else {
      console.log('Found existing customer:', customer.id);
    }
    
    return customer.id;
  } catch (error) {
    console.error('Error getting customer ID:', error);
    throw error;
  }
};

module.exports = {
  getUsernameFromEvent,
  getCustomerId
};