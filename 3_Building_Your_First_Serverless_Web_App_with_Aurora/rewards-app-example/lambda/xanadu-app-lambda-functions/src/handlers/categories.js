const Product = require('../models/product');
const { success, notFound, serverError } = require('../utils/response');

// GET /prod/category
const getCategories = async (event) => {
  try {
    const categories = await Product.getCategories();
    return success(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return serverError(error);
  }
};

// GET /category/{category}
const getProductsByCategory = async (event) => {
  try {
    const { category } = event.pathParameters || {};
    
    if (!category) {
      console.error('Category parameter is missing');
      return notFound('Category is required');
    }
    
    console.log('Fetching products for category:', category);
    const products = await Product.getByCategory(category);
    
    // Log the result for debugging
    console.log('Products found for category:', category, JSON.stringify(products));
    
    return success(products);
  } catch (error) {
    console.error('Error fetching products for category:', event.pathParameters?.category, error);
    return serverError(error);
  }
};

module.exports = {
  getCategories,
  getProductsByCategory
};