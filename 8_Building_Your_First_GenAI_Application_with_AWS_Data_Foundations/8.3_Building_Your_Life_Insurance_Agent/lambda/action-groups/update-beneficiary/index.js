// lambda/action-groups/update-beneficiary/index.js

const { PolicyDbClient } = require('./shared/policy-db-client');

function formatErrorResponse(statusCode, message, event) {
    const response = {
        messageVersion: '1.0',
        response: {
            actionGroup: event?.actionGroup || 'UpdateBeneficiary',
            apiPath: event?.apiPath || '/update-beneficiary',
            httpMethod: event?.httpMethod || 'POST',
            httpStatusCode: statusCode,
            responseBody: {
                'application/json': {
                    body: JSON.stringify({
                        error: message
                    })
                }
            }
        }
    };

    console.log('Error response:', JSON.stringify(response, null, 2));
    return response;
}

function convertDateFormat(dateStr) {
    if (!dateStr) return null;
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Convert MM/DD/YYYY to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
}

exports.handler = async (event) => {
    console.log('\n=== Starting update-beneficiary handler ===');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const props = event.requestBody.content['application/json'].properties;
        const policyNumber = props.find(p => p.name === 'policyNumber')?.value;
        
        // Verify session policy number matches requested policy number
        const sessionPolicyNumber = event.sessionAttributes?.policy_number;
        if (sessionPolicyNumber && sessionPolicyNumber !== policyNumber) {
            return formatErrorResponse(403, `For security reasons, I can only assist with policy ${sessionPolicyNumber} in this session.`, event);
        }
        
        let beneficiaries;
        try {
            const beneficiariesInput = props.find(p => p.name === 'beneficiaries')?.value;
            console.log('Raw beneficiaries input:', beneficiariesInput);

            if (!beneficiariesInput) {
                return formatErrorResponse(400, 'Beneficiary information is required', event);
            }

            beneficiaries = JSON.parse(beneficiariesInput);
            console.log('Parsed beneficiaries:', JSON.stringify(beneficiaries, null, 2));
            
        } catch (error) {
            console.error('Error parsing beneficiaries:', error);
            return formatErrorResponse(400, 'Invalid beneficiary data format', event);
        }

        // Validate the parsed data
        if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) {
            return formatErrorResponse(400, 'At least one beneficiary is required', event);
        }

        const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
        const validRelationships = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];

        // Validate each beneficiary
        for (const ben of beneficiaries) {
            const beneficiaryName = ben.beneficiaryName;
            
            // Validate name
            if (!beneficiaryName || !nameRegex.test(beneficiaryName) || beneficiaryName.length > 100) {
                return formatErrorResponse(400, 
                    `Invalid beneficiary name: ${beneficiaryName}. Name must be 1-100 characters and contain only letters, spaces, hyphens, periods, and apostrophes.`, 
                    event
                );
            }

            // Handle relationship mapping and validation
            const relationship = ben.relationship.toUpperCase();
            if (!validRelationships.includes(relationship)) {
                return formatErrorResponse(400, 
                    `Invalid relationship for ${beneficiaryName}. Must be one of: ${validRelationships.join(', ')}`, 
                    event
                );
            }

            // Validate date of birth if provided
            if (ben.dateOfBirth) {
                const convertedDate = convertDateFormat(ben.dateOfBirth);
                if (!convertedDate) {
                    return formatErrorResponse(400,
                        `Invalid date of birth format for ${beneficiaryName}. Use YYYY-MM-DD or MM/DD/YYYY format.`,
                        event
                    );
                }
                // Validate date is not in the future
                if (new Date(convertedDate) > new Date()) {
                    return formatErrorResponse(400,
                        `Date of birth cannot be in the future for ${beneficiaryName}.`,
                        event
                    );
                }
                ben.dateOfBirth = convertedDate;
            }

            // Validate allocation percentage
            const percentage = parseFloat(ben.percentage);
            if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
                return formatErrorResponse(400, 
                    `Invalid allocation percentage for ${beneficiaryName}. Must be between 0.01 and 100.00`, 
                    event
                );
            }
            ben.percentage = percentage;
        }

        // Validate total allocation
        const totalAllocation = beneficiaries.reduce((sum, ben) => sum + ben.percentage, 0);
        
        if (Math.abs(totalAllocation - 100) > 0.01) {
            return formatErrorResponse(400, 
                `Total allocation must equal 100%. Current total: ${totalAllocation.toFixed(2)}%`, 
                event
            );
        }

        const dbClient = new PolicyDbClient();
        await dbClient.updateBeneficiaries(policyNumber, beneficiaries);
        
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
                            beneficiaries: beneficiaries.map(b => ({
                                beneficiaryId: b.beneficiaryId,
                                beneficiaryName: b.beneficiaryName,
                                dateOfBirth: b.dateOfBirth,
                                relationship: b.relationship,
                                percentage: b.percentage,
                                isPrimary: b.isPrimary || false
                            })),
                            updateTimestamp: new Date().toISOString()
                        })
                    }
                }
            }
        };

    } catch (error) {
        console.error('Error in handler:', error);
        console.error('Stack trace:', error.stack);
        return formatErrorResponse(500, 'Internal server error', event);
    }
};
