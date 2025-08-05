// Standard response format for API Gateway
const formatResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': true,
      ...headers
    },
    body: JSON.stringify(body)
  };
};

// Success response (200 OK)
const success = (data) => formatResponse(200, data);

// Created response (201 Created)
const created = (data) => formatResponse(201, data);

// No content response (204 No Content)
const noContent = () => ({
  statusCode: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,username',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': true
  }
});

// Bad request response (400 Bad Request)
const badRequest = (message = 'Bad Request') => 
  formatResponse(400, { error: message });

// Not found response (404 Not Found)
const notFound = (message = 'Resource not found') => 
  formatResponse(404, { error: message });

// Server error response (500 Internal Server Error)
const serverError = (error) => {
  console.error('Server error:', error);
  return formatResponse(500, { 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = {
  formatResponse,
  success,
  created,
  noContent,
  badRequest,
  notFound,
  serverError
};