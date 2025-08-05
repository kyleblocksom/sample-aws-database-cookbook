# lambda/initialize-db/index.py

import os
import json
import boto3
import psycopg2
from botocore.exceptions import ClientError

def log_environment():
    """Log all environment variables (excluding sensitive data)"""
    sensitive_keys = {'SECRET_ARN', 'password', 'secret'}
    env_vars = {}
    for key, value in os.environ.items():
        if not any(sensitive in key.lower() for sensitive in sensitive_keys):
            env_vars[key] = value
    print("Environment variables:", json.dumps(env_vars, indent=2))

def validate_environment():
    """Validate all required environment variables are present"""
    common_vars = [
        'DB_NAME',
        'CLUSTER_ENDPOINT',
        'SECRET_ARN',
        'SQL_DIR',
        'SQL_FILE'
    ]
    
    policy_vars = [
        'POLICY_SCHEMA',
        'POLICIES_TABLE',
        'PREMIUMS_TABLE',
        'ADDRESSES_TABLE',
        'BENEFICIARIES_TABLE',
        'PAYMENT_HISTORY_TABLE',
        'PAYMENT_METHODS_TABLE'
    ]
    
    kb_vars = [
        'KB_SCHEMA_NAME',
        'KB_MAIN_TABLE_NAME'
    ]
    
    sql_file = os.environ.get('SQL_FILE', '')
    if sql_file == 'policy_db_tables.sql':
        required_vars = common_vars + policy_vars
    elif sql_file == 'kb_tables.sql':
        required_vars = common_vars + kb_vars
    else:
        raise ValueError(f"Unknown SQL file: {sql_file}")
    
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

def get_db_credentials():
    """Get database credentials from Secrets Manager"""
    session = boto3.session.Session()
    client = session.client('secretsmanager')
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=os.environ['SECRET_ARN']
        )
    except ClientError as e:
        print(f"Error getting secret: {str(e)}")
        raise e
    else:
        if 'SecretString' in get_secret_value_response:
            secret = json.loads(get_secret_value_response['SecretString'])
            return secret
        else:
            raise ValueError("Secret binary is not supported")

def execute_sql(cur, sql):
    """Execute SQL statement and handle errors"""
    try:
        cur.execute(sql)
    except psycopg2.Error as e:
        print(f"Error executing SQL: {e}")
        print(f"Problematic SQL: {sql}")
        raise

def handler(event, context):
    try:
        print("Starting database initialization")
        log_environment()
        validate_environment()
        
        # Get DB credentials
        print("Getting database credentials")
        creds = get_db_credentials()
        
        # Connect to database
        print(f"Connecting to database {os.environ['DB_NAME']} at {os.environ['CLUSTER_ENDPOINT']}")
        conn = psycopg2.connect(
            host=os.environ['CLUSTER_ENDPOINT'],
            database=os.environ['DB_NAME'],
            user=creds['username'],
            password=creds['password']
        )
        
        # Create a cursor
        cur = conn.cursor()
        
        # Read SQL file
        sql_path = os.path.join(os.environ['SQL_DIR'], os.environ['SQL_FILE'])
        print(f"Reading SQL file from: {sql_path}")
        
        with open(sql_path, 'r') as file:
            sql_template = file.read()

        # Replace placeholders based on SQL file type
        if os.environ['SQL_FILE'] == 'policy_db_tables.sql':
            replacements = {
                '${POLICY_SCHEMA}': os.environ['POLICY_SCHEMA'],
                '${POLICIES_TABLE}': os.environ['POLICIES_TABLE'],
                '${PREMIUMS_TABLE}': os.environ['PREMIUMS_TABLE'],
                '${ADDRESSES_TABLE}': os.environ['ADDRESSES_TABLE'],
                '${BENEFICIARIES_TABLE}': os.environ['BENEFICIARIES_TABLE'],
                '${PAYMENT_HISTORY_TABLE}': os.environ['PAYMENT_HISTORY_TABLE'],
                '${PAYMENT_METHODS_TABLE}': os.environ['PAYMENT_METHODS_TABLE']
            }
            
            sql = sql_template
            for key, value in replacements.items():
                sql = sql.replace(key, value)
                
        elif os.environ['SQL_FILE'] == 'kb_tables.sql':
            sql = sql_template.replace('${KB_SCHEMA_NAME}', os.environ['KB_SCHEMA_NAME'])
            sql = sql.replace('${KB_MAIN_TABLE_NAME}', os.environ['KB_MAIN_TABLE_NAME'])
        
        # Execute SQL
        execute_sql(cur, sql)
        
        # Commit the transaction
        conn.commit()
        print("Successfully committed all changes")
        
        # Close cursor and connection
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': 'Database initialized successfully'
        }
    
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        # Log the full traceback
        import traceback
        traceback.print_exc()
        raise e
