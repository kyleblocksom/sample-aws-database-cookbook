# lambda/load-sample-data/index.py

import os
import json
import boto3
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, Date, Numeric, Boolean, insert, select
from botocore.exceptions import ClientError
from datetime import datetime

def get_db_credentials(secret_arn):
    session = boto3.session.Session()
    client = session.client('secretsmanager')
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_arn
        )
    except ClientError as e:
        raise e
    else:
        if 'SecretString' in get_secret_value_response:
            # Fixed: Changed eval() to json.loads() for safer parsing
            secret = json.loads(get_secret_value_response['SecretString'])
            return secret
        else:
            raise ValueError("Secret binary is not supported")

def load_policy_data(connection, data, schema):
    # Define table structures using SQLAlchemy Core
    metadata = MetaData()
    
    policies_table = Table(os.environ['POLICIES_TABLE'], metadata,
        Column('policy_number', String),
        Column('policy_type', String),
        Column('policy_status', String),
        Column('issue_date', Date),
        Column('face_amount', Numeric),
        Column('policy_owner', String),
        Column('owner_date_of_birth', Date),
        Column('insured_person', String),
        schema=schema
    )
    
    premiums_table = Table(os.environ['PREMIUMS_TABLE'], metadata,
        Column('policy_number', String),
        Column('premium_amount', Numeric),
        Column('premium_frequency', String),
        Column('next_due_date', Date),
        schema=schema
    )
    
    addresses_table = Table(os.environ['ADDRESSES_TABLE'], metadata,
        Column('policy_number', String),
        Column('address_type', String),
        Column('street_address', String),
        Column('city', String),
        Column('state', String),
        Column('zip_code', String),
        Column('is_current', Boolean),
        schema=schema
    )
    
    beneficiaries_table = Table(os.environ['BENEFICIARIES_TABLE'], metadata,
        Column('policy_number', String),
        Column('beneficiary_name', String),
        Column('relationship', String),
        Column('percentage', Numeric),
        Column('is_primary', Boolean),
        schema=schema
    )
    
    payment_methods_table = Table(os.environ['PAYMENT_METHODS_TABLE'], metadata,
        Column('payment_method_id', Integer),
        Column('policy_number', String),
        Column('payment_type', String),
        Column('card_number', String),
        Column('card_last_four', String),
        Column('account_number', String),
        Column('routing_number', String),
        Column('expiration_date', Date),
        Column('is_default', Boolean),
        Column('status', String),
        schema=schema
    )
    
    payment_history_table = Table(os.environ['PAYMENT_HISTORY_TABLE'], metadata,
        Column('policy_number', String),
        Column('payment_method_id', Integer),
        Column('payment_amount', Numeric),
        Column('payment_date', Date),
        Column('payment_status', String),
        schema=schema
    )
    
    valuations_table = Table('policy_valuations', metadata,
        Column('policy_number', String),
        Column('net_cash_surrender', Numeric),
        Column('valuation_date', Date),
        schema=schema
    )
    
    try:
        print("Loading policies...")
        for policy in data['policies']:
            print(f"Processing policy {policy['policy_number']}")
            stmt = insert(policies_table).values(
                policy_number=policy['policy_number'],
                policy_type=policy['policy_type'],
                policy_status=policy['policy_status'],
                issue_date=policy['issue_date'],
                face_amount=policy['face_amount'],
                policy_owner=policy['policy_owner'],
                owner_date_of_birth=policy['owner_date_of_birth'],
                insured_person=policy['insured_person']
            )
            connection.execute(stmt)

        print("Loading premiums...")
        for premium in data['premiums']:
            print(f"Processing premium for policy {premium['policy_number']}")
            stmt = insert(premiums_table).values(
                policy_number=premium['policy_number'],
                premium_amount=premium['premium_amount'],
                premium_frequency=premium['premium_frequency'],
                next_due_date=premium['next_due_date']
            )
            connection.execute(stmt)

        print("Loading addresses...")
        for address in data['addresses']:
            print(f"Processing address for policy {address['policy_number']}")
            stmt = insert(addresses_table).values(
                policy_number=address['policy_number'],
                address_type=address['address_type'],
                street_address=address['street_address'],
                city=address['city'],
                state=address['state'],
                zip_code=address['zip_code'],
                is_current=address['is_current']
            )
            connection.execute(stmt)

        print("Loading beneficiaries...")
        for beneficiary in data['beneficiaries']:
            print(f"Processing beneficiary for policy {beneficiary['policy_number']}")
            stmt = insert(beneficiaries_table).values(
                policy_number=beneficiary['policy_number'],
                beneficiary_name=beneficiary['beneficiary_name'],
                relationship=beneficiary['relationship'],
                percentage=beneficiary['percentage'],
                is_primary=beneficiary.get('is_primary', False)
            )
            connection.execute(stmt)

        print("Loading payment methods...")
        for method in data['payment_methods']:
            print(f"Processing payment method for policy {method['policy_number']}")
            stmt = insert(payment_methods_table).values(
                policy_number=method['policy_number'],
                payment_type=method['payment_type'],
                card_number=method.get('card_number'),
                card_last_four=method.get('card_last_four'),
                account_number=method.get('account_number'),
                routing_number=method.get('routing_number'),
                expiration_date=method.get('expiration_date'),
                is_default=method.get('is_default', False),
                status='ACTIVE'
            )
            connection.execute(stmt)

        print("Loading payment history...")
        for payment in data['payment_history']:
            print(f"Processing payment for policy {payment['policy_number']}")
            # Get the payment method id
            stmt = select(payment_methods_table.c.payment_method_id).where(
                (payment_methods_table.c.policy_number == payment['policy_number']) &
                (payment_methods_table.c.payment_type == payment['payment_type']) &
                (payment_methods_table.c.is_default == True)
            )
            result = connection.execute(stmt)
            payment_method_id = result.fetchone()

            stmt = insert(payment_history_table).values(
                policy_number=payment['policy_number'],
                payment_method_id=payment_method_id[0] if payment_method_id else None,
                payment_amount=payment['payment_amount'],
                payment_date=payment['payment_date'],
                payment_status=payment['payment_status']
            )
            connection.execute(stmt)

        print("Loading policy valuations...")
        for valuation in data['policy_valuations']:
            print(f"Processing valuation for policy {valuation['policy_number']}")
            stmt = insert(valuations_table).values(
                policy_number=valuation['policy_number'],
                net_cash_surrender=valuation['net_cash_surrender'],
                valuation_date=valuation['valuation_date']
            )
            connection.execute(stmt)

    except KeyError as e:
        print(f"Missing required field in data: {str(e)}")
        raise
    except Exception as e:
        print(f"Error in load_policy_data: {str(e)}")
        raise

