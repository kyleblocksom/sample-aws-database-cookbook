// lambda/action-groups/update-address/index.js

const { PolicyDbClient } = require('./shared/policy-db-client');

function formatErrorResponse(statusCode, message, event, field = null) {
    const response = {
        messageVersion: '1.0',
        response: {
            actionGroup: event?.actionGroup || 'UpdateAddress',
            apiPath: event?.apiPath || '/update-address',
            httpMethod: event?.httpMethod || 'POST',
            httpStatusCode: statusCode,
            responseBody: {
                'application/json': {
                    body: JSON.stringify({
                        error: message,
                        ...(field && { field })
                    })
                }
            }
        }
    };

    console.log('Error response:', JSON.stringify(response, null, 2));
    return response;
}

function validateAddress(address) {
    const validations = [
        {
            field: 'policyNumber',
            isValid: () => !!address.policyNumber,
            message: 'Policy number is required'
        },
        {
            field: 'streetAddress',
            isValid: () => {
                const length = address.streetAddress?.length || 0;
                return length >= 5 && length <= 100 && /^[a-zA-Z0-9\s\-\.,#]+$/.test(address.streetAddress);
            },
            message: 'Street address must be 5-100 characters and contain only letters, numbers, spaces, and common punctuation'
        },
        {
            field: 'city',
            isValid: () => {
                return address.city && /^[a-zA-Z\s\-]+$/.test(address.city) && 
                       address.city.length >= 2 && address.city.length <= 50;
            },
            message: 'City must contain only letters, spaces, and hyphens (2-50 characters)'
        },
        {
            field: 'state',
            isValid: () => address.state && /^[A-Z]{2}$/.test(address.state),
            message: 'State must be a valid two-letter state code'
        },
        {
            field: 'zipCode',
            isValid: () => address.zipCode && /^\d{5}(-\d{4})?$/.test(address.zipCode),
            message: 'ZIP code must be in 12345 or 12345-6789 format'
        }
    ];

    for (const validation of validations) {
        if (!validation.isValid()) {
            return {
                isValid: false,
                message: validation.message,
                field: validation.field
            };
        }
    }

    return { isValid: true };
}

exports.handler = async (event) => {
    console.log('\n=== Starting update-address handler ===');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const props = event.requestBody.content['application/json'].properties;
        const address = {
            policyNumber: props.find(p => p.name === 'policyNumber')?.value,
            streetAddress: props.find(p => p.name === 'streetAddress')?.value?.trim(),
            city: props.find(p => p.name === 'city')?.value?.trim(),
            state: props.find(p => p.name === 'state')?.value?.trim()?.toUpperCase(),
            zipCode: props.find(p => p.name === 'zipCode')?.value?.trim(),
            addressType: props.find(p => p.name === 'addressType')?.value || 'PRIMARY'
        };

        // Verify session policy number if present
        const sessionPolicyNumber = event.sessionAttributes?.policy_number;
        if (sessionPolicyNumber && sessionPolicyNumber !== address.policyNumber) {
            return formatErrorResponse(403, 
                `For security reasons, I can only assist with policy ${sessionPolicyNumber} in this session.`, 
                event
            );
        }

        // Validate address
        const validation = validateAddress(address);
        if (!validation.isValid) {
            return formatErrorResponse(400, validation.message, event, validation.field);
        }

        const dbClient = new PolicyDbClient();
        const result = await dbClient.updateAddress(address.policyNumber, address);
        
        // Mask sensitive information in response
        const maskedAddress = {
            streetAddress: maskStreetAddress(address.streetAddress),
            city: address.city,
            state: address.state,
            zipCode: maskZipCode(address.zipCode)
        };

        return {
            messageVersion: '1.0',
            response: {
                actionGroup: event.actionGroup,
                apiPath: event.apiPath,
                httpMethod: event.httpMethod,
                httpStatusCode: 200,
                responseBody: {
                    'application/json': {
                        body: JSON.stringify({
                            status: 'COMPLETED',
                            address: maskedAddress,
                            updateTimestamp: new Date().toISOString()
                        })
                    }
                }
            }
        };

    } catch (error) {
        console.error('Error in handler:', error);
        console.error('Stack trace:', error.stack);

        if (error.message.includes('not found')) {
            return formatErrorResponse(404, 'Policy not found', event);
        }

        return formatErrorResponse(500, 'Internal server error', event);
    }
};

function maskStreetAddress(address) {
    const parts = address.split(' ');
    if (parts.length > 1) {
        parts[0] = '***'; // Mask the street number
        return parts.join(' ');
    }
    return '***';
}

function maskZipCode(zipCode) {
    return '*'.repeat(5) + (zipCode.length > 5 ? '-****' : '');
}

module.exports = exports;
