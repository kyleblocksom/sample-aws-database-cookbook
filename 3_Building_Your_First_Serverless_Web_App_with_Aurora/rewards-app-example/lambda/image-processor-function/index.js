// Import AWS SDK v3 modules
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Client } = require('pg');
const https = require("https");
const url = require("url");
const fs = require('fs');
const path = require('path');

// Initialize clients
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });
const s3Client = new S3Client({ region: process.env.REGION });

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
        console.log(`Status code: ${response.statusCode}`);
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
  // Check if this is a CloudFormation custom resource request
  const isCustomResource = event.StackId && event.RequestType;
  
  try {
    // Handle CloudFormation delete event or rollback
    if (isCustomResource && (event.RequestType === 'Delete' || event.RequestType === 'Update')) {
      console.log(`Handling ${event.RequestType} event for custom resource`);
      await response.send(event, context, response.SUCCESS);
      return;
    }
    
    // Get database credentials from Secrets Manager
    const secretCommand = new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN
    });
    const secretData = await secretsClient.send(secretCommand);
    
    const { username, password } = JSON.parse(secretData.SecretString);
    
    // Connect to the database
    const client = new Client({
      host: process.env.DB_ENDPOINT,
      port: 5432,
      database: process.env.DB_NAME,
      user: username,
      password: password
    });
    
    await client.connect();
    console.log('Connected to database');
    
    // Get all images from the database
    const imagesResult = await client.query('SELECT id, filename FROM xpoints.images');
    console.log(`Found ${imagesResult.rows.length} images to process`);
    
    // Delete existing presigned URLs
    await client.query('DELETE FROM xpoints.image_urls');
    console.log('Deleted existing presigned URLs');
    
    // Get the S3 images folder from environment variable or use default
    const imagesFolder = process.env.S3_IMAGES_FOLDER || 'images';
    console.log(`Using S3 images folder: ${imagesFolder}`);
    
    // Generate presigned URLs for each image
    for (const image of imagesResult.rows) {
      const imageId = image.id;
      const filename = image.filename;
      
      // Create command for S3 getObject
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${imagesFolder}/${filename}`,
        ResponseContentType: 'image/jpeg',
        ResponseContentDisposition: `inline; filename="${filename}"`,
        ResponseCacheControl: 'public, max-age=31536000'
      });
      
      // Generate presigned URL with CORS headers
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 }); // 7 days in seconds
      
      // Store presigned URL in database
      await client.query(
        'INSERT INTO xpoints.image_urls (image_id, region, presigned_url) VALUES ($1, $2, $3)',
        [imageId, process.env.REGION, presignedUrl]
      );
      
      console.log(`Generated presigned URL for image ${filename}`);
    }
    
    await client.end();
    const responseData = { 
      status: 'success', 
      message: `Generated presigned URLs for ${imagesResult.rows.length} images` 
    };
    
    // Send success response to CloudFormation if this is a custom resource
    if (isCustomResource) {
      await response.send(event, context, response.SUCCESS, responseData);
    }
    
    return responseData;
  } catch (error) {
    console.error('Error processing images:', error);
    
    // Send failure response for CloudFormation custom resource
    if (isCustomResource) {
      try {
        await response.send(event, context, response.FAILED, {
          error: error.message
        });
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