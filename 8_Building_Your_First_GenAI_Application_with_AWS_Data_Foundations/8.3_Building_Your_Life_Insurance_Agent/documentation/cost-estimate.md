# Cost Estimate (as of July 2025)
---

## Overview

This cost analysis provides detailed pricing estimates for deploying and operating a life insurance policy management solution using Amazon Bedrock Agents and Knowledge Bases with Aurora PostgreSQL. All prices are based on the us-east-1 region.

### Core Business Assumptions

**Policy Management:**
- Active policies: 50,000
- Policy updates: 5,000/month (10% modification rate)
- New policies: 500/month (1% growth rate)
- Policy queries: 25,000/month (50% read rate)

**User Base:**
- Total users: 1,000
- Peak concurrent users: 200 (20% of total)
- Active hours: 12/day (business hours)
- Average session length: 20 minutes

**Agent Interactions:**
- Daily interactions: 1,000
- Monthly interactions: 22,000 (business days)
- Average conversation turns: 5
- Query success rate: 95%

### Derived Technical Requirements

**Database Operations:**
- Policy DB:
  - Read ops: 75,000/month (queries + agent lookups)
  - Write ops: 5,500/month (updates + new policies)
  - Storage: 100GB (2MB per policy × 50,000)

- Knowledge Base:
  - Vector queries: 22,000/month (agent interactions)
  - Document updates: 100/month
  - Storage: 150GB (base documents + embeddings)

**API Traffic:**
- Total API calls: 500,000/month
  - Policy queries: 25,000
  - Policy updates: 5,500
  - Agent interactions: 110,000 (22,000 × 5 turns)
  - Authentication: 30,000
  - System operations: 329,500

**Data Transfer:**
- Inbound: 50GB/month
  - Policy updates: 10GB
  - Document uploads: 20GB
  - User interactions: 20GB

- Outbound: 150GB/month
  - Policy data: 50GB
  - Agent responses: 50GB
  - Web interface: 50GB

## Infrastructure Costs

### 1. Aurora PostgreSQL Clusters

#### Policy Database Cluster (2× T3.Medium)
[Assumption: Sized for 50,000 policies, 80,500 monthly operations]
- **Instance Costs:**
  - $0.082/hour × 2 instances × 730 hours = $119.72
  - Multi-AZ for 99.9% availability
  - 8GB RAM, 2 vCPU sufficient for workload

- **Storage Costs:**
  - Base storage: 100GB (2MB × 50,000 policies) at $0.12/GB = $12.00
  - Growth: 1GB/month (500 new policies × 2MB)
  - Backup storage: 100GB included in retention period

- **I/O Operations:**
  - Read operations: 75,000/month × $0.22/1M = $0.02
  - Write operations: 5,500/month × $0.22/1M = $0.001
  - Based on derived operation counts

- **Backup Storage:**
  - Retention period: 7 days included
  - Additional backup storage: None needed for current scale

**Policy Database Monthly Subtotal: $131.74**

#### Knowledge Base Cluster (2× R6g.Large)
[Assumption: Sized for vector operations, 22,000 monthly queries]
- **Instance Costs:**
  - $0.25/hour × 2 instances × 730 hours = $365.00
  - Memory-optimized for vector operations
  - Multi-AZ for high availability

- **Storage Costs:**
  - Base documents: 50GB at $0.12/GB = $6.00
  - Vector embeddings: 100GB at $0.12/GB = $12.00
  - Total: 150GB × $0.12/GB = $18.00

- **I/O Operations:**
  - Vector queries: 22,000/month × $0.22/1M = $0.005
  - Document updates: 100/month × $0.22/1M = $0.001
  - Based on agent interaction volume

**Knowledge Base Monthly Subtotal: $383.01**

### 2. Amazon ECS Fargate (Streamlit Application)
[Assumption: Sized for 200 concurrent users]

- **Task Configuration:**
  - Tasks: 2 base + 1 for HA = 3 total
  - CPU: 1 vCPU per task (sufficient for 70 concurrent users each)
  - Memory: 4 GB per task
  - Running hours: Business hours + buffer = 16/day

- **Compute Costs:**
  - vCPU: $0.04048/hour × 1 vCPU × 3 tasks × 487 hours = $59.10
  - Memory: $0.004445/GB-hour × 4 GB × 3 tasks × 487 hours = $25.98
  - Hours based on 16 hours × 30.4 days = 487

**Fargate Monthly Subtotal: $85.08**

### 3. Network Infrastructure

#### Data Transfer Costs
[Assumption: Based on 200GB total monthly transfer]

- **Internet Egress:**
  - Policy data: 50GB × $0.09/GB = $4.50
  - Agent responses: 50GB × $0.09/GB = $4.50
  - Web interface: 50GB × $0.09/GB = $4.50
  Total: 150GB × $0.09/GB = $13.50

- **Regional Transfer:**
  - VPC to CloudFront: 50GB × $0.02/GB = $1.00
  - Inter-AZ: Minimal, included in instance costs

#### VPC Infrastructure
[Assumption: Based on 200 concurrent users, 500,000 monthly API calls]

