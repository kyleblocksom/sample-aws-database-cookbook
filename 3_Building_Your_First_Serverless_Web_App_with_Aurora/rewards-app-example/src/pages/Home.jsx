import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProducts, getCategories } from '../services/api';
import ProductGrid from '../components/products/ProductGrid';
import Loading from '../components/common/Loading';
import Error from '../components/common/Error';

const Home = () => {
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch products
        const productsData = await getProducts();
        
        // Get featured products (first 4)
        if (productsData && productsData.products) {
          setFeaturedProducts(productsData.products.slice(0, 4));
        } else {
          setFeaturedProducts([]);
        }
        
        // Fetch categories
        const categoriesData = await getCategories();
        if (categoriesData && categoriesData.categories) {
          setCategories(categoriesData.categories);
        } else {
          setCategories([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setError('Failed to load home page data. Please try again later.');
        setLoading(false);
        
        // Set empty data to prevent UI errors
        setFeaturedProducts([]);
        setCategories([]);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <Loading message="Loading home page..." />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {error && <Error message={error} />}
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8 mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">{t('home.hero.welcome')}</h1>
        <p className="text-xl mb-6">{t('home.hero.welcomeSubtitle')}</p>
        <Link 
          to="/products" 
          className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition duration-300"
        >
          {t('home.hero.browseProducts')}
        </Link>
      </div>
      
      {/* Featured Products */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('home.products.featuredProducts')}</h2>
          <Link to="/products" className="text-blue-600 hover:underline">{t('home.products.viewAll')}</Link>
        </div>
        
        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <p className="text-gray-500 text-center py-8">{t('home.products.noFeaturedProducts')}</p>
        )}
      </div>
      
      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('home.products.shopByCategory')}</h2>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              // Use category name or fallback to the category itself if it's a string
              const categoryName = typeof category === 'object' ? category.name : category;
              // Generate a gradient color based on index
              const gradientColors = [
                'from-blue-400 to-blue-600',
                'from-purple-400 to-purple-600',
                'from-green-400 to-green-600',
                'from-red-400 to-red-600',
                'from-yellow-400 to-yellow-600',
                'from-indigo-400 to-indigo-600',
                'from-pink-400 to-pink-600',
                'from-teal-400 to-teal-600'
              ];
              const gradient = gradientColors[index % gradientColors.length];
              
              return (
                <Link 
                  key={typeof category === 'object' ? category.id || index : index} 
                  to={`/category/${categoryName}`}
                  className={`bg-gradient-to-br ${gradient} text-white rounded-lg p-8 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition duration-300 flex flex-col items-center justify-center min-h-[150px]`}
                >
                  <h3 className="text-xl font-bold mb-2">{categoryName}</h3>
                  {typeof category === 'object' && category.product_count && (
                    <p className="text-white text-opacity-90 mt-2">
                      {category.product_count} products
                    </p>
                  )}
                  <div className="mt-3 text-sm bg-white bg-opacity-30 px-3 py-1 rounded-full">
                    {t('home.products.shopNow')}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{t('home.products.noCategories')}</p>
        )}
      </div>
      
      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('home.features.howItWorks')}</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('home.features.shopProducts')}</h3>
            <p className="text-gray-600">{t('home.features.shopProductsDesc')}</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-2xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('home.features.earnPoints')}</h3>
            <p className="text-gray-600">{t('home.features.earnPointsDesc')}</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('home.features.redeemRewards')}</h3>
            <p className="text-gray-600">{t('home.features.redeemRewardsDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;