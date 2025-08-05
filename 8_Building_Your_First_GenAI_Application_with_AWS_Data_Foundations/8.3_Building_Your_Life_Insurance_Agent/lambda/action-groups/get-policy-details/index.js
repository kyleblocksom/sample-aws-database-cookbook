// lambda/action-groups/get-policy-details/index.js

const { PolicyDbClient } = require('./shared/policy-db-client');

function formatErrorResponse(statusCode, message) {
    const response = {
        messageVersion: '1.0',
        response: {
            actionGroup: 'GetPolicyDetails',
            apiPath: '/get-policy-details',
            httpMethod: 'POST',
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

exports.handler = async (event) => {
    console.log('\n=== Starting get-policy-details handler ===');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const policyNumber = event.requestBody.content['application/json'].properties
            .find(prop => prop.name === 'policyNumber')?.value;

        if (!policyNumber) {
            return formatErrorResponse(400, 'Policy number is required');
        }

        console.log('Retrieving policy details from database...');
        const dbClient = new PolicyDbClient();
        
        const policy = await dbClient.getPolicyDetails(policyNumber);
        if (!policy) {
            console.log('No policy found');
            return formatErrorResponse(404, 'Policy not found');
        }
        console.log('Policy details:', JSON.stringify(policy, null, 2));

        const responseData = {
            policy: {
                policyNumber: policy.policy_number,
                policyType: policy.policy_type,
                policyStatus: policy.policy_status,
                issueDate: policy.issue_date,
                faceAmount: parseFloat(policy.face_amount),
                ownerName: policy.policy_owner,
                ownerDateOfBirth: policy.owner_date_of_birth,
                insuredPerson: policy.insured_person,
                valuationDate: policy.valuation_date,
                netCashSurrender: parseFloat(policy.net_cash_surrender)
            },
            premium: {
                amount: policy.premium_amount ? parseFloat(policy.premium_amount) : null,
                frequency: policy.premium_frequency,
                nextDueDate: policy.next_due_date
            },
            address: policy.current_address ? {
                streetAddress: policy.current_address.street_address,
                city: policy.current_address.city,
                state: policy.current_address.state,
                zipCode: policy.current_address.zip_code
            } : null,
            beneficiaries: (policy.beneficiaries || []).map(b => ({
                beneficiaryId: b.beneficiary_id,
                beneficiaryName: b.beneficiary_name,
                dateOfBirth: b.date_of_birth,
                relationship: b.relationship,
                percentage: parseFloat(b.percentage),
                isPrimary: b.is_primary
            })),
            lastPayment: policy.last_payment ? {
                paymentAmount: parseFloat(policy.last_payment.payment_amount),
                paymentDate: policy.last_payment.payment_date,
                paymentStatus: policy.last_payment.payment_status
            } : null
        };

        const response = {
            messageVersion: '1.0',
            response: {
                actionGroup: event.actionGroup,
                apiPath: event.apiPath,
                httpMethod: event.httpMethod,
                httpStatusCode: 200,
                responseBody: {
                    'application/json': {
                        body: JSON.stringify(responseData)
                    }
                }
            }
        };

        console.log('Final response:', JSON.stringify(response, null, 2));
        console.log('=== Finished get-policy-details handler ===\n');
        
        return response;

    } catch (error) {
        console.error('Error in handler:', error);
        console.error('Stack trace:', error.stack);
        return formatErrorResponse(500, 'Internal server error');
    }
};
