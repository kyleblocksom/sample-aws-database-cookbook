# lambda/associate-kb/index.py

import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_agent = boto3.client('bedrock-agent')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Custom resource handler to associate a knowledge base with a Bedrock agent
    """
    logger.info(f"Event: {event}")
    
    request_type = event['RequestType']
    
    try:
        # For Delete requests, just return success
        if request_type == 'Delete':
            logger.info("Delete request received - no action needed")
            return {
                'PhysicalResourceId': event.get('PhysicalResourceId', 'kb-association'),
                'Data': {
                    'Status': 'DELETED'
                }
            }

        # Extract properties from the event
        properties = event['ResourceProperties']
        agent_id = properties['agentId']
        agent_version = properties.get('agentVersion', 'DRAFT')
        knowledge_base_id = properties['knowledgeBaseId']
        description = properties.get('description', 'Agent knowledge base association')
        
        if request_type in ['Create', 'Update']:
            logger.info(f"Associating knowledge base {knowledge_base_id} with agent {agent_id}")
            
            try:
                response = bedrock_agent.associate_agent_knowledge_base(
                    agentId=agent_id,
                    agentVersion=agent_version,
                    knowledgeBaseId=knowledge_base_id,
                    description=description,
                    knowledgeBaseState='ENABLED'
                )
                
                logger.info(f"Association response: {response}")
                
                return {
                    'PhysicalResourceId': f"{agent_id}-{knowledge_base_id}",
                    'Data': {
                        'AgentId': agent_id,
                        'KnowledgeBaseId': knowledge_base_id,
                        'Status': 'ENABLED'
                    }
                }
            except bedrock_agent.exceptions.ClientError as e:
                logger.error(f"Bedrock Agent error: {str(e)}")
                raise e
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        # Don't raise an exception during Delete
        if request_type == 'Delete':
            return {
                'PhysicalResourceId': event.get('PhysicalResourceId', 'kb-association'),
                'Data': {
                    'Status': 'DELETE_FAILED_BUT_CONTINUING'
                }
            }
        raise Exception(f"Failed to associate knowledge base: {str(e)}")

