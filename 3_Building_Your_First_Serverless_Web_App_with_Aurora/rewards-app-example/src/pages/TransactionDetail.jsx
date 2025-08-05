import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTransaction } from '../services/api';

const TransactionDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const data = await getTransaction(id);
        setTransaction(data.transaction);
      } catch (err) {
        setError('Failed to load transaction details. Please try again later.');
        console.error('Error fetching transaction:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransaction();
  }, [id]);
  
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
        <Link 
          to="/transactions" 
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          {t('common.navigation.backToTransactions')}
        </Link>
      </div>
    );
  }
  
  if (!transaction) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">{t('transactiondetail.header.transactionNotFound')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('transactiondetail.header.transactionNotExist')}</p>
        <Link 
          to="/transactions" 
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          {t('common.navigation.backToTransactions')}
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('transactiondetail.header.transactionDetails')}</h1>
        <Link 
          to="/transactions" 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {t('common.navigation.backToTransactions')}
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">{t('transactiondetail.info.transactionInfo')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.transactionId')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.date')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {transaction.tx_dt ? new Date(transaction.tx_dt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.points')}</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{transaction.points || 0} {t('common.ui.points')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.type')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{transaction.tx_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.description')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{transaction.tx_description || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('transactiondetail.info.status')}</span>
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
                  {t('transactions.status.completed')}
                </span>
              </div>
            </div>
          </div>
          
          {(transaction.items?.length > 0 || transaction.product_name) && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t('transactiondetail.info.items')}</h2>
              <div className="space-y-4">
                {transaction.items?.length > 0 ? (
                  // Multiple items
                  transaction.items.map((item, index) => (
                    <div key={`${item.cat_item_id}-${index}`} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.product_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            {t('common.ui.noImageAvailable')}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.product_name}</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{item.unit_points_price || 0} {t('common.ui.points')}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        x{item.unit_cnt || 1}
                      </div>
                    </div>
                  ))
                ) : transaction.product_name ? (
                  // Single item (backward compatibility)
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                      {transaction.image_url ? (
                        <img 
                          src={transaction.image_url} 
                          alt={transaction.product_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t('common.ui.noImageAvailable')}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900 dark:text-white">{transaction.product_name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{transaction.unit_points_price || 0} {t('common.ui.points')}</p>
                      {transaction.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.description}</p>
                      )}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      x{transaction.unit_cnt || 1}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
        
        {/* Summary section for multiple items */}
        {transaction.items?.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('transactiondetail.info.totalItems')}: {transaction.items.length}
              </span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {t('transactiondetail.info.totalPoints')}: {Math.abs(transaction.points)} {t('common.ui.points')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetail;