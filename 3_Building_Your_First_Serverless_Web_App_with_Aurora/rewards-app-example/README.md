# Xanadu Rewards Application

This repository contains the code for the Xanadu Rewards Application, a full-stack serverless web application for redeeming points for products.

## Topics

- [Project Structure](#project-structure)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Security](#security)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## Project Structure

The project consists of two main parts:

### Frontend (`/src`)
React application built with:
- Vite
- React 18
- Redux Toolkit
- React Router v6
- AWS Amplify
- Tailwind CSS
- i18next for internationalization

### Backend (`/lambda`)
Serverless backend using:
- AWS Lambda
- Amazon API Gateway
- Amazon Aurora PostgreSQL Serverless v2
- Amazon RDS Proxy
- AWS Secrets Manager

```
rewards-app-example/
├── lambda/                  # Backend code
│   ├── xanadu-app-lambda-functions/
│   │   ├── src/            # Lambda function source code
│   │   │   ├── handlers/   # API handlers
│   │   │   ├── models/     # Database models
│   │   │   └── utils/      # Utilities
│   │   └── package.json
│   └── lambda-layer/       # Shared Lambda layer
├── src/                    # Frontend code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── i18n/              # Internationalization
│   ├── services/          # API services
│   └── store/             # Redux store
└── cfn/                   # CloudFormation templates
```

## Features

- **Authentication**: User authentication with Amazon Cognito
- **Product Management**: Browse and search products
- **Shopping Cart**: Add and manage items
- **Points System**: Redeem points for products
- **Internationalization**: Support for multiple languages
- **Responsive Design**: Works on all devices

## API Endpoints

### Public Endpoints
- `GET /prod/products`: List all products
- `GET /prod/products/{item_id}`: Get product details
- `GET /prod/products/categories`: Get all product categories
- `GET /prod/category`: List all categories
- `GET /category/{category}`: Get products by category
- `GET /prod/points`: Get points balance (public access)

### Protected Endpoints
- `GET /customer`: Get customer information
- `GET /prod/cart`: Get cart items
- `POST /prod/cart/item`: Add item to cart
- `DELETE /prod/cart/item/{item_id}`: Remove item from cart
- `DELETE /prod/cart/item`: Clear all cart items
- `DELETE /prod/cart`: Delete cart (alias for clear cart)
- `POST /prod/cart/checkout`: Process checkout
- `POST /prod/points/tx`: Create points transaction
- `GET /prod/points/tx`: Get transaction history
- `GET /prod/points/tx/{tx_id}`: Get transaction details

## Deployment

1. **Deploy Backend**:
   ```bash
   cd lambda/xanadu-app-lambda-functions
   npm install
   zip -r ../xanadu-app-lambda-functions.zip .
   ```

2. **Deploy Frontend**:
   ```bash
   npm install
   npm run build
   ```

3. **Deploy Infrastructure**:
   Follow the [Deployment Guide](./deployment-guide.ipynb) for CloudFormation deployment.

## Development

1. **Backend Development**:
   ```bash
   cd lambda/xanadu-app-lambda-functions
   npm install
   npm run test
   ```

2. **Frontend Development**:
   ```bash
   npm install
   npm run dev
   ```

## Testing

- Backend: Unit tests for Lambda functions
- Frontend: React Testing Library tests
- API Tests: Postman collection in `/tests`

## Security

- AWS IAM roles and policies
- API Gateway authorization
- Cognito user authentication
- RDS Proxy for connection security
- CORS configuration
- Input validation

## Monitoring

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway
- RDS Performance Insights
- AWS X-Ray tracing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.

## Next Steps

🎉 **Great work!** You've completed this important section and gained valuable Aurora expertise.

**Ready for the next challenge?** Continue with Section 4 to unlock new Aurora capabilities and expand your cloud expertise!

## Learn More

- [Serverless Application Lens - Well-Architected guidance for serverless workloads](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/)
- [Aurora Serverless v2 Workshop - Build auto-scaling serverless database applications](https://catalog.workshops.aws/aurora-serverless-v2/en-US)
- [Serverless Web Applications Workshop - End-to-end serverless application development](https://webapp.serverlessworkshops.io/)
- [Aurora Serverless v2 Guide - Automatic scaling database for variable workloads](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
