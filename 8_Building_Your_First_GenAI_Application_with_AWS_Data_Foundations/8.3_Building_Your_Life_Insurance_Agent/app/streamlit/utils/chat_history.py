# streamlit/utils/chat_history.py

import uuid
import boto3
import logging
from datetime import datetime
from typing import Dict, List, Optional
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class ChatHistory:
    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)

    def create_session(self, user_id: str) -> str:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'user_id': user_id,
            'session_id': session_id,
            'created_at': timestamp,
            'updated_at': timestamp,
            'messages': []
        }
        
        self.table.put_item(Item=item)
        return session_id

    def get_sessions(self, user_id: str) -> List[Dict]:
        """Get all chat sessions for a user."""
        response = self.table.query(
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id},
            ScanIndexForward=False  # Return results in descending order
        )
        return response['Items']

    def get_session(self, user_id: str, session_id: str) -> Optional[Dict]:
        """Get a specific chat session."""
        response = self.table.get_item(
            Key={
                'user_id': user_id,
                'session_id': session_id
            }
        )
        return response.get('Item')

    def validate_session_messages(self, user_id: str, session_id: str) -> bool:
        """
        Validate the messages in a session.
        
        Args:
            user_id (str): The user's ID
            session_id (str): The chat session ID
            
        Returns:
            bool: True if validation passes, False otherwise
        """
        try:
            response = self.table.get_item(
                Key={
                    'user_id': user_id,
                    'session_id': session_id
                }
            )
            
            if 'Item' not in response or 'messages' not in response['Item']:
                logger.error(f"No messages found in session {session_id}")
                return False

            messages = response['Item']['messages']
            
            # Check message count
            if len(messages) > 100:  # Arbitrary limit
                logger.warning(f"Session {session_id} has exceeded message limit")
                
            # Validate message alternation
            last_role = None
            for msg in messages:
                if 'role' not in msg:
                    logger.error(f"Invalid message format in session {session_id}")
                    return False
                    
                current_role = msg['role']
                if last_role and last_role == current_role:
                    logger.warning(f"Non-alternating messages detected in session {session_id}")
                last_role = current_role

            return True

        except Exception as e:
            logger.error(f"Error validating session messages: {str(e)}", exc_info=True)
            return False

    def add_message(self, user_id: str, session_id: str, message: Dict):
        """
        Add a message to a chat session with proper formatting and validation.
        
        Args:
            user_id (str): The user's ID
            session_id (str): The chat session ID
            message (Dict): The message to add, must contain 'role' and 'content'
            
        Raises:
            ValueError: If message format is invalid
            ClientError: If DynamoDB operation fails
        """
        try:
            # Validate input parameters
            if not user_id or not session_id:
                raise ValueError("user_id and session_id are required")
                
            # Validate message structure
            if not isinstance(message, dict):
                raise ValueError(f"Message must be a dictionary, got {type(message)}")
                
            if 'role' not in message or message['role'] not in ['user', 'assistant']:
                raise ValueError(f"Invalid role: {message.get('role')}. Must be 'user' or 'assistant'")
                
            if 'content' not in message:
                raise ValueError("Message must contain 'content'")

            # Format content for DynamoDB storage
            content = message['content']
            formatted_content = []
            
            if isinstance(content, str):
                formatted_content = [{"text": content}]
            elif isinstance(content, list) and content:
                for item in content:
                    if isinstance(item, dict) and 'text' in item:
                        formatted_content.append({"text": item['text']})
                    elif isinstance(item, str):
                        formatted_content.append({"text": item})
                    else:
                        raise ValueError(f"Invalid content item format: {item}")
            else:
                raise ValueError(f"Invalid content format: {content}")

            # Create formatted message
            formatted_message = {
                'role': message['role'],
                'content': formatted_content,
                'timestamp': datetime.utcnow().isoformat()
            }

            # Check session existence and update
            try:
                response = self.table.get_item(
                    Key={'user_id': user_id, 'session_id': session_id},
                    ProjectionExpression='messages'
                )

                if 'Item' not in response:
                    # Create new session with message
                    self.table.put_item(Item={
                        'user_id': user_id,
                        'session_id': session_id,
                        'created_at': datetime.utcnow().isoformat(),
                        'updated_at': datetime.utcnow().isoformat(),
                        'messages': [formatted_message]
                    })
                else:
                    # Append to existing session
                    self.table.update_item(
                        Key={'user_id': user_id, 'session_id': session_id},
                        UpdateExpression='SET messages = list_append(if_not_exists(messages, :empty_list), :m), updated_at = :t',
                        ExpressionAttributeValues={
                            ':m': [formatted_message],
                            ':empty_list': [],
                            ':t': datetime.utcnow().isoformat()
                        }
                    )

                logger.info(f"Successfully added message to session {session_id}")
                
                # Validate updated session
                if not self.validate_session_messages(user_id, session_id):
                    logger.warning(f"Session {session_id} failed validation after message addition")

            except ClientError as e:
                logger.error(f"DynamoDB error: {e.response['Error']}")
                raise

        except Exception as e:
            logger.error(f"Error adding message: {str(e)}", exc_info=True)
            raise
