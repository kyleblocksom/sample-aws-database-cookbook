import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-bold mb-4">{t('footer.branding.xanadu')}</h2>
            <p className="text-gray-400">{t('footer.branding.tagline')}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('footer.navigation.shop')}</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-gray-400 hover:text-white">{t('footer.navigation.allProducts')}</Link></li>
                <li><Link to="/categories" className="text-gray-400 hover:text-white">{t('footer.navigation.categories')}</Link></li>
                <li><Link to="/points" className="text-gray-400 hover:text-white">{t('footer.navigation.points')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('footer.navigation.account')}</h3>
              <ul className="space-y-2">
                <li><Link to="/account" className="text-gray-400 hover:text-white">{t('footer.navigation.myProfile')}</Link></li>
                <li><Link to="/transactions" className="text-gray-400 hover:text-white">{t('footer.navigation.orderHistory')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('footer.support.support')}</h3>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-gray-400 hover:text-white">{t('footer.support.faq')}</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">{t('footer.support.contactUs')}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy;  {new Date().getFullYear()} {t('footer.branding.xanadu')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;