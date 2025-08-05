import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { setProducts, setCategories } from '../store/slices/productSlice';
import { getProducts, getProductCategories } from '../services/api';
import ProductGrid from '../components/products/ProductGrid';

const Products = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { category: urlCategory } = useParams();
  const allProducts = useSelector(state => state.products.allProducts);
  const categories = useSelector(state => state.products.categories);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (allProducts.length > 0) {
        setFilteredProducts(allProducts);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getProducts();
        // Ensure data.products is an array
        const products = Array.isArray(data.products) ? data.products : [];
        dispatch(setProducts(products));
        setFilteredProducts(products);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [dispatch, allProducts]);
  
  // Add a separate effect to fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getProductCategories();
        if (data && Array.isArray(data.categories)) {
          dispatch(setCategories(data.categories));
        } else {
          console.error('Invalid categories data structure:', data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, [dispatch]);
  
  // Update selected category when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory || 'all');
  }, [urlCategory]);
  
  useEffect(() => {
    // Ensure allProducts is an array before spreading
    const productsArray = Array.isArray(allProducts) ? allProducts : [];
    let result = [...productsArray];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, searchTerm, allProducts]);
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {urlCategory ? `${urlCategory} Products` : t('products.list.allProducts')}
      </h1>
      
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('products.list.searchProducts')}
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or description"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="w-full md:w-1/2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('products.list.filterByCategory')}
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('products.list.allCategories')}</option>
            {Array.isArray(categories) && categories.map((category, index) => (
              <option key={index} value={typeof category === 'string' ? category : category.category}>
                {typeof category === 'string' ? category : category.category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            {t('common.ui.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>
          
          <ProductGrid products={filteredProducts} loading={loading} />
        </>
      )}
    </div>
  );
};

export default Products;