// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const https = require("https");
const url = require("url");
const { APIGatewayClient, GetResourcesCommand, PutMethodCommand, PutIntegrationCommand, PutIntegrationResponseCommand, PutMethodResponseCommand } = require('@aws-sdk/client-api-gateway');

// Response object for CloudFormation custom resources
const response = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  
  send: function(event, context, responseStatus, responseData) {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: responseData ? JSON.stringify(responseData) : "See CloudWatch Logs",
      PhysicalResourceId: context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData || {}
    });
    
    console.log("Response body:", responseBody);
    
    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: "PUT",
      headers: {
        "content-type": "",
        "content-length": responseBody.length
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = https.request(options, function(response) {
        console.log('Status code:', response.statusCode);
        resolve();
      });
      
      request.on("error", function(error) {
        console.log("Error sending response:", error);
        reject(error);
      });
      
      request.write(responseBody);
      request.end();
    });
  }
};

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event));
  
  // Check if this is a CloudFormation custom resource request
  const isCustomResource = event.StackId && event.RequestType;
  
  try {
    // Handle CloudFormation delete event or rollback
    if (isCustomResource && (event.RequestType === 'Delete' || event.RequestType === 'Update')) {
      console.log('Handling event for custom resource:', event.RequestType);
      await response.send(event, context, response.SUCCESS);
      return;
    }
    
    const apiGatewayClient = new APIGatewayClient({ region: process.env.REGION });
    const restApiId = event.ResourceProperties.RestApiId;
    const headers = event.ResourceProperties.Headers;
    const methods = event.ResourceProperties.Methods;
    const origins = event.ResourceProperties.Origins;
    
    // Get all resources
    const getResourcesCommand = new GetResourcesCommand({ restApiId });
    const resources = await apiGatewayClient.send(getResourcesCommand);
    
    // Enable CORS for each resource
    for (const resource of resources.items) {
      try {
        // Add OPTIONS method
        const putMethodCommand = new PutMethodCommand({
          restApiId,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          authorizationType: 'NONE',
          apiKeyRequired: false
        });
        await apiGatewayClient.send(putMethodCommand);
        
        // Add integration
        const putIntegrationCommand = new PutIntegrationCommand({
          restApiId,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          type: 'MOCK',
          integrationHttpMethod: 'OPTIONS',
          requestTemplates: {
            'application/json': '{\"statusCode\": 200}'
          }
        });
        await apiGatewayClient.send(putIntegrationCommand);
        
        // Add method response first
        const putMethodResponseCommand = new PutMethodResponseCommand({
          restApiId,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          },
          responseModels: {
            'application/json': 'Empty'
          }
        });
        await apiGatewayClient.send(putMethodResponseCommand);
        
        // Add integration response after method response exists
        const putIntegrationResponseCommand = new PutIntegrationResponseCommand({
          restApiId,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': `'${headers}'`,
            'method.response.header.Access-Control-Allow-Methods': `'${methods}'`,
            'method.response.header.Access-Control-Allow-Origin': `'${origins}'`
          },
          responseTemplates: {
            'application/json': ''
          }
        });
        await apiGatewayClient.send(putIntegrationResponseCommand);
        
        console.log('CORS enabled for resource:', resource.id);
      } catch (resourceError) {
        console.log('Error configuring CORS for resource:', resource.id, resourceError);
        // Continue with other resources
      }
    }
    
    await response.send(event, context, response.SUCCESS);
  } catch (error) {
    console.error('Error enabling CORS:', error);
    
    // Send failure response for CloudFormation custom resource
    if (isCustomResource) {
      try {
        await response.send(event, context, response.FAILED, { error: error.message });
      } catch (responseError) {
        console.error('Failed to send response to CloudFormation:', responseError);
      }
    }
    
    throw error;
  } finally {
    // Ensure a response is sent even if there's an uncaught exception
    if (isCustomResource && !context.callbackWaitsForEmptyEventLoop) {
      try {
        await response.send(event, context, response.FAILED, {
          error: 'Function execution failed or timed out'
        });
      } catch (finallyError) {
        console.error('Failed to send final response to CloudFormation:', finallyError);
      }
    }
  }
};