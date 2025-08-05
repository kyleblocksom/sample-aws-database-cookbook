import React from 'react';
import { useTranslation } from 'react-i18next';

// First, let's update the translation files to include language names
// We'll need to add these to the en.json and es.json files
// "language": {
//   "english": "EN",
//   "spanish": "ES"
// }

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div className="flex space-x-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${
          i18n.language === 'en' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        {t('language.selector.english', 'EN')}
      </button>
      <button 
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 text-sm rounded ${
          i18n.language === 'es' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        {t('language.selector.spanish', 'ES')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;