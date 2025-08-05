import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getCustomer } from '../services/api';

const Account = () => {
  const { t } = useTranslation();
  const email = useSelector(state => state.auth.email);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const data = await getCustomer();
        setCustomer(data);
      } catch (err) {
        setError('Failed to load account information. Please try again later.');
        console.error('Error fetching customer:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          {t('common.ui.retry')}
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('account.header.yourAccount')}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {customer?.firstName?.charAt(0) || email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {customer ? `${customer.firstName} ${customer.lastName}` : 'User'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('account.header.personalInfo')}</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.email')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">{email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.firstName')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {customer?.firstName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.lastName')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {customer?.lastName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.phone')}</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {customer?.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {customer?.address && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('account.fields.address')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.street')}</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {customer.address.street || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.city')}</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {customer.address.city || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.state')}</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {customer.address.state || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.fields.zipCode')}</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {customer.address.zipCode || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;