- **NAT Gateway Costs:**
  - Processing: $0.045/hour × 487 hours = $21.92
  - Data transfer: 50GB/month × $0.045/GB = $2.25
  - Hours based on business hours + buffer

- **VPC Endpoint Costs:**
  - Interface endpoints (4): $0.01/hour × 4 × 487 = $19.48
  - Required endpoints:
    - Secrets Manager: API calls for credentials
    - ECR API/DKR: Container image pulls
    - CloudWatch: Logging and monitoring
  - Gateway endpoints (S3): Free

**VPC Monthly Subtotal: $43.65**

#### Application Load Balancer
[Assumption: Sized for 200 concurrent users]

- **ALB Configuration:**
  - Running hours: 487 (business hours + buffer)
  - Average connection duration: 20 minutes
  - New connections per hour: 600 (200 users × 3 sessions)

- **Fixed Costs:**
  - ALB hours: $0.0225/hour × 487 = $10.96
  - Capacity Units:
    - New connections: 292,200/month (600/hour × 487 hours)
    - Active connections: 200 peak
    - Processed bytes: 150GB/month
  - LCU cost: $0.008/LCU-hour × 487 = $3.90

**ALB Monthly Subtotal: $14.86**

#### Amazon CloudFront
[Assumption: Web interface delivery for 1,000 users]

- **Usage Pattern:**
  - Data transfer out: 50GB/month (web interface)
  - Requests: 500,000/month (average 500 per user)
  - Regional data transfer: 25GB/month

- **Data Transfer Costs:**
  - First 10TB: $0.085/GB × 50GB = $4.25
  - Regional transfer: $0.02/GB × 25GB = $0.50

- **Request Costs:**
  - HTTP/HTTPS requests: $0.0075/10K × 50 = $0.38

**CloudFront Monthly Subtotal: $5.13**

### 4. AI/ML Services

#### Amazon Bedrock
[Assumption: 1,000 daily interactions, 22,000 monthly]

- **Foundation Model Usage (Claude 3 Haiku):**
  - Monthly interactions: 22,000
  - Average tokens per interaction:
    - Input: 750 tokens (policy details + user query)
    - Output: 1,500 tokens (formatted response)
  - Pricing:
    - Input: $0.00025/1K tokens
    - Output: $0.00125/1K tokens

- **Token Cost Calculation:**
  - Input costs: 
    - 22,000 × 750 tokens = 16.5M tokens
    - 16.5M tokens × ($0.00025/1K) = $4.13
  - Output costs:
    - 22,000 × 1,500 tokens = 33M tokens
    - 33M tokens × ($0.00125/1K) = $41.25

**Bedrock Monthly Subtotal: $45.38**

#### Amazon Bedrock Knowledge Base
[Assumption: Based on agent interaction volume]

- **Vector Operations:**
  - Queries: 22,000/month (one per interaction)
  - Query pricing: $0.0001 per query
  - Query cost: 22,000 × $0.0001 = $2.20

- **Embedding Generation:**
  - Document updates: 100/month
  - Average chunks per document: 10
  - Embedding cost: $0.0001/chunk
  - Processing cost: 100 × 10 × $0.0001 = $0.10

**Knowledge Base Monthly Subtotal: $2.30**

### 5. Serverless Components

#### AWS Lambda Functions
[Assumption: Based on API calls and agent interactions]

- **Action Group Handlers:**
  - Invocations: 22,000/month (agent interactions)
  - Average duration: 3 seconds
  - Memory: 512 MB
  - Compute: $0.0000166667 × 0.5 GB × 3s × 22,000 = $0.55

- **Policy Operations:**
  - Invocations: 30,500/month (queries + updates)
  - Average duration: 2 seconds
  - Compute: $0.0000166667 × 0.5 GB × 2s × 30,500 = $0.51

- **System Operations:**
  - Invocations: 1,000/month
  - Average duration: 5 seconds
  - Compute: $0.0000166667 × 0.5 GB × 5s × 1,000 = $0.04

**Lambda Monthly Subtotal: $1.10**


#### Amazon DynamoDB
[Assumption: Based on 1,000 users, 22,000 monthly agent interactions]

- **Chat History Table:**
  - **Storage:**
    - Average conversation size: 5KB
    - Monthly conversations: 22,000
    - 30-day retention: 5KB × 22,000 = 110MB
    - Storage cost: 0.11GB × $0.25/GB = $0.03
  
  - **Write Operations:**
    - New messages: 110,000 (22,000 conversations × 5 turns)
    - Write units: 110,000 × 1KB/unit = 110,000 WCU
    - Cost: 110,000 × $1.25/million = $0.14

  - **Read Operations:**
    - Session retrievals: 22,000
    - Read units: 22,000 × 4KB/unit = 88,000 RCU
    - Cost: 88,000 × $0.25/million = $0.02

- **Feedback Table:**
  - **Storage:**
    - Feedback size: 2KB
    - Monthly feedback: 2,200 (10% of interactions)
    - Storage: 2KB × 2,200 = 4.4MB
    - Storage cost: 0.0044GB × $0.25/GB = $0.001

  - **Write Operations:**
    - New feedback: 2,200/month
    - Write units: 2,200 × 1KB/unit = 2,200 WCU
    - Cost: 2,200 × $1.25/million = $0.003

  - **Read Operations:**
    - Analytics queries: 1,000/month
    - Read units: 1,000 × 4KB/unit = 4,000 RCU
    - Cost: 4,000 × $0.25/million = $0.001

