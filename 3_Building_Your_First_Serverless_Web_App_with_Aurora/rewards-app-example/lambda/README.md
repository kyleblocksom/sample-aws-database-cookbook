# Xanadu Rewards Application Lambda Functions

This directory contains Lambda functions for the Xanadu Rewards Application.

## Topics

- [Lambda Functions Overview](#lambda-functions-overview)
- [CloudFormation Custom Resource Support](#cloudformation-custom-resource-support)
- [Deployment Instructions](#deployment-instructions)
- [Rebuilding the Packages](#rebuilding-the-packages)
- [Benefits of Using Lambda Layers](#benefits-of-using-lambda-layers)
- [Troubleshooting](#troubleshooting)

## Lambda Functions Overview

### 1. Lambda Layer
- **File**: `lambda-layer.zip` (163KB)
- **Purpose**: Shared dependencies for Lambda functions
- **Contents**: PostgreSQL client library (pg) and cfn-response module

### 2. DB Init Function
- **File**: `db-init-function.zip` (2.4KB)
- **Purpose**: Initializes the database schema and loads data from S3
- **Dependencies**: Uses Lambda layer for PostgreSQL client and cfn-response

### 3. Image Processor Function
- **File**: `image-processor-function.zip` (1.3KB)
- **Purpose**: Generates presigned URLs for images stored in S3
- **Dependencies**: Uses Lambda layer for PostgreSQL client and cfn-response

### 4. CORS Lambda Function
- **File**: `cors-lambda.zip` (1.5KB)
- **Purpose**: Enables CORS for API Gateway resources
- **Dependencies**: None (uses AWS SDK provided by Lambda runtime)

### 5. API Lambda Function
- **File**: `xanadu-app-lambda-functions.zip` (240KB)
- **Purpose**: Main API handlers for the Xanadu Rewards Application
- **Contents**: API endpoints for products, points, customers, categories, and cart operations

## CloudFormation Custom Resource Support

The Lambda functions now include proper CloudFormation custom resource response handling:

1. **cfn-response Module**: Added to the Lambda Layer for shared use
2. **Custom Resource Detection**: Functions detect when called as CloudFormation custom resources
3. **Response Handling**: Proper SUCCESS/FAILED responses sent back to CloudFormation
4. **Delete Event Handling**: Clean handling of CloudFormation stack deletion

## Deployment Instructions

### 1. Upload to S3

Upload all Lambda packages to your S3 bucket:

```bash
# Upload Lambda Layer
aws s3 cp lambda-layer.zip s3://your-bucket-name/lambda-code/lambda-layer.zip

# Upload DB Init Function
aws s3 cp db-init-function.zip s3://your-bucket-name/lambda-code/db-init-function.zip

# Upload Image Processor Function
aws s3 cp image-processor-function.zip s3://your-bucket-name/lambda-code/image-processor-function.zip

# Upload CORS Lambda Function
aws s3 cp cors-lambda.zip s3://your-bucket-name/lambda-code/cors-lambda.zip

# Upload API Lambda Function
aws s3 cp xanadu-app-lambda-functions.zip s3://your-bucket-name/lambda-code/xanadu-app-lambda-functions.zip
```

Replace `your-bucket-name` with your actual S3 bucket name (the value of the `S3BucketName` parameter in your CloudFormation template).

### 2. CloudFormation Configuration

The CloudFormation template should be configured with the following parameters:

```yaml
Parameters:
  LambdaCodeS3Key:
    Description: S3 key for the API Lambda function code ZIP file
    Type: String
    Default: lambda-code/xanadu-app-lambda-functions.zip
    
  LambdaLayerS3Key:
    Description: S3 key for the Lambda layer ZIP file
    Type: String
    Default: lambda-code/lambda-layer.zip

  LambdaDBInitCodeS3Key:
    Description: S3 key for the DB Init Lambda function code ZIP file
    Type: String
    Default: lambda-code/db-init-function.zip
    
  LambdaImageUrlCodeS3Key:
    Description: S3 key for the Image Processor Lambda function code ZIP file
    Type: String
    Default: lambda-code/image-processor-function.zip
    
  LambdaCorsCodeS3Key:
    Description: S3 key for the CORS Lambda function code ZIP file
    Type: String
    Default: lambda-code/cors-lambda.zip
```

### 3. Lambda Layer Configuration

The Lambda functions should be configured to use the Lambda layer:

```yaml
# Lambda Layer for shared dependencies
LambdaDependenciesLayer:
  Type: AWS::Lambda::LayerVersion
  Properties:
    LayerName: !Sub ${AWS::StackName}-${EnvironmentName}-dependencies-layer
    Description: Layer containing shared dependencies for Lambda functions
    Content:
      S3Bucket: !Ref S3BucketName
      S3Key: lambda-code/lambda-layer.zip
    CompatibleRuntimes:
      - nodejs16.x

# DB Init Function
DBInitFunction:
  Type: AWS::Lambda::Function
  Properties:
    # ... other properties ...
    Code:
      S3Bucket: !Ref S3BucketName
      S3Key: lambda-code/db-init-function.zip
    Layers:
      - !Ref LambdaDependenciesLayer

# Image Processor Function
ImageProcessorFunction:
  Type: AWS::Lambda::Function
  Properties:
    # ... other properties ...
    Code:
      S3Bucket: !Ref S3BucketName
      S3Key: lambda-code/image-processor-function.zip
    Layers:
      - !Ref LambdaDependenciesLayer
```

### 4. Custom Resource Configuration

Configure the custom resources to use the Lambda functions:

```yaml
# Custom resource to trigger database initialization
DBInitInvoke:
  Type: Custom::DBInit
  DependsOn:
    - DBInstanceWriter
    - DBInstanceReader
  Properties:
    ServiceToken: !GetAtt DBInitFunction.Arn
    Region: !Ref AWS::Region

# Custom resource to trigger image processing
ImageProcessorInvoke:
  Type: Custom::ImageProcessor
  DependsOn:
    - DBInitInvoke
  Properties:
    ServiceToken: !GetAtt ImageProcessorFunction.Arn
    Region: !Ref AWS::Region
```

## Rebuilding the Packages

### Lambda Layer

```bash
cd lambda-layer
# Edit dependencies as needed
npm install
cd ..
zip -r lambda-layer.zip nodejs
```

### DB Init Function

```bash
cd db-init-function
# Edit code as needed
cd ..
zip -r db-init-function.zip index.js
```

### Image Processor Function

```bash
cd image-processor-function
# Edit code as needed
cd ..
zip -r image-processor-function.zip index.js
```

### CORS Lambda Function

```bash
# Edit cors-lambda.js as needed
zip -r cors-lambda.zip cors-lambda.js
```

### API Lambda Function

```bash
cd xanadu-app-lambda-functions
# Edit code as needed
npm install
cd ..
zip -r xanadu-app-lambda-functions.zip src config node_modules package.json
```

## Benefits of Using Lambda Layers

1. **Reduced Package Sizes**: Function packages are much smaller (1-2KB)
2. **Easier Maintenance**: Shared dependencies are managed in one place
3. **Faster Deployments**: Smaller packages deploy faster
4. **Cost Savings**: Reduced cold start times and less storage used

## Troubleshooting

### CloudFormation Custom Resource Issues

If you encounter issues with CloudFormation custom resources:

1. **Check CloudWatch Logs**: Look for error messages in the Lambda function logs
2. **Verify IAM Permissions**: Ensure the Lambda execution role has necessary permissions
3. **Check Response Format**: Ensure the cfn-response module is correctly sending responses
4. **Timeout Issues**: Increase the Lambda function timeout if operations take too long

## Next Steps

🎉 **Great work!** You've completed this important section and gained valuable Aurora expertise.

**Ready to continue?** Let's advance to [scripts](../scripts) and keep building your Aurora mastery!

## Learn More

- [Serverless Application Lens - Well-Architected guidance for serverless workloads](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/)
- [Aurora Serverless v2 Workshop - Build auto-scaling serverless database applications](https://catalog.workshops.aws/aurora-serverless-v2/en-US)
- [Serverless Web Applications Workshop - End-to-end serverless application development](https://webapp.serverlessworkshops.io/)
- [Aurora Serverless v2 Guide - Automatic scaling database for variable workloads](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
