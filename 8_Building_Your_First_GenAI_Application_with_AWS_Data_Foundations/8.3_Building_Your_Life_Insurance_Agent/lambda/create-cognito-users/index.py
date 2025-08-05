# lambda/create-cognito-users/index.py

import os
import json
import boto3
from typing import Dict, Any

cognito = boto3.client('cognito-idp')

def read_policy_data() -> list:
    """Read policy data from the sample data file"""
    with open(os.environ['POLICY_DATA_PATH'], 'r') as f:
        data = json.load(f)
    return data['policies']

def create_user(user_pool_id: str, policy: Dict[str, Any]) -> None:
    """Create a Cognito user for a policy"""
    try:
        temp_password = os.getenv('COGNITO_TEMP_PASSWORD', 'ChangeMe123!')
        # Changed owner_name to policy_owner
        username = policy['policy_owner'].replace(' ', '').lower()
        cognito.admin_create_user(
            UserPoolId=user_pool_id,
            Username=username,
            UserAttributes=[
                {
                    'Name': 'custom:policy_number',
                    'Value': policy['policy_number']
                },
                {
                    'Name': 'name',
                    'Value': policy['policy_owner']
                },
                {
                    'Name': 'email',
                    'Value': f"{username}@example.com"
                },
                {
                    'Name': 'email_verified',
                    'Value': 'true'
                }
            ],
            TemporaryPassword=temp_password,
            MessageAction='SUPPRESS'
        )
        print(f"Created user {username} for policy {policy['policy_number']}")
    except Exception as e:
        print(f"Error creating user for policy {policy['policy_number']}: {str(e)}")
        raise

def handler(event, context):
    """Lambda handler for creating Cognito users"""
    try:
        print("Event:", json.dumps(event, indent=2))
        
        if event['RequestType'] in ['Create', 'Update']:
            user_pool_id = event['ResourceProperties']['UserPoolId']
            print(f"Reading policy data from: {os.environ['POLICY_DATA_PATH']}")
            policies = read_policy_data()
            print(f"Found {len(policies)} policies")
            print(f"First policy: {json.dumps(policies[0], indent=2)}")
            
            for policy in policies:
                create_user(user_pool_id, policy)
            
            return {
                'PhysicalResourceId': 'CreateCognitoUsers',
                'Data': {
                    'Message': f'Successfully created {len(policies)} users'
                }
            }

        elif event['RequestType'] == 'Delete':
            print("Delete event received. No action needed for user deletion.")
        
        return {
            'PhysicalResourceId': 'CreateCognitoUsers'
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise