const Product = require('../models/product');
const { success, notFound, serverError } = require('../utils/response');

// GET /prod/products
const getProducts = async (event) => {
  try {
    const products = await Product.getAll();
    return success(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return serverError(error);
  }
};

// GET /prod/products/{item_id}
const getProductById = async (event) => {
  try {
    const { item_id } = event.pathParameters || {};
    
    if (!item_id) {
      console.error('Product ID is missing in request');
      return notFound('Product ID is required');
    }
    
    console.log('Fetching product with ID:', item_id);
    const result = await Product.getById(item_id);
    
    console.log('Product query result:', JSON.stringify(result));
    
    if (!result || !result.product) {
      console.error('Product with ID not found:', item_id);
      return notFound(`Product with ID ${item_id} not found`);
    }
    
    return success(result);
  } catch (error) {
    console.error('Error fetching product:', event.pathParameters?.item_id, error);
    return serverError(error);
  }
};

// GET /prod/products/categories
const getProductCategories = async (event) => {
  try {
    const categories = await Product.getCategories();
    return success(categories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return serverError(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductCategories
};