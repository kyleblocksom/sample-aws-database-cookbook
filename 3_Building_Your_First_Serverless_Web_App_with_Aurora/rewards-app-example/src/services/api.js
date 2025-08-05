import axios from 'axios';
import { Auth } from 'aws-amplify';

const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
const apiKey = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Add interceptor to add authentication token and API key to requests
api.interceptors.request.use(
  async (config) => {
    // Add API key for all requests
    if (apiKey) {
      config.headers['X-Api-Key'] = apiKey;
    }
    
    try {
      // Get current authenticated user first
      const user = await Auth.currentAuthenticatedUser({ bypassCache: true });
      
      // Retry logic for session retrieval
      let session = null;
      let retries = 3;
      
      while (retries > 0 && !session) {
        try {
          session = await Auth.currentSession();
          if (session && session.isValid()) {
            break;
          }
        } catch (sessionError) {
          console.log(`Session attempt failed, retries left: ${retries - 1}`);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      if (session && session.isValid()) {
        // Get ID token (contains user identity)
        const idToken = session.getIdToken().getJwtToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } else {
        console.log('⚠️ Session is invalid or expired after retries');
      }
    } catch (error) {
      console.log('⚠️ Auth error:', error.code || error.name, '-', error.message);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Products API - public endpoints
export const getProducts = async () => {
  try {
    const response = await api.get('/prod/products');
    // Ensure products is always an array
    return {
      products: Array.isArray(response.data.products) ? response.data.products : []
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array on error
    return { products: [] };
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/prod/products/${id}`);
    
    // Ensure we have a valid product object
    if (response.data && response.data.product) {
      return response.data;
    } else {
      console.error('Invalid product data structure:', response.data);
      return { product: null };
    }
  } catch (error) {
    console.error('Error fetching product:', id, error);
    return { product: null };
  }
};

export const getProductsByCategory = async (category) => {
  try {
    const response = await api.get(`/category/${category}`);
    // Ensure products is always an array
    return {
      products: Array.isArray(response.data.products) ? response.data.products : []
    };
  } catch (error) {
    console.error('Error fetching products in category:', category, error);
    // Return empty array on error
    return { products: [] };
  }
};

export const getProductCategories = async () => {
  try {
    const response = await api.get('/prod/products/categories');
    // Ensure categories is always an array
    return {
      categories: Array.isArray(response.data.categories) ? response.data.categories : []
    };
  } catch (error) {
    console.error('Error fetching product categories:', error);
    // Return empty array on error
    return { categories: [] };
  }
};

// Categories API - public endpoint
export const getCategories = async () => {
  try {
    const response = await api.get('/prod/category');
    // Ensure categories is always an array
    return {
      categories: Array.isArray(response.data.categories) ? response.data.categories : []
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array on error
    return { categories: [] };
  }
};

// Customer API - protected endpoint
export const getCustomer = async () => {
  try {
    const response = await api.get('/customer');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // User is not authenticated, return empty data
      return { customer: null };
    }
    console.error('Error fetching customer:', error);
    throw error;
  }
};

// Points API - public read, protected write
export const getPoints = async () => {
  try {
    const response = await api.get('/prod/points');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // User is not authenticated, return empty data
      return { points: 0 };
    }
    console.error('Error fetching points:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const response = await api.get('/prod/points/tx');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // User is not authenticated, return empty data
      return { transactions: [] };
    }
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransaction = async (id) => {
  try {
    const response = await api.get(`/prod/points/tx/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', id, error);
    throw error;
  }
};

export const createTransaction = async (data) => {
  try {
    const response = await api.post('/prod/points/tx', data);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Cart API - all protected
export const getCart = async () => {
  try {
    const response = await api.get('/prod/cart');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // User is not authenticated, return empty cart
      return { items: [] };
    }
    console.error('Error fetching cart:', error);
    throw error;
  }
};

export const addToCart = async (data) => {
  try {
    const response = await api.post('/prod/cart/item', data);
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

export const removeFromCart = async (itemId) => {
  try {
    const response = await api.delete(`/prod/cart/item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing item from cart:', itemId, error);
    throw error;
  }
};

export const clearCart = async () => {
  try {
    const response = await api.delete('/prod/cart/item');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

export const deleteCart = async () => {
  try {
    const response = await api.delete('/prod/cart');
    return response.data;
  } catch (error) {
    console.error('Error deleting cart:', error);
    throw error;
  }
};

export const checkout = async (data) => {
  try {
    const response = await api.post('/prod/cart/checkout', data);
    return response.data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

export default api;