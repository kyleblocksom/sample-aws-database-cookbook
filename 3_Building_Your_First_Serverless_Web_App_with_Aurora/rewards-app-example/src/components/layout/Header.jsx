import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import { doLogout } from '../../store/slices/authSlice';
import { setCartState, emptyCart } from '../../store/slices/cartSlice';
import LanguageSwitcher from '../LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const email = useSelector(state => state.auth.email);
  const cartItems = useSelector(state => state.cart.cartItems);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      dispatch(doLogout());
      dispatch(emptyCart());
    } catch (error) {
      console.error('Error signing out:', error);
      dispatch(doLogout());
      dispatch(emptyCart());
    }
    setProfileOpen(false);
  };

  const openCart = () => {
    dispatch(setCartState(true));
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-white">{t('header.branding.xanadu')}</Link>
        
        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">{t('header.navigation.home')}</Link>
          <Link to="/products" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">{t('header.navigation.products')}</Link>
          <Link to="/points" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">{t('header.navigation.myPoints')}</Link>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            <button 
              onClick={openCart} 
              className="relative text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-[25px] w-[25px] flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
            
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">{email.split('@')[0]}</span>
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('header.navigation.signedInAs')}</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{email}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        to="/account" 
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('header.navigation.account')}
                      </Link>
                      <Link 
                        to="/transactions" 
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('header.navigation.pastOrders')}
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('common.auth.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/signin" 
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t('common.auth.signIn')}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;