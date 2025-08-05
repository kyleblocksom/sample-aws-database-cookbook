// lib/knowledge-base.ts

import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

interface KnowledgeBaseProps {
    kbName: string;
    roleArn: string;
    clusterArn: string;
    secretArn: string;
    databaseName: string;
    tableName: string;
    region: string;
}

export class KnowledgeBase extends Construct {
    constructor(scope: Construct, id: string, props: KnowledgeBaseProps) {
        super(scope, id);

        const kb = new bedrock.CfnKnowledgeBase(this, 'BedrockKnowledgeBase', {
            name: props.kbName,
            roleArn: props.roleArn,
            knowledgeBaseConfiguration: {
                type: 'VECTOR',
                vectorKnowledgeBaseConfiguration: {
                    embeddingModelArn: `arn:aws:bedrock:${props.region}::foundation-model/amazon.titan-embed-text-v1`
                }
            },
            storageConfiguration: {
                type: 'RDS',
                rdsConfiguration: {
                    resourceArn: props.clusterArn,
                    credentialsSecretArn: props.secretArn,
                    databaseName: props.databaseName,
                    tableName: props.tableName,
                    fieldMapping: {
                        primaryKeyField: 'id',
                        vectorField: 'embedding',
                        textField: 'chunks',
                        metadataField: 'metadata'
                    }
                }
            }
        });

        // Apply removal policy
        kb.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }
}