**DynamoDB Monthly Subtotal: $0.20**

### 6. Supporting Services

#### Amazon CloudWatch
[Assumption: Based on infrastructure scale and monitoring requirements]

- **Logs:**
  - ECS Application logs:
    - 3 tasks × 2MB/hour × 487 hours = 2.92GB
  - Lambda logs:
    - 53,500 invocations × 5KB = 0.27GB
  - Aurora logs:
    - 2 clusters × 1MB/hour × 730 hours = 1.46GB
  - ALB access logs:
    - 500,000 requests × 1KB = 0.5GB
  Total log volume: 5.15GB

  - Ingestion: 5.15GB × $0.50/GB = $2.58
  - Storage: 5.15GB × $0.03/GB = $0.15

- **Metrics:**
  - Essential metrics: 50
    - Infrastructure: 20 metrics
    - Application: 20 metrics
    - Business: 10 metrics
  - Data points: 216,000
    (50 metrics × 24 hours × 30 days × 6 points/hour)
  - Cost: 216,000 × $0.30/1000 = $64.80

- **Dashboards:**
  - Number of dashboards: 3
    - Operations dashboard
    - Business metrics dashboard
    - Cost monitoring dashboard
  - Cost per dashboard: $3.00
  - Dashboard cost: 3 × $3.00 = $9.00

- **Alarms:**
  - Critical alarms: 20
    - Infrastructure: 10
    - Application: 7
    - Business metrics: 3
  - Cost per alarm: $0.10
  - Alarm cost: 20 × $0.10 = $2.00

**CloudWatch Monthly Subtotal: $78.53**

#### AWS Secrets Manager
[Assumption: Based on essential credentials and access patterns]

- **Secrets Stored:**
  1. Aurora Policy DB credentials
  2. Aurora Knowledge Base DB credentials
  3. Cognito app client credentials

- **Secret Costs:**
  - Storage: 3 secrets × $0.40/secret = $1.20
  - API calls:
    - Application startup: 3 × 487 hours = 1,461
    - Lambda invocations: 53,500
    - Total calls: 54,961
    - First 10,000 free
    - Remaining: 44,961 × $0.05/10,000 = $0.22

**Secrets Manager Monthly Subtotal: $1.42**

### 7. Operational Components

#### AWS CodePipeline
[Assumption: Based on development and deployment patterns]

- **Pipeline Usage:**
  - Active pipeline: 1
  - Monthly cost: $1.00
  - Average deployments: 20/month

- **CodeBuild Minutes:**
  - Build environment: General1.Medium
  - Average build time: 8 minutes
  - Monthly builds: 20
  - Cost: 20 × 8 × $0.005 = $0.80

**Pipeline Monthly Subtotal: $1.80**

#### Amazon ECR
[Assumption: Based on container image storage and pull patterns]

- **Storage:**
  - Base images: 2GB
  - Application images: 1GB
  - Storage cost: 3GB × $0.10 = $0.30

- **Data Transfer:**
  - Image pulls: 3 tasks × 20 deployments × 1GB = 60GB
  - Regional transfer: Included

**ECR Monthly Subtotal: $0.30**

## Total Cost Summary
[All costs aligned with 50,000 policies, 200 concurrent users, 22,000 monthly agent interactions]

1. Core Infrastructure: $599.83
   - Aurora PostgreSQL (Policy): $131.74
   - Aurora PostgreSQL (KB): $383.01
   - ECS Fargate: $85.08

2. Network Infrastructure: $63.64
   - VPC & Endpoints: $43.65
   - ALB: $14.86
   - CloudFront: $5.13

3. AI/ML Services: $47.68
   - Bedrock: $45.38
   - Knowledge Base: $2.30

4. Serverless Components: $1.30
   - Lambda: $1.10
   - DynamoDB: $0.20

5. Supporting Services: $82.05
   - CloudWatch: $78.53
   - Secrets Manager: $1.42
   - CodePipeline: $1.80
   - ECR: $0.30

**Total Monthly Cost: $794.50**

### Cost Optimization Opportunities
[Based on usage patterns]

1. Compute Optimization:
   - Reserved Instances for Aurora (40% savings potential)
   - Compute Savings Plan for Fargate (30% savings potential)
   - Right-sizing based on actual usage patterns

2. Storage Optimization:
   - CloudWatch log retention policies
   - DynamoDB TTL management
   - ECR image lifecycle policies

3. Performance Optimization:
   - Cache hit ratio improvements
   - Query optimization
   - Connection pooling

### Cost Variability Factors

1. Usage Pattern Changes:
   - Policy volume growth
   - User concurrency spikes
   - Agent interaction frequency

2. Data Characteristics:
   - Document complexity
   - Update frequency
   - Query patterns

3. Business Hours:
   - Extended operation hours
   - Regional coverage
   - Seasonal variations

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0