// lambda/cluster-waiter/index.ts

import { 
  RDSClient, 
  DescribeDBClustersCommand, 
  DescribeDBInstancesCommand,
  DBCluster,
  DBInstance
} from '@aws-sdk/client-rds';

interface CustomResourceEvent {
  RequestType: 'Create' | 'Update' | 'Delete';
  PhysicalResourceId?: string;
  ResourceProperties: {
    policyClusterArn: string;
    kbClusterArn: string;
  };
}

interface CustomResourceResponse {
  PhysicalResourceId: string;
  Status: 'SUCCESS' | 'FAILED';
  Reason?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForClusterAndInstances(rds: RDSClient, clusterId: string, maxAttempts = 60, delay = 30000): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Check cluster status
            const clusterCommand = new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId });
            const clusterResponse = await rds.send(clusterCommand);
            const cluster = clusterResponse.DBClusters?.[0] as DBCluster;
            
            if (!cluster || cluster.Status !== 'available') {
                console.log(`Attempt ${attempt + 1}: Cluster ${clusterId} not yet available. Status: ${cluster?.Status}`);
                await sleep(delay);
                continue;
            }
            
            // Check instances status
            const instanceCommand = new DescribeDBInstancesCommand({
                Filters: [{ Name: 'db-cluster-id', Values: [clusterId] }]
            });
            const instanceResponse = await rds.send(instanceCommand);
            const instances = instanceResponse.DBInstances as DBInstance[];
            
            if (!instances || instances.length === 0) {
                console.log(`Attempt ${attempt + 1}: No instances found for cluster ${clusterId}`);
                await sleep(delay);
                continue;
            }
            
            const allInstancesAvailable = instances.every(
                (instance: DBInstance) => instance.DBInstanceStatus === 'available'
            );
            
            if (allInstancesAvailable) {
                console.log(`All instances are available for cluster ${clusterId}`);
                return true;
            }
            
            console.log(`Attempt ${attempt + 1}: Not all instances available yet for cluster ${clusterId}`);
            await sleep(delay);
        } catch (error) {
            console.error(`Error checking status for cluster ${clusterId}:`, error);
            await sleep(delay);
        }
    }
    throw new Error(`Cluster ${clusterId} or its instances did not become available within the expected time`);
}

export const handler = async (event: CustomResourceEvent): Promise<CustomResourceResponse> => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    if (event.RequestType === 'Delete') {
        return {
            PhysicalResourceId: event.PhysicalResourceId || '',
            Status: 'SUCCESS'
        };
    }
    
    try {
        const rds = new RDSClient({ region: process.env.AWS_REGION });
        
        // Wait for policy cluster
        const policyClusterId = event.ResourceProperties.policyClusterArn.split(':cluster:')[1];
        console.log('Waiting for policy cluster:', policyClusterId);
        await waitForClusterAndInstances(rds, policyClusterId);
        
        // Wait for KB cluster
        const kbClusterId = event.ResourceProperties.kbClusterArn.split(':cluster:')[1];
        console.log('Waiting for KB cluster:', kbClusterId);
        await waitForClusterAndInstances(rds, kbClusterId);
        
        return {
            PhysicalResourceId: `${policyClusterId}-${kbClusterId}`,
            Status: 'SUCCESS'
        };
    } catch (error) {
        console.error('Error waiting for clusters:', error);
        return {
            PhysicalResourceId: 'failed-cluster-wait',
            Status: 'FAILED',
            Reason: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
