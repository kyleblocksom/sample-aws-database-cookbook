import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Cart from '../cart/Cart';
import { useSelector } from 'react-redux';

const Layout = ({ children }) => {
  const cartOpen = useSelector(state => state.cart.cartOpen);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      {cartOpen && <Cart />}
    </div>
  );
};

export default Layout;