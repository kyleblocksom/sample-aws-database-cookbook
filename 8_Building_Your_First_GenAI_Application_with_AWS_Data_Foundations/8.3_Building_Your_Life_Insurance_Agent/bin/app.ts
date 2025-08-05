// bin/app.ts

import * as cdk from 'aws-cdk-lib';
import { BedrockStack } from '../lib/bedrock-stack';
import { StreamlitAppStack } from '../lib/streamlit-stack';
import { CodePipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Get context values
const appContext = app.node.tryGetContext('app');
const vpc_context = app.node.tryGetContext('vpc');

// Define common environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

// Create Bedrock stack first
const bedrockStack = new BedrockStack(app, `${appContext.name}-BedrockStack`, {
  env,
  stackName: `${appContext.name}-bedrock`,
  description: 'Bedrock Components Stack'
});

// Create Pipeline stack second
const pipelineStack = new CodePipelineStack(app, `${appContext.name}-CodePipelineStack`, {
  env,
  stackName: `${appContext.name}-pipeline`,
  description: 'CI/CD Pipeline Stack',
  vpcId: bedrockStack.getVpc().vpcId,
  publicSubnetIds: bedrockStack.getPublicSubnetIds(),
  privateSubnetIds: bedrockStack.getPrivateSubnetIds(),
  ecsClusterName: `${appContext.name}-cluster`,
  ecsServiceName: `${appContext.name}-service` 
});

// Create Streamlit stack last
const streamlitStack = new StreamlitAppStack(app, `${appContext.name}-StreamlitAppStack`, {
  env,
  stackName: `${appContext.name}-streamlit`,
  description: 'Streamlit Application Stack',
  bedrockAgentId: bedrockStack.getBedrockAgent(),
  bedrockVpcId: bedrockStack.getVpc().vpcId,
  bedrockLambdaSecurityGroupId: bedrockStack.getLambdaSecurityGroup().securityGroupId,
  bedrockKnowledgeBaseId: bedrockStack.getKnowledgeBaseId(),
  bedrockGuardrailId: bedrockStack.getGuardrailId(),
  publicSubnetIds: bedrockStack.getPublicSubnetIds().slice(0, vpc_context.maxAzs),
  privateSubnetIds: bedrockStack.getPrivateSubnetIds().slice(0, vpc_context.maxAzs),
  vpcCidrBlock: bedrockStack.getVpc().vpcCidrBlock,
  // Add VPC endpoint IDs
  s3EndpointId: bedrockStack.getS3EndpointId(),
  ecrDockerEndpointId: bedrockStack.getEcrDockerEndpointId(),
  ecrEndpointId: bedrockStack.getEcrEndpointId(),
  cloudWatchEndpointId: bedrockStack.getCloudWatchEndpointId(),
  // Add ECR repository
  ecrRepository: pipelineStack.getEcrRepository()
});

// Add stack tags
cdk.Tags.of(bedrockStack).add('Project', appContext.name);
cdk.Tags.of(pipelineStack).add('Project', appContext.name);
cdk.Tags.of(streamlitStack).add('Project', appContext.name);

// Set dependencies
pipelineStack.addDependency(bedrockStack);
streamlitStack.addDependency(bedrockStack);
streamlitStack.addDependency(pipelineStack);

app.synth();
