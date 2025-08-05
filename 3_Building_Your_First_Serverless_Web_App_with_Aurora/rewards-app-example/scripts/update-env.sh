#!/bin/bash
# update-env.sh

# Get current AWS region or use default
DEFAULT_REGION=$(aws configure get region || echo "us-east-1")

# Get CloudFormation outputs
STACK_NAME=${1:-"rewards-app-example"}
REGION=${2:-$DEFAULT_REGION}

echo "Using region: $REGION"

# Get CloudFormation outputs with region parameter
echo "Retrieving CloudFormation outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text 2>/dev/null)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text 2>/dev/null)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text 2>/dev/null)
API_KEY_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiKey'].OutputValue" --output text 2>/dev/null)

# Get the actual API key value
if [ -n "$API_KEY_ID" ] && [ "$API_KEY_ID" != "None" ]; then
    API_KEY=$(aws apigateway get-api-key --api-key "$API_KEY_ID" --include-value --region "$REGION" --query "value" --output text 2>/dev/null)
else
    API_KEY=""
fi

# Validate outputs
if [ -z "$API_ENDPOINT" ] || [ "$API_ENDPOINT" = "None" ]; then
    echo "Error: Could not retrieve API endpoint"
    exit 1
fi

if [ -z "$USER_POOL_ID" ] || [ "$USER_POOL_ID" = "None" ]; then
    echo "Error: Could not retrieve User Pool ID"
    exit 1
fi

if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "None" ]; then
    echo "Error: Could not retrieve Client ID"
    exit 1
fi

if [ -z "$API_KEY" ] || [ "$API_KEY" = "None" ]; then
    echo "Error: Could not retrieve API Key"
    exit 1
fi

# Update .env file
cat > .env << EOF
VITE_BASE_URL=$API_ENDPOINT
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_CLIENT_ID=$CLIENT_ID
VITE_REGION=$REGION
VITE_API_KEY=$API_KEY
EOF

echo "✓ Successfully updated .env file with CloudFormation outputs:"
echo "VITE_BASE_URL=$API_ENDPOINT"
echo "VITE_USER_POOL_ID=$USER_POOL_ID"
echo "VITE_CLIENT_ID=$CLIENT_ID"
echo "VITE_REGION=$REGION"
echo "VITE_API_KEY=$API_KEY"
echo ""
echo "Environment file is ready for frontend build!"