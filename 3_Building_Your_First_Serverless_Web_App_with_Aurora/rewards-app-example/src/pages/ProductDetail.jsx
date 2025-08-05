import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addToCart } from '../store/slices/cartSlice';
import { updateModal } from '../store/slices/authSlice';
import { getProductById } from '../services/api';

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        
        // Check if data has the expected structure
        if (data && data.product) {
          setProduct(data.product);
        } else {
          console.error('Invalid product data structure:', data);
          setError('Product data is in an unexpected format');
        }
      } catch (err) {
        setError('Failed to load product details. Please try again later.');
        console.error('Error fetching product:', id, err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleAddToCart = () => {
    if (!isLoggedIn) {
      dispatch(updateModal(true));
      return;
    }
    
    dispatch(addToCart(product));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <button 
          onClick={() => navigate('/products')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          {t('common.navigation.backToProducts')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/products')}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('common.navigation.backToProducts')}
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-gray-400">{t('common.ui.noImageAvailable')}</div>
              )}
            </div>
          </div>
          
          <div className="p-8 md:w-1/2">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{product.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.category}</p>
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{product.points_price} {t('common.ui.points')}</span>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-6 pt-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('products.detail.description')}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors duration-300 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('products.detail.addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;