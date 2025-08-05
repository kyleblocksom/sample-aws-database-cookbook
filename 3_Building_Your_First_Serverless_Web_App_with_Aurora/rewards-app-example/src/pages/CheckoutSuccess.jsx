import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('checkout.success.orderSuccessful')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('checkout.success.thankYou')}
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link 
            to="/transactions" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            {t('checkout.success.viewOrderHistory')}
          </Link>
          <Link 
            to="/products" 
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('checkout.success.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;