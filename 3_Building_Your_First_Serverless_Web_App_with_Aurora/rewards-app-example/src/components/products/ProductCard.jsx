import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addToCart } from '../../store/slices/cartSlice';
import { updateModal } from '../../store/slices/authSlice';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      dispatch(updateModal(true));
      return;
    }
    
    dispatch(addToCart(product));
  };
  
  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{product.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="font-bold text-blue-600 dark:text-blue-400">{product.points_price} {t('common.ui.points')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors duration-300"
          >
            {t('products.detail.addToCart')}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;