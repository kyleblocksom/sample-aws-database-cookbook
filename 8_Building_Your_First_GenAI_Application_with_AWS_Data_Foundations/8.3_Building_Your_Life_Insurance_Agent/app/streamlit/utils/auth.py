# app/streamlit/utils/auth.py

import json
import boto3
import logging
import botocore
import streamlit as st
from typing import Optional
from botocore.exceptions import ClientError
from streamlit_cognito_auth import CognitoAuthenticator

logger = logging.getLogger(__name__)

class Auth:
    def __init__(self):
        if 'authenticator' not in st.session_state:
            st.session_state.authenticator = None
        if 'authenticated' not in st.session_state:
            st.session_state.authenticated = False
        if 'user_id' not in st.session_state:
               st.session_state.user_id = None
        if 'user_attributes' not in st.session_state:
            st.session_state.user_attributes = None
        if 'cognito_user_pool_id' not in st.session_state:
            st.session_state.cognito_user_pool_id = None

    def initialize_auth(self, secret_id: str):
        """Initialize the authenticator using the secret ID"""
        try:
            # Get Cognito parameters from Secrets Manager
            secretsmanager_client = boto3.client("secretsmanager")
            response = secretsmanager_client.get_secret_value(
                SecretId=secret_id,
            )
            secret_string = json.loads(response['SecretString'])
            pool_id = secret_string['cognito_user_pool_id']
            app_client_id = secret_string['cognito_app_client_id']
            app_client_secret = secret_string['cognito_app_client_secret']

            logger.info(f"Retrieved Cognito parameters for pool ID: {pool_id}")
            
            # Store pool ID for later use
            st.session_state.cognito_user_pool_id = pool_id

            # Initialize CognitoAuthenticator
            authenticator = CognitoAuthenticator(
                pool_id=pool_id,
                app_client_id=app_client_id,
                app_client_secret=app_client_secret,
                use_cookies=False
            )

            st.session_state.authenticator = authenticator
            return authenticator

        except ClientError as e:
            logger.error(f"Failed to retrieve secret: {e}")
            raise
        except KeyError as e:
            logger.error(f"Missing required key in secret: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

    def login(self):
        """Handle the login process"""
        if st.session_state.authenticator:
            try:
                if st.session_state.authenticator.login():
                    st.session_state.authenticated = True
                    st.session_state.user_id = st.session_state.authenticator.get_username()
                    self._fetch_user_attributes()
                    return True
            except botocore.exceptions.ClientError as e:
                if e.response['Error']['Code'] == 'UserNotFoundException':
                    st.error("User does not exist. Please check your login credentials.")
                else:
                    st.error(f"Error logging in: {str(e)}")
        return False

    def _fetch_user_attributes(self):
        """Fetch and store user attributes using Cognito client"""
        try:
            if not self.is_authenticated() or not st.session_state.user_id:
                return None

            cognito_idp = boto3.client('cognito-idp')
            response = cognito_idp.admin_get_user(
                UserPoolId=st.session_state.cognito_user_pool_id,
                Username=st.session_state.user_id
            )
            
            # Convert attributes list to dictionary
            attributes = {
                attr['Name']: attr['Value'] 
                for attr in response['UserAttributes']
            }
            
            st.session_state.user_attributes = attributes
            logger.info(f"Successfully fetched attributes for user {st.session_state.user_id}")
            return attributes

        except Exception as e:
            logger.error(f"Failed to fetch user attributes: {e}")
            return None

    def logout(self):
        """Handle the logout process"""
        if st.session_state.authenticator:
            st.session_state.authenticator.logout()
        st.session_state.authenticated = False
        st.session_state.user_id = None
        st.session_state.user_attributes = None

    def is_authenticated(self):
        """Check if user is authenticated"""
        return st.session_state.authenticated

    def get_user_id(self):
        """Get the current user ID"""
        return st.session_state.user_id

    def get_user_attributes(self):
        """Get the authenticated user's attributes"""
        if not self.is_authenticated():
            return None
            
        # Fetch attributes if not already stored
        if not st.session_state.user_attributes:
            return self._fetch_user_attributes()
            
        return st.session_state.user_attributes

    def get_policy_number(self) -> Optional[str]:
        """Get the authenticated user's policy number from stored attributes"""
        if not self.is_authenticated():
            return None
            
        try:
            attributes = self.get_user_attributes()
            if attributes:
                return attributes.get('custom:policy_number')
            return None
        except Exception as e:
            logger.error(f"Error getting policy number: {e}")
            return None
