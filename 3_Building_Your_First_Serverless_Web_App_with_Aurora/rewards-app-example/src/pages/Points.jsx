import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPoints } from '../services/api';

const Points = () => {
  const { t } = useTranslation();
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setLoading(true);
        const data = await getPoints();
        setPoints(data);
      } catch (err) {
        setError('Failed to load points. Please try again later.');
        console.error('Error fetching points:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoints();
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
      <h1 className="text-2xl font-bold mb-6">{t('points.dashboard.yourPoints')}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {points?.points || 0}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{t('points.dashboard.availablePoints')}</p>
          </div>
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('points.dashboard.howToEarn')}</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete your profile information
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Refer friends to our platform
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Participate in our monthly challenges
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Follow us on social media
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Points;