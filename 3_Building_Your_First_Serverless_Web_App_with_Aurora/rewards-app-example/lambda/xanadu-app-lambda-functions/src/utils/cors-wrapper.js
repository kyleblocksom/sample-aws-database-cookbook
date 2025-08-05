/**
 * CORS wrapper for Lambda handlers
 * Ensures all responses include proper CORS headers
 */
exports.corsWrapper = (handler) => {
  return async (event, context) => {
    try {
      // Call the original handler
      const response = await handler(event, context);
      
      // Add CORS headers to the response if they don't exist
      if (!response.headers) {
        response.headers = {};
      }
      
      // Ensure all required CORS headers are present
      response.headers['Access-Control-Allow-Origin'] = '*';
      response.headers['Access-Control-Allow-Headers'] = 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username';
      response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
      
      return response;
    } catch (error) {
      // Handle errors with CORS headers
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ error: error.message })
      };
    }
  };
};