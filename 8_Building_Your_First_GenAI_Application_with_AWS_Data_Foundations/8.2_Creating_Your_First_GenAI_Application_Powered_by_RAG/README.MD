# 8.2 Creating Your First GenAI Application Powered by RAG

## Overview 📋

Welcome to the exciting world of Generative AI applications powered by Retrieval Augmented Generation (RAG)! 🚀

In this hands-on section, we'll transform the concepts explored in the previous chapter into a working application that leverages your data as a strategic asset. RAG combines the power of large language models with your own data, enabling more accurate, relevant, and trustworthy AI responses.

By the end of this section, you'll understand how to build production-ready RAG applications using Amazon Bedrock and Amazon Aurora PostgreSQL with pgvector, implementing best practices for performance, cost optimization, and scalability.

## Topics

- [Overview 📋](#overview-)
- [What We'll Build Together](#what-we'll-build-together)
- [Prerequisites](#prerequisites)
- [Build cost-performance optimized RAG with Aurora pgvector](#build-cost-performance-optimized-rag-with-aurora-pgvector)
- [Cost Overview 💰](#cost-overview-)

## What We'll Build Together

- **[Quick Demo: Bedrock Knowledge Base](8.2.1_bedrock_knowledge_base_demo.ipynb)** - Create a RAG application in minutes using the Amazon Bedrock console
- **[Building a RAG Application with Aurora PostgreSQL](8.2.2_aurora_pgvector_rag_application.ipynb)** - Implement a complete RAG solution with vector storage, embedding generation, and query processing

## Prerequisites

You'll need:
- An AWS Account with access to Amazon Bedrock and Amazon Aurora
- Basic Python knowledge
- Familiarity with SQL concepts
- An Aurora PostgreSQL cluster (can use one created in [Section 2.1](../../2_Your_First_Database_on_AWS/2.1_Crearting_Your_First_Aurora_Cluster/README.MD) or you create a new one using "Quick create a new vector store" from Amazon Bedrock Knowledge Base.

## Console Walkthrough - Create Amazon Bedrock Knowledge

![Console Walkthrough - Create Amazon Bedrock Knowledge](./images/8.2-create-bedrock-knowledge-base.gif)

## Build cost-performance optimized RAG with Aurora pgvector

### Cost-Performance Optimization Considerations for RAG

#### Ingestion and Storage
- **LLM Parsing**: Use specialized models for document parsing to improve quality while reducing costs
- **Chunking Strategy**:
  - **Hierarchical**: Create multi-level chunks (document → section → paragraph) for context preservation
  - **Semantic**: Split documents based on semantic boundaries rather than fixed sizes
  - **Custom chunking**: Develop domain-specific chunking strategies for specialized content
- **Vector DB Selection**: Choose the [right vector database based on your specific requirements](https://aws.amazon.com/blogs/database/key-considerations-when-choosing-a-database-for-your-generative-ai-applications/)

#### Retrieval Stage
- **Query Decomposition**: Break complex queries into simpler sub-queries for more accurate retrieval
- **Vector Indexing**: Select appropriate indexing methods based on dataset size and query patterns
- **Metadata Filtering**: Apply pre-filtering based on metadata before vector search to reduce search space
- **Hybrid Search**: Combine vector similarity with keyword-based search for improved relevance
- **Semantic Cache**: Store previous query results to avoid redundant processing of similar queries

#### Generic Optimizations
- **Model Selection**:
  - Large models for complex reasoning and generation tasks
  - Smaller models for embedding generation and simpler tasks
- **Leverage Managed Services**:
  - Amazon Bedrock for foundation models without infrastructure management
  - Amazon SageMaker for custom model deployment and optimization
  - Amazon Bedrock Knowledge Bases for simplified RAG implementation
- **Monitoring & Cost Tracking**:
  - Implement usage tracking for each component (embedding generation, LLM calls)
  - Set up alerts for unusual usage patterns
  - Use AWS Cost Explorer to analyze and optimize spending

### Aurora PostgreSQL Optimizations

#### Sizing and Scaling Options
- **Serverless (Scale to 0)**: Ideal for development, testing, and intermittent workloads
- **Provisioned (Read and IO Optimized)**: Best for production workloads with predictable patterns. Read Optimized instance class provide NVMe SSD for tiered caching (about 63% of the NVMe SSD allocation), and temporary tables for query optimization.
- Choose based on your workload characteristics and cost requirements

#### Indexing Optimization
- **HNSW (Hierarchical Navigable Small World)**: Faster queries, higher memory usage
- **IVFFLAT (Inverted File)**: Balanced performance, lower memory usage
- Select the appropriate algorithm based on your performance needs and resource constraints

#### Storage Optimization
- Co-locate application data and vectors in the same database
- Reduce latency by eliminating cross-service calls
- Simplify transactions and ensure data consistency
- **Vector Quantization**:
  - As of yet, pgvector supports scalar and binary quantization
  - Vector quantization reduces index storage size and lowers index build time
  - Improves query performance while maintaining accuracy

#### Query Optimization
- Implement semantic caching to reduce redundant embedding generation.
- Leverage temporary table (using Read Optimized instance class) or materialized Common Table Expression (CTE) to store results for reuse within the query.
- Leverage iterative index scans (from pgvector 0.8.0), which will automatically scan more of the index until enough results are found.
- Create proper index on the columns to filter. Postgres has a number of index types for this: B-tree (default), hash, GiST, SP-GiST, GIN, and BRIN.
- If filtering by only a few distinct values, consider partial indexing. If filtering by many different values, consider partitioning.
- Optimize chunk size for better retrieval relevance.

> 💡 **Note:** pgvector's explosive development trajectory continues to make waves in the database ecosystem. Since early 2023, when the repository had just 2,000 GitHub stars, the project has seen remarkable momentum, soaring to over 15.4K stars by 2024. This dramatic surge in popularity reflects pgvector's rapid evolution and growing adoption. Stay tuned with the [pgvector's GitHub repository](https://github.com/pgvector/pgvector) to track its continuing development and expansion within the vector database space.

#### Hybrid Search
- Combine vector similarity with keyword-based search
- Improve relevance by leveraging both semantic and lexical matching
- Implement re-ranking strategies for better results

#### Data Retention
- Implement tiered storage for vector embeddings
- Archive older or less frequently accessed vectors
- Use efficient deletion strategies to manage storage costs

## Cost Overview 💰

| Component | Cost (us-east-1) | Notes |
|-----------|------------------|-------|
| Aurora PostgreSQL | $0.12/ACU-hour (Serverless v2) | Minimum 0 ACUs with auto-pause |
| Aurora Storage | $0.10/GB-month (standard) | Starts at 10GB, scales automatically |
| Amazon Bedrock | Varies by model | Claude Instant: $0.20/1M input tokens, $0.60/1M output tokens |
| Embedding Generation | $0.0001/1K tokens | Using Amazon Titan Embeddings |

> 💡 **Cost Optimization Tips:**
> - Use Aurora Serverless v2 with [scaling to 0 capacity](https://aws.amazon.com/blogs/database/introducing-scaling-to-0-capacity-with-amazon-aurora-serverless-v2/) for development environments
> - Implement caching to reduce redundant embedding generation and LLM calls
> - Choose appropriate vector dimensions and quantization methods
> - Monitor usage patterns and adjust resources accordingly
> - Use standard storage instead of I/O-optimized for non-intensive workloads

Ready to build your first RAG application? Start with our [Bedrock Knowledge Base Demo](8.2.1_bedrock_knowledge_base_demo.ipynb) for the quickest path to implementation, or dive into [Building a RAG Application with Aurora PostgreSQL](8.2.2_aurora_pgvector_rag_application.ipynb) for a complete, customizable solution! 🚀

## Next Steps

🎉 **Revolutionary!** You've built GenAI applications powered by Aurora and vector databases. You're at the forefront of AI-driven development!

**Ready to continue?** Let's advance to [8.3 Building a Claim Processing Agent](../8.3_Building_a_Claim_Processing_Agent) and develop an intelligent system that streamlines insurance claims handling with the power of generative AI!

## Learn More

- [Generative AI with Aurora Workshop - Build AI applications with vector databases](https://catalog.workshops.aws/genai-with-aurora/en-US)
- [Amazon Bedrock Workshop - Create generative AI applications with foundation models](https://catalog.workshops.aws/amazon-bedrock/en-US)
- [Aurora Machine Learning - Integrate ML models directly into database queries](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-ml.html)
- [pgvector Extension Guide - Store and query vector embeddings in PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.Extensions.html)
