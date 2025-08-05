# app/streamlit/utils/bedrock.py

import os
import json
import uuid
import time
import boto3
import backoff
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, List
from botocore.exceptions import ClientError
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BedrockService:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, agent_id: str, guardrail_id: str, guardrail_version: str):
        if not self._initialized:
            self.bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
            self.session_id = str(uuid.uuid4())
            
            # Add rate limiting parameters
            self.last_request_time = 0
            self.min_request_interval = 1.0  # Minimum time between requests in seconds
            
            self.config = {
                'agent_id': agent_id,
                'agent_alias_id': 'TSTALIASID',
                'guardrail_id': guardrail_id,
                'guardrail_version': guardrail_version,
            }
            
            logger.info(f"Initialized BedrockService with config: {json.dumps(self.config, indent=2)} and session_id: {self.session_id}")
            self._initialized = True

    def get_iso_timestamp(self):
        """Get current timestamp in ISO 8601 format"""
        return datetime.now(timezone.utc).isoformat()

    def validate_conversation_messages(self, messages: List[Dict]) -> bool:
        """
        Validate that messages strictly alternate between user and assistant.
        
        Args:
            messages (List[Dict]): List of conversation messages to validate
            
        Returns:
            bool: True if messages alternate properly, False otherwise
        """
        if not messages:
            return
            
        last_role = None
        for msg in messages:
            current_role = msg["role"]
            if last_role and last_role == current_role:
                logger.warning(f"Invalid message alternation detected: consecutive {current_role} messages")
                raise ValueError(f"Invalid message alternation: consecutive {current_role} messages")
            last_role = current_role
            
        logger.debug(f"Message alternation validation passed for {len(messages)} messages")
        return True
        
    def format_conversation_history(self, messages: List[Dict], prompt: str) -> List[Dict]:
        """
        Format conversation history ensuring proper structure and content.
        """
        try:
            logger.info("Formatting conversation history")
            
            formatted_history = []
            
            # Process existing messages
            for msg in messages:
                # Ensure message has required fields
                if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                    logger.warning(f"Skipping malformed message: {msg}")
                    continue
                
                # Format content according to Bedrock Agent requirements
                content = msg["content"]
                if isinstance(content, str):
                    content = [{"text": content}]
                elif isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
                    # Already in correct format
                    pass
                else:
                    logger.warning(f"Invalid content format: {content}")
                    continue
                    
                formatted_history.append({
                    "role": msg["role"],
                    "content": content
                })
            
            # Ensure the last message is the current prompt if it's not already there
            if not formatted_history or formatted_history[-1]["content"][0]["text"] != prompt:
                formatted_history.append({
                    "role": "user", 
                    "content": [{"text": prompt}]
                })
            
            # Validate the alternation of roles
            self.validate_conversation_messages(formatted_history)
            
            return formatted_history
            
        except Exception as e:
            logger.error(f"Error formatting conversation history: {str(e)}", exc_info=True)
            # Return minimal valid history
            return [{
                "role": "user",
                "content": [{"text": prompt}]
            }]

    def _wait_for_rate_limit(self):
        """Implement simple rate limiting"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )

    def _invoke_with_retry(self, request_params: dict) -> dict:
        """Execute the agent invocation with retries"""
        try:
            self._wait_for_rate_limit()
            return self.bedrock_agent_runtime.invoke_agent(**request_params)
        except ClientError as e:
            if e.response['Error']['Code'] == 'throttlingException':
                logger.warning("Request throttled, retrying with backoff...")
                raise  # Will be caught by retry decorator
            raise

    def invoke_agent(self, prompt: str, session_attributes: Optional[Dict] = None) -> Dict:
        """
        Invokes the Bedrock Agent with the given prompt, using only the session ID for context.
        
        Args:
            prompt (str): The user's input text
            session_attributes (Dict, optional): Additional session attributes
            
        Returns:
            Dict: Response from the agent with status and completion text
        """
        try:
            logger.info(f"Starting agent invocation for prompt: {prompt}")
            
            request_params = {
                'agentId': self.config['agent_id'],
                'agentAliasId': self.config['agent_alias_id'],
                'sessionId': self.session_id,
                'inputText': prompt,
                'enableTrace': True,
                'sessionState': {
                    'sessionAttributes': session_attributes or {}
                }
            }

            logger.info(f"Final request parameters: {json.dumps(request_params, default=str, indent=2)}")

            try:
                response = self._invoke_with_retry(request_params)
                logger.info("Successfully received agent response")
                
                completion = ""
                trace_info = None
                
                for event in response['completion']:
                    if 'chunk' in event:
                        chunk_data = event['chunk']
                        if 'bytes' in chunk_data:
                            completion += chunk_data['bytes'].decode('utf-8')
                    elif 'trace' in event:
                        trace_info = event['trace']
                        logger.debug(f"Trace information received: {json.dumps(trace_info, default=str, indent=2)}")

                return {
                    'status': 'success',
                    'response': completion,
                    'trace': trace_info,
                    'session_id': self.session_id
                }
                
            except ClientError as e:
                logger.error(f"ClientError in agent invocation: {str(e)}", exc_info=True)
                return {
                    'status': 'error',
                    'message': "The service is temporarily busy. Please try again in a few moments."
                }

        except Exception as e:
            logger.error(f"Unexpected error in invoke_agent: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': "An unexpected error occurred. Please try again later."
            }
