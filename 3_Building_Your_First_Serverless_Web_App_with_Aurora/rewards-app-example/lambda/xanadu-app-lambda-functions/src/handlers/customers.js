const Customer = require('../models/customer');
const { success, notFound, serverError } = require('../utils/response');
const { getCustomerId } = require('./auth');

// GET /customer
const getCustomer = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const customer = await Customer.getById(customerId);
    
    if (!customer) {
      return notFound('Customer not found');
    }
    
    // Format the response to match the front-end expectations
    const formattedCustomer = {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone_num,
      address: {
        street: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.postal_code
      }
    };
    
    return success(formattedCustomer);
  } catch (error) {
    return serverError(error);
  }
};

module.exports = {
  getCustomer
};