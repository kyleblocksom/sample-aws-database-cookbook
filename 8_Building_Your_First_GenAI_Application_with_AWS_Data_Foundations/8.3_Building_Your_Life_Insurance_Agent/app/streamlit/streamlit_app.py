# app/streamlit/streamlit_app.py

import os
import re
import json
import boto3
import logging
import streamlit as st
from typing import Optional
from dotenv import load_dotenv
from datetime import datetime, UTC
from utils.auth import Auth
from utils.bedrock import BedrockService
from utils.chat_history import ChatHistory
from botocore.exceptions import ClientError

# Configure page
st.set_page_config(
    page_title=os.getenv('APP_TITLE', "Product Search Assistant"),
    page_icon=os.getenv('APP_ICON', "🔍"),
    layout="wide"
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('life_insurance_assistant')

# Load environment variables
load_dotenv()

def initialize_services():
    try:
        auth = Auth()
        auth.initialize_auth(os.getenv('SECRETS_MANAGER_ID'))
        
        # Add logging to debug environment variables
        agent_id = os.getenv('BEDROCK_AGENT_ID')
        guardrail_id = os.getenv('BEDROCK_GUARDRAIL_ID')
        guardrail_version = os.getenv('BEDROCK_GUARDRAIL_VERSION')
        
        logger.info(f"Initializing BedrockService with: agent_id={agent_id}, "
                   f"guardrail_id={guardrail_id}, guardrail_version={guardrail_version}")
        
        if not agent_id:
            raise ValueError("BEDROCK_AGENT_ID environment variable is not set")
            
        bedrock = BedrockService(
            agent_id=agent_id,
            guardrail_id=guardrail_id,
            guardrail_version=guardrail_version
        )
        
        chat_history = ChatHistory(table_name=os.getenv('DYNAMODB_CHAT_HISTORY_TABLE'))
        
        return auth, bedrock, chat_history
        
    except Exception as e:
        st.error(f"Error initializing services: {str(e)}")
        return None, None, None

def init_session_state():
    """Initialize session state with policy details message if needed."""
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'current_session' not in st.session_state:
        st.session_state.current_session = None
    if 'user_id' not in st.session_state:
        st.session_state.user_id = None
    if 'auth' not in st.session_state:
        st.session_state.auth = None
    if 'authenticator' not in st.session_state:
        st.session_state.authenticator = None
    if 'initial_message_sent' not in st.session_state:
        st.session_state.initial_message_sent = False

def display_chat_history(chat_history: ChatHistory):
    with st.sidebar:
        st.title("Conversation History")
        
        if st.button("New Chat"):
            session_id = chat_history.create_session(st.session_state.user_id)
            st.session_state.current_session = session_id
            st.session_state.messages = []
            st.rerun()
        
        st.divider()
        
        chats = chat_history.get_sessions(st.session_state.user_id)
        for chat in chats:
            created_at = datetime.fromisoformat(chat['created_at']).strftime("%Y-%m-%d %H:%M")
            if st.button(f"Chat from {created_at}", key=chat['session_id']):
                st.session_state.current_session = chat['session_id']
                chat_data = chat_history.get_session(
                    st.session_state.user_id,
                    chat['session_id']
                )
                st.session_state.messages = chat_data.get('messages', [])
                st.rerun()

def format_dollar_signs(text):
    """Format dollar signs in text to prevent unintended Markdown formatting."""
    return re.sub(r'(?<!\\)\$', r'\$', text)

def format_message_for_agent(message):
    """Format a message for the Bedrock Agent API."""
    return {
        'role': message['role'],
        'content': [{'text': message['content'] if isinstance(message['content'], str) else message['content'][0]['text']}]
    }

def display_chat_interface(bedrock: BedrockService, chat_history: ChatHistory):
    st.title("Product Search Assistant")

    if 'policy_number' not in st.session_state:
        st.session_state.policy_number = st.session_state.auth.get_policy_number()

    if 'policy_details' not in st.session_state:
        try:
            username = st.session_state.authenticator.get_username()
            
            if st.session_state.policy_number:
                logger.info(f"Fetching initial policy details for policy: {st.session_state.policy_number}")
                
                get_details_prompt = f"get policy details for {st.session_state.policy_number}"
                initial_response = bedrock.invoke_agent(
                    prompt=get_details_prompt,
                    session_attributes={
                        'user_id': username,
                        'policy_number': st.session_state.policy_number
                    }
                )
                
                if initial_response['status'] == 'success':
                    st.session_state.policy_details = initial_response['response']
                    logger.info(f"Received policy details: {st.session_state.policy_details}")
                    
                    welcome_prompt = (
                        f"Generate initial welcome message for policy {st.session_state.policy_number} "
                        f"using these policy details: {st.session_state.policy_details}"
                    )

                    welcome_response = bedrock.invoke_agent(
                        prompt=welcome_prompt,
                        session_attributes={
                            'user_id': username,
                            'policy_number': st.session_state.policy_number
                        }
                    )
                    
                    if welcome_response['status'] == 'success':
                        logger.info(f"Raw welcome message from agent: {welcome_response['response']}")
                        formatted_welcome_message = format_dollar_signs(welcome_response['response'])
                        logger.info(f"Formatted welcome message: {formatted_welcome_message}")
                        
                        st.session_state.messages = [
                            {
                                "role": "assistant",
                                "content": formatted_welcome_message
                            }
                        ]
                        logger.info("Initial message added to session state")
                    else:
                        logger.error(f"Error getting welcome message: {welcome_response['message']}")

                else:
                    logger.error(f"Error getting initial policy details: {initial_response['message']}")
        except Exception as e:
            logger.error(f"Error in initial policy details fetch: {str(e)}")

    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            # Extract text from content
            if isinstance(message["content"], list) and len(message["content"]) > 0:
                # If content is a list of dictionaries with 'text' key
                text = message["content"][0].get("text", "")
            elif isinstance(message["content"], dict) and "text" in message["content"]:
                # If content is a single dictionary with 'text' key
                text = message["content"]["text"]
            elif isinstance(message["content"], str):
                # If content is already a string
                text = message["content"]
            else:
                # Fallback
                text = str(message["content"])
                
            st.markdown(format_dollar_signs(text))

    # Chat input
    if prompt := st.chat_input("Please let me know how I can help with your policy today."):
        # Format user message
        user_message = {
            "role": "user", 
            "content": [{"text": prompt}]
        }
        st.session_state.messages.append(user_message)
        
        # Save user message to chat history
        chat_history.add_message(
            st.session_state.user_id,
            st.session_state.current_session,
            user_message
        )

        with st.chat_message("user"):
            st.markdown(prompt)
            
        try:
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    # Format conversation history for agent
                    session_messages = bedrock.format_conversation_history(
                        st.session_state.messages,
                        prompt
                    )

                    # Convert conversation history to JSON string
                    conversation_history = json.dumps({
                        'messages': session_messages
                    })
                    
                    response = bedrock.invoke_agent(
                        prompt=prompt,
                        session_attributes={
                            'user_id': st.session_state.authenticator.get_username(),
                            'policy_number': st.session_state.policy_number,
                            'conversationHistory': conversation_history
                        }
                    )

                    # In the chat input section, update how the response is displayed
                    if response['status'] == 'success':
                        formatted_response = format_dollar_signs(response['response'])
                        assistant_message = {
                            "role": "assistant",
                            "content": [{"text": formatted_response}]
                        }
                        # Display only the text content
                        st.markdown(formatted_response)
                        st.session_state.messages.append(assistant_message)
                        
                        # Add to chat history
                        chat_history.add_message(
                            st.session_state.user_id,
                            st.session_state.current_session,
                            assistant_message
                        )
                    else:
                        st.error(f"Error: {response['message']}")

        except Exception as e:
            st.error("An error occurred while processing your request.")
            logger.error(f"Chat interface error: {str(e)}", exc_info=True)

        st.rerun()

    # Add footer text
    st.markdown("---")
    st.markdown(
        "Product Search Assistant is here to help 24/7. "
        "For additional assistance, please call **************.",
        help="Contact Information"
    )

def main():
    auth, bedrock, chat_history = initialize_services()
    if not (auth and bedrock and chat_history):
        st.error("Failed to initialize application. Please try again later.")
        return
    
    init_session_state()
    
    # Store auth instance in session state
    st.session_state.auth = auth
    
    if not auth.is_authenticated():
        st.title("Product Search Assistant")
        if auth.login():
            st.rerun()
        return
    
    if not st.session_state.user_id:
        st.session_state.user_id = auth.get_user_id()
    
    display_chat_history(chat_history)
    
    if not st.session_state.current_session:
        session_id = chat_history.create_session(st.session_state.user_id)
        st.session_state.current_session = session_id
        st.session_state.messages = []
        st.session_state.initial_message_sent = False  # Reset flag for new session
    
    display_chat_interface(bedrock, chat_history)
    
    if st.sidebar.button("Logout"):
        auth.logout()
        st.session_state.initial_message_sent = False  # Reset flag on logout
        st.rerun()

if __name__ == "__main__":
    main()
