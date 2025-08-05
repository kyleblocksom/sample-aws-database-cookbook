import React from 'react';
import { useTranslation } from 'react-i18next';

const Error = ({ message, onRetry }) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-10">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-red-500 font-medium mb-4">{message || t('error.general.somethingWentWrong', 'Something went wrong')}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          {t('error.general.tryAgain')}
        </button>
      )}
    </div>
  );
};

export default Error;