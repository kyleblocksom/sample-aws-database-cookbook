const { corsWrapper } = require('./utils/cors-wrapper');
const productsHandler = require('./handlers/products');
const categoriesHandler = require('./handlers/categories');
const customersHandler = require('./handlers/customers');
const pointsHandler = require('./handlers/points');
const cartHandler = require('./handlers/cart');
const { notFound, success } = require('./utils/response');

// Define explicitly which routes are public
const publicRoutes = [
  'GET /prod/products',
  'GET /prod/products/{item_id}',
  'GET /prod/products/categories',
  'GET /prod/category',
  'GET /category/{category}'
];

// Define which routes require authentication
const protectedRoutes = [
  'GET /customer',
  'GET /prod/points',
  'GET /prod/points/tx',
  'GET /prod/points/tx/{tx_id}',
  'POST /prod/points/tx',
  'GET /prod/cart',
  'POST /prod/cart/checkout',
  'POST /prod/cart/item',
  'DELETE /prod/cart',
  'DELETE /prod/cart/item',
  'DELETE /prod/cart/item/{item_id}'
];

// Route definitions
const routes = {
  // Products endpoints - public
  'GET /prod/products': productsHandler.getProducts,
  'GET /prod/products/{item_id}': productsHandler.getProductById,
  'GET /prod/products/categories': productsHandler.getProductCategories,
  
  // Points endpoints - GET requires auth for user-specific data, POST requires auth
  'GET /prod/points': pointsHandler.getPoints,
  'POST /prod/points/tx': pointsHandler.createTransaction,
  'GET /prod/points/tx/{tx_id}': pointsHandler.getTransaction,
  'GET /prod/points/tx': pointsHandler.getTransactions,
  
  // Customers endpoints - requires auth but handled in handler
  'GET /customer': customersHandler.getCustomer,
  
  // Categories endpoints - public
  'GET /prod/category': categoriesHandler.getCategories,
  'GET /category/{category}': categoriesHandler.getProductsByCategory,
  
  // Cart endpoints - all require auth
  'DELETE /prod/cart': cartHandler.deleteCart,
  'GET /prod/cart': cartHandler.getCart,
  'POST /prod/cart/checkout': cartHandler.checkout,
  'DELETE /prod/cart/item': cartHandler.clearCart,
  'POST /prod/cart/item': cartHandler.addItemToCart,
  'DELETE /prod/cart/item/{item_id}': cartHandler.removeItemFromCart,
  
  // Handle OPTIONS requests for CORS preflight
  'OPTIONS /prod/products': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /prod/products/{item_id}': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /prod/products/categories': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /prod/category': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /category/{category}': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /customer': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /prod/points': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  }),
  'OPTIONS /prod/cart': (event) => ({ 
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: '{}'
  })
};

// Main handler function wrapped with CORS
exports.handler = corsWrapper(async (event, context) => {
  // For debugging
  console.log('Event:', JSON.stringify(event));
  
  // Extract route key from event
  const routeKey = `${event.httpMethod} ${event.resource}`;
  console.log(`Route key: ${routeKey}`);
  
  // Find the appropriate handler for the route
  // Use Object.prototype.hasOwnProperty to safely check if the route exists
  if (!Object.prototype.hasOwnProperty.call(routes, routeKey)) {
    console.error(`Route not found: ${routeKey}`);
    return notFound(`Route not found: ${routeKey}`);
  }
  
  // For protected routes, check if user is authenticated
  if (protectedRoutes.includes(routeKey)) {
    const hasAuthHeader = event.headers?.Authorization || event.headers?.authorization;
    const hasCognitoClaims = event.requestContext?.authorizer?.claims;
    
    if (!hasAuthHeader && !hasCognitoClaims) {
      console.log(`Authentication required for route: ${routeKey}`);
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }
  }
  
  console.log('Processing route:', routeKey);
  
  // Call the handler with the event
  
  // Use a switch statement instead of dynamic property access
  switch (routeKey) {
    // Products endpoints
    case 'GET /prod/products':
      return productsHandler.getProducts(event);
    case 'GET /prod/products/{item_id}':
      return productsHandler.getProductById(event);
    case 'GET /prod/products/categories':
      return productsHandler.getProductCategories(event);
    
    // Points endpoints
    case 'GET /prod/points':
      return pointsHandler.getPoints(event);
    case 'POST /prod/points/tx':
      return pointsHandler.createTransaction(event);
    case 'GET /prod/points/tx/{tx_id}':
      return pointsHandler.getTransaction(event);
    case 'GET /prod/points/tx':
      return pointsHandler.getTransactions(event);
    
    // Customers endpoints
    case 'GET /customer':
      return customersHandler.getCustomer(event);
    
    // Categories endpoints
    case 'GET /prod/category':
      return categoriesHandler.getCategories(event);
    case 'GET /category/{category}':
      return categoriesHandler.getProductsByCategory(event);
    
    // Cart endpoints
    case 'DELETE /prod/cart':
      return cartHandler.deleteCart(event);
    case 'GET /prod/cart':
      return cartHandler.getCart(event);
    case 'POST /prod/cart/checkout':
      return cartHandler.checkout(event);
    case 'DELETE /prod/cart/item':
      return cartHandler.clearCart(event);
    case 'POST /prod/cart/item':
      return cartHandler.addItemToCart(event);
    case 'DELETE /prod/cart/item/{item_id}':
      return cartHandler.removeItemFromCart(event);
    
    // OPTIONS requests for CORS
    case 'OPTIONS /prod/products':
    case 'OPTIONS /prod/products/{item_id}':
    case 'OPTIONS /prod/products/categories':
    case 'OPTIONS /prod/category':
    case 'OPTIONS /category/{category}':
    case 'OPTIONS /customer':
    case 'OPTIONS /prod/points':
    case 'OPTIONS /prod/cart':
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: '{}'
      };
      
    default:
      console.error('Route not found in routes object:', routeKey);
      return notFound(`Route not found: ${routeKey}`);
  }
});