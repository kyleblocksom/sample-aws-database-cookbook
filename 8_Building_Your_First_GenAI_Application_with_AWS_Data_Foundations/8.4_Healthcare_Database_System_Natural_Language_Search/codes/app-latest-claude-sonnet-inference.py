import streamlit as st
import psycopg2
from psycopg2 import Error
import time
import os
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import pandas as pd
from dotenv import load_dotenv
import re
import logging
import traceback

# Set up logging - only warning and errors
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
try:
    load_dotenv()
except Exception as e:
    logger.error(f"Failed to load environment variables: {str(e)}")
    st.error("Failed to load application configuration. Please contact support.")

# Set page config
try:
    st.set_page_config(
        page_title="Text-to-SQL with Aurora DB for Healthcare & Life Sciences",
        layout="centered"
    )
except Exception as e:
    logger.error(f"Failed to set page config: {str(e)}")

def retrieve_db_metadata():
    """Retrieve database metadata from S3"""
    try:
        bucket_name = os.getenv('S3_BUCKET_NAME')
        if not bucket_name:
            logger.error("S3_BUCKET_NAME environment variable not set")
            return None

        s3 = boto3.client('s3')
        response = s3.get_object(Bucket=bucket_name, Key='metadata.json')
        json_data = response['Body'].read().decode('utf-8')
        return json_data
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'NoSuchKey':
            logger.error(f"Error: The file metadata.json does not exist in the S3 bucket '{bucket_name}'")
        elif error_code == 'NoSuchBucket':
            logger.error(f"Error: The S3 bucket '{bucket_name}' does not exist")
        else:
            logger.error(f"S3 ClientError: {str(e)}")
        return None
    except NoCredentialsError:
        logger.error("AWS credentials not found. Please check your configuration.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error while retrieving DB metadata: {str(e)}")
        return None

def is_safe_query(query):
    """Check if the SQL query is safe to execute"""
    try:
        if not query or not isinstance(query, str):
            return False, "Invalid query format"

        # Convert to lowercase for easier pattern matching
        query_lower = query.lower()

        # List of forbidden patterns
        forbidden_patterns = [
            r'\bdrop\b',
            r'\btruncate\b',
            r'\bdelete\b',
            r'\bupdate\b',
            r'\binsert\b',
            r'\bcreate\b',
            r'\balter\b',
            r'\bgrant\b',
            r'\brevoke\b',
            r'\bexec\b',
            r'\bmerge\b'
        ]

        # Check for forbidden patterns
        for pattern in forbidden_patterns:
            if re.search(pattern, query_lower):
                clean_pattern = pattern.replace(r'\b', '')
                return False, f"Sorry, {clean_pattern} operations are not allowed for security reasons."

        # Only allow SELECT statements
        if not query_lower.strip().startswith('select'):
            return False, "Only SELECT queries are allowed. Please rephrase your question to retrieve information."

        return True, ""
    except Exception as e:
        logger.error(f"Error in is_safe_query: {str(e)}")
        return False, "Error validating query safety. Please try again."

def get_bedrock_client():
    """Get AWS Bedrock client with proper error handling"""
    try:
        region = os.getenv('AWS_REGION')
        client = boto3.client(
            service_name='bedrock-runtime',
            region_name=region
        )
        return client
    except NoCredentialsError:
        logger.error("AWS credentials not found")
        return None
    except ClientError as e:
        logger.error(f"AWS ClientError: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error creating Bedrock client: {str(e)}")
        return None

def generate_sql_query(question):
    """Generate a SQL query from a natural language question using Bedrock"""
    try:
        bedrock = get_bedrock_client()
        if not bedrock:
            return "Error: Could not initialize Bedrock client"

        table_data = retrieve_db_metadata()
        if not table_data:
            return "Error: Could not retrieve database metadata"
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": f"Given the following table metadata:\n{json.dumps(table_data, indent=2)}\n\nConvert the following question into a SQL query:\n\"{question}\"\n\nImportant rules:\n1. Only generateSELECT queries\n2. Do not use any DDL or DML operations (CREATE, INSERT, UPDATE, DELETE, etc.)\n3. Make sure the query is compatible with PostgreSQL syntax\n4. Return only the SQL query with no other charactersor strings"
                }
            ],
            "max_tokens": 20000,
            "temperature": 0.7,
            "top_p": 0.999,
            "anthropic_version": "bedrock-2023-05-31"
        })
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            #modelId="anthropic.claude-3-7-sonnet-20250219-v1:0",
            body=body
        )

        response_body = json.loads(response['body'].read())
        #return response_body['completion'].strip()
        return response_body['content'][0]['text'].strip()
    except ClientError as e:
        error_msg = f"Bedrock API error: {str(e)}"
        logger.error(error_msg)
        return f"Error: {error_msg}"
    except KeyError as e:
        error_msg = f"Unexpected response format from Bedrock: {str(e)}"
        logger.error(error_msg)
        return f"Error: {error_msg}"
    except Exception as e:
        error_msg = f"Error generating SQL query: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return f"Error: {error_msg}"

def generate_natural_response(question, df, sql_query):
    """Generate a natural language response from query results"""
    try:
        bedrock = get_bedrock_client()
        if not bedrock:
            return "Error: Could not initialize Bedrock client"

        # Convert DataFrame to string representation
        df_str = df.to_string()
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": f"Given the following:\n\nOriginal question: \"{question}\"\nSQL Query used: {sql_query}\nQuery results:\n{df_str}\n\nPlease provide a natural language summary of the results. Theresponse should be:\n1. Conversational and easy to understand\n2. Include specific numbers and insights from the data\n3. Highlight any interesting patterns or findings\n4. Be concise but informative. Maximum 100 words.\n\nFormat the response in a way that a healthcare professional would find useful."
                }
            ],
            "max_tokens": 20000,
            "temperature": 0.7,
            "top_p": 0.999,
            "anthropic_version": "bedrock-2023-05-31"
        })
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            #modelId="anthropic.claude-3-7-sonnet-20250219-v1:0",
            body=body
        )

        response_body = json.loads(response['body'].read())
        #return response_body['completion'].strip()
        return response_body['content'][0]['text'].strip()
    except ClientError as e:
        error_msg = f"Bedrock API error: {str(e)}"
        logger.error(error_msg)
        return f"Error generating insights: {error_msg}"
    except KeyError as e:
        error_msg = f"Unexpected response format from Bedrock: {str(e)}"
        logger.error(error_msg)
        return f"Error generating insights: {error_msg}"
    except Exception as e:
        error_msg = f"Error generating natural language response: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return f"Error generating insights: {error_msg}"

def execute_query(query):
    """Execute SQL query with error handling"""
    connection = None
    cursor = None
    try:
        # First check if the query is safe
        is_safe, message = is_safe_query(query)
        if not is_safe:
            logger.warning(f"Unsafe query detected: {query}")
            return False, message

        # Check DB_CONFIG
        if not all(key in DB_CONFIG for key in ["host", "database", "user", "password", "port"]):
            logger.error("Missing required database configuration parameters")
            return False, "Database configuration error. Please contact support."

        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()

        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        results = cursor.fetchall()
        logger.info("Query executed successfully")
        return True, pd.DataFrame(results, columns=columns)
    except psycopg2.OperationalError as e:
        error_message = f"Database connection error: {str(e)}"
        logger.error(error_message)
        return False, "Unable to connect to the database. Please try again later."
    except psycopg2.ProgrammingError as e:
        error_message = str(e)
        logger.error(f"SQL Programming error: {error_message}")

        # Make error messages more user-friendly
        if "syntax error" in error_message.lower():
            return False, "There seems to be an issue with the query structure. Please try rephrasing your question."
        elif "does not exist" in error_message.lower():
            return False, "I couldn't find the data you're looking for. Please make sure you're asking about information from the healthcare dataset."
        elif "column" in error_message.lower() and "does not exist" in error_message.lower():
            return False, "I couldn't find one of the columns you're asking about. Please check the available fields and try again."
        else:
            return False, "There was an issue running your query. Please try rephrasing your question."
    except psycopg2.Error as e:
        logger.error(f"PostgreSQL error: {str(e)}")
        return False, "There was a database error. Please try rephrasing your question or contact support."
    except Exception as e:
        logger.error(f"Unexpected error in execute_query: {str(e)}\n{traceback.format_exc()}")
        return False, "An unexpected error occurred while executing the query."
    finally:
        try:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
        except Exception as e:
            logger.error(f"Error closing database resources: {str(e)}")

def get_secret():
    """Retrieve database credentials from AWS Secrets Manager"""
    try:
        secret_name = os.getenv('SECRET_NAME')
        region_name = os.getenv('AWS_REGION')

        # Create a Secrets Manager client
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name
        )

        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )

        secret = json.loads(get_secret_value_response['SecretString'])
        return secret
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'ResourceNotFoundException':
            logger.error(f"Secret '{secret_name}' not found")
        elif error_code == 'InvalidParameterException':
            logger.error(f"Invalid parameter provided to get_secret_value: {str(e)}")
        elif error_code == 'DecryptionFailureException':
            logger.error(f"Secret decryption failed: {str(e)}")
        else:
            logger.error(f"Secrets Manager client error: {str(e)}")
        return {}
    except NoCredentialsError:
        logger.error("AWS credentials not found for Secrets Manager")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in secret: {str(e)}")
        return {}
    except Exception as e:
        logger.error(f"Unexpected error retrieving secret: {str(e)}")
        return {}

# Try to get database credentials
try:
    db_creds = get_secret()
    if not db_creds:
        logger.error("Failed to retrieve database credentials")
        DB_CONFIG = {}
    else:
        DB_CONFIG = {
            "host": db_creds.get('host'),
            "database": db_creds.get('engine'),
            "user": db_creds.get('username'),
            "password": db_creds.get('password'),
            "port": db_creds.get('port')
        }

        # Check if all required values exist
        if not all(DB_CONFIG.values()):
            missing_keys = [k for k, v in DB_CONFIG.items() if not v]
            logger.error(f"Missing database configuration values: {', '.join(missing_keys)}")
except Exception as e:
    logger.error(f"Error setting up database configuration: {str(e)}")
    DB_CONFIG = {}

# UI Components
try:
    st.title("🏥 Healthcare Data Explorer")
    st.write("Ask questions about your healthcare data in plain English!")
    st.write("---")

    # Display an error if DB config is missing
    if not all(DB_CONFIG.values()):
        st.error("⚠️ Database configuration is incomplete. The application may not function correctly.")

    # Text input for questions
    user_question = st.text_input("Enter your question:", placeholder="Example: What is the average length of stay for patients over 60?")

    # Add a submit button
    if st.button("Generate and Execute Query", type="primary"):
        if user_question:
            try:
                with st.spinner("Generating SQL query..."):
                    sql_query = generate_sql_query(user_question)

                    # Check if there was an error generating the query
                    if sql_query.startswith("Error:"):
                        st.error(sql_query)
                    else:
                        # Check if query is safe before showing it
                        is_safe, safety_message = is_safe_query(sql_query)
                        if not is_safe:
                            st.error("⚠️ " + safety_message)
                            st.warning("Please rephrase your question to focus on retrieving information rather than modifying data.")
                        else:
                            with st.expander("View SQL Query"):
                                st.code(sql_query, language="sql")

                            with st.spinner("Executing query..."):
                                success, results = execute_query(sql_query)

                                if success:
                                    # Generate natural language response
                                    with st.spinner("Generating insights..."):
                                        natural_response = generate_natural_response(user_question, results, sql_query)

                                        # Check if there was an error generating insights
                                        if natural_response.startswith("Error generating insights:"):
                                            st.error(natural_response)
                                            # Still show the raw data
                                            st.write("### 📊 Raw Data")
                                            st.dataframe(results)
                                        else:
                                            # Display the natural language response in a nice format
                                            st.write("### 📊 Analysis")
                                            st.write(natural_response)

                                            # Show the raw data in an expander
                                            with st.expander("View Raw Data"):
                                                st.dataframe(results)
                                else:
                                    st.error("⚠️ " + results)
                                    st.info("💡 Try rephrasing your question or asking about different aspects of the healthcare data.")
            except Exception as e:
                logger.error(f"Unhandled exception in main flow: {str(e)}\n{traceback.format_exc()}")
                st.error(f"An unexpected error occurred: {str(e)}")
                st.info("💡 Try to be more specific in your question or break it down into simpler parts.")
        else:
            st.warning("Please enter a question first.")

    # Footer
    st.write("---")
    st.markdown("*Powered by Amazon Aurora PostgreSQL and Amazon Bedrock*")
except Exception as e:
    logger.error(f"Error in UI rendering: {str(e)}\n{traceback.format_exc()}")
    st.error("An unexpected error occurred while rendering the application interface.")
# Footer
st.write("---")
st.markdown("*Powered by Amazon Aurora PostgreSQL and Amazon Bedrock*")