def handler(event, context):
    print(f"Starting sample data load at {datetime.now().isoformat()}")
    print("Event:", json.dumps(event, indent=2))
    print("Environment variables:", {k:v for k,v in os.environ.items() if 'secret' not in k.lower()})
    
    try:
        # Load policy data
        print("Getting policy database credentials...")
        policy_creds = get_db_credentials(os.environ['POLICY_SECRET_ARN'])
        
        print(f"Connecting to policy database at {os.environ['POLICY_CLUSTER_ENDPOINT']}...")
        engine = create_engine(f"postgresql://{policy_creds['username']}:{policy_creds['password']}@{os.environ['POLICY_CLUSTER_ENDPOINT']}/{os.environ['POLICY_DB_NAME']}")
        connection = engine.connect()
        
        print("Loading policy sample data...")
        sample_data_path = 'shared/sample-data/policy_data.json'
        
        # Debug directory contents
        print("Current directory:", os.getcwd())
        print("Directory contents:", os.listdir('.'))
        if os.path.exists('shared'):
            print("Shared directory contents:", os.listdir('shared'))
            if os.path.exists('shared/sample-data'):
                print("Sample-data directory contents:", os.listdir('shared/sample-data'))
        
        try:
            with open(sample_data_path, 'r') as f:
                policy_data = json.load(f)
                print("Sample data content:")
                print(json.dumps(policy_data, indent=2))
                print(f"Found {len(policy_data['policies'])} policies to load")
                load_policy_data(connection, policy_data, os.environ['POLICY_SCHEMA'])
                connection.commit()
                print("Policy data committed successfully")
        except FileNotFoundError:
            print(f"Error: Could not find file at {sample_data_path}")
            raise
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in sample data file: {e}")
            raise
        except Exception as e:
            connection.rollback()
            raise e
        finally:
            connection.close()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Sample data loaded successfully',
                'timestamp': datetime.now().isoformat()
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise


