// lambda/associate-kb/index.ts

import { 
    BedrockAgentClient, 
    AssociateAgentKnowledgeBaseCommand,
    AssociateAgentKnowledgeBaseCommandInput,
    AssociateAgentKnowledgeBaseCommandOutput
} from "@aws-sdk/client-bedrock-agent";

export const handler = async (event: any) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    if (event.RequestType === 'Delete') {
        return {
            PhysicalResourceId: event.PhysicalResourceId,
            Status: 'SUCCESS'
        };
    }

    const client = new BedrockAgentClient({});
    
    try {
        const commandInput: AssociateAgentKnowledgeBaseCommandInput = {
            agentId: event.ResourceProperties.agentId,
            knowledgeBaseId: event.ResourceProperties.knowledgeBaseId,
            description: event.ResourceProperties.instruction,
            agentVersion: event.ResourceProperties.agentVersion || 'DRAFT'
        };

        const command = new AssociateAgentKnowledgeBaseCommand(commandInput);
        const response = await client.send(command);
        console.log('Associate KB response:', JSON.stringify(response, null, 2));

        return {
            PhysicalResourceId: `${event.ResourceProperties.agentId}-${event.ResourceProperties.knowledgeBaseId}`,
            Status: 'SUCCESS',
            Data: {
                AgentKnowledgeBase: response.agentKnowledgeBase // Changed from agentKnowledgeBaseAssociation
            }
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            PhysicalResourceId: 'failed-kb-association',
            Status: 'FAILED',
            Reason: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
