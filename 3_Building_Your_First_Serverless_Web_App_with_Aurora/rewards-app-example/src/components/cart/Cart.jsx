import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setCartState, removeFromCart, addToCart, reduceFromCart, emptyCart } from '../../store/slices/cartSlice';
import { checkout, addToCart as addToCartAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(state => state.cart.cartItems);
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const [error, setError] = React.useState(null);
  
  const closeCart = () => {
    dispatch(setCartState(false));
  };
  
  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };
  
  const handleIncreaseQuantity = (item) => {
    dispatch(addToCart(item));
  };
  
  const handleDecreaseQuantity = (id) => {
    dispatch(reduceFromCart(id));
  };
  
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.points_price * (item.quantity || 1));
    }, 0);
  };
  
  const handleCheckout = async () => {
    if (!isLoggedIn) {
      dispatch(setCartState(false));
      navigate('/signin');
      return;
    }
    
    try {
      // Sync cart items to backend before checkout
      for (const item of cartItems) {
        await addToCartAPI({ id: item.id, quantity: item.quantity });
      }
      
      const result = await checkout();
      
      if (result.success) {
        dispatch(emptyCart());
        dispatch(setCartState(false));
        navigate('/checkout-success');
      } else {
        if (result.error && result.error.includes('Insufficient points')) {
          dispatch(setCartState(false));
          navigate('/points');
        } else {
          setError(result.error || 'Checkout failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      setError('Checkout failed. Please try again.');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-[#0000007d] z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('cart.header.yourCart')}</h2>
          <button 
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                  ×
                </button>
              </div>
            </div>
          )}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <img src="/emptyCart.png" alt="Empty Cart" className="w-32 h-32 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">{t('cart.header.emptyCart')}</p>
              <button 
                onClick={closeCart}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                {t('cart.header.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {t('common.ui.noImageAvailable')}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium text-gray-800 dark:text-white">{item.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400">{item.points_price} {t('common.ui.points')}</p>
                    <div className="flex items-center mt-2">
                      <button 
                        onClick={() => handleDecreaseQuantity(item.id)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-l"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300 dark:border-gray-600">
                        {item.quantity || 1}
                      </span>
                      <button 
                        onClick={() => handleIncreaseQuantity(item)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-r"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-auto text-red-500 hover:text-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-4">
              <span className="font-medium text-gray-800 dark:text-white">{t('cart.checkout.totalPoints')}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400"> {calculateTotal()} {t('common.ui.points')}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              {t('cart.checkout.checkout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;