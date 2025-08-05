import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';

import { useAuth } from './hooks/useAuth';

// NotFoundPage component with internationalization
const NotFoundPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h1 className="text-3xl font-bold mb-4">{t('error.general.pageNotFound')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t('error.general.pageNotExist')}</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
        {t('common.navigation.goHome')}
      </a>
    </div>
  );
};

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import Account from './pages/Account';
import Points from './pages/Points';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import CheckoutSuccess from './pages/CheckoutSuccess';

const App = () => {
  const modalOpen = useSelector(state => state.auth.modalOpen);
  useAuth(); // Check authentication state on app load
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/category/:category" element={<Products />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route path="/account" element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } />
          <Route path="/points" element={
            <ProtectedRoute>
              <Points />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/transactions/:id" element={
            <ProtectedRoute>
              <TransactionDetail />
            </ProtectedRoute>
          } />
          <Route path="/checkout-success" element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={
            <NotFoundPage />
          } />
        </Routes>
        
        {modalOpen && <AuthModal />}
      </Layout>
    </Router>
  );
};

export default App;