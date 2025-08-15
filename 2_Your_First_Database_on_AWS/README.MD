# Your First Database on AWS

Ready to build your first cloud database? Welcome to [Amazon Aurora](https://aws.amazon.com/rds/aurora/)! 🚀

Whether you're launching a startup or modernizing your applications, this section will guide you step-by-step through creating your first professional-grade database in the cloud. No more wrestling with complex database management – we'll show you how Amazon Aurora makes it simple.

In this section, you'll:
- Launch a highly available Aurora database in minutes
- Master database connectivity through practical code examples
- Import data at scale using AWS-native tools
- Learn enterprise-grade security configurations
- Understand Aurora's unique scaling capabilities

We'll demystify Aurora's innovative architecture that delivers the performance and availability of commercial databases at open-source pricing. By the end of this section, you'll have a fully functional Aurora database powering your applications with single-digit millisecond latency and six-way replication.

> **💡 Quick Start Available**: Want to skip the manual setup on networking and database creation? Launch the infrastructure with our [AWS CloudFormation template](./cfn/aurora-complete-stack.yml). Then, feel free to explore from the [AWS console](https://console.aws.amazon.com/rds) for what you have created.

Let's dive in and transform the way you think about databases! 💪

## Topics

- [What We'll Build Together](#what-well-build-together)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Next Steps](#next-steps)
- [Learn More](#learn-more)

## What We'll Build Together

1. [Creating your first Amazon Aurora cluster](./2.1_Crearting_Your_First_Aurora_Cluster/README.MD)
   - Design a production-ready database architecture
   - Configure security best practices from day one
   - Set up automated backups and point-in-time recovery
   - Enable encryption and access controls

2. [Connecting to Your Database](./2.2_Connecting_to_Your_Aurora_PostgreSQL/README.MD)
   - Connect through multiple methods (Data API, Python, psql CLI, etc.)
   - Import data from [Aamzon S3](https://aws.amazon.com/s3/)
   - Set up connection pooling for optimal performance
   - Monitor and optimize your connections

## Prerequisites
You'll need:
- An AWS Account. [Create your first AWS account](../1_Getting_Started_with_AWS/README.MD) if you have not.
- Basic SQL knowledge
- Python 3.8+ for running examples

## Architecture Overview

[Amazon Aurora](https://aws.amazon.com/rds/aurora/) is a relational database management system (RDBMS) built for the cloud with full MySQL and PostgreSQL compatibility. Aurora gives you the performance and availability of commercial-grade databases at one-tenth the cost. Aurora's unparalleled high performance and availability at global scale comes from its AWS cloud native architecture shown as follows.

> 🚀 **New!** Aurora also offers [DSQL](https://aws.amazon.com/rds/aurora/dsql/), the fastest distributed SQL database that is PostgreSQL-compatible. Aurora is designed for up to 99.999% multi-Region availability. With Aurora DSQL, Aurora provides virtually unlimited scale in and across regions with no infrastructure management. You will learn more about Aurora scalability and DSQL in [5 Scaling for Success Growing with Aurora](../5_Scaling_for_Success_Growing_with_Aurora/README.md).

![Aurora Architecture](images/2.1-aurora-basic-architecture.png)

### Storage Architecture 
- **Distributed Storage**: Your data is automatically divided into 10GB segments and distributed across hundreds of storage nodes
- **Six-Way Replication**: Every piece of your data is replicated six times across three Availability Zones
- **Self-Healing**: The system continuously checks for errors and repairs itself automatically
- **Instant Recovery**: Unlike traditional databases, Aurora recovers nearly instantaneously from crashes
- **Auto-Scaling Storage**: Start small at 10GB and grow automatically up to 128TB with zero downtime

### Compute Layer
#### Provisioned Instances
Scale your compute power exactly when you need it:
- **Primary Instance**: Your write operations workhorse
- **Read Replicas**: Add up to 15 replicas for read scaling
- **Auto Scaling**: Let Aurora handle the scaling automatically
- **Multi-AZ**: Automatic failover in less than 30 seconds

#### Aurora Serverless v2
Perfect for variable workloads and development environments:
- **Automatic Scaling**: From 0.5 to 256 ACUs in seconds ([Each ACU is a combination of approximately 2 gibibytes (GiB) of memory, corresponding CPU, and networking](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless-v2.how-it-works.capacity))
- **Pay-Per-Use**: Only pay for the capacity you consume
- **Zero Management**: No capacity planning needed
- **Seamless Experience**: Applications connect just like to standard Aurora

#### Hybrid Configurations
- Mix serverless and provisioned instances in the same cluster
- Use serverless readers with provisioned writers
- Gradually transition between serverless and provisioned as needs evolve

### Global Database
Take your applications worldwide:
- **Fast Global Reads**: Enable fast local reads for globally distributed applications. [Global read scaling across up to 10 secondary regions](https://aws.amazon.com/about-aws/whats-new/2025/05/amazon-aurora-global-database-support-10-secondary-region-clusters/)
- **Disaster Recovery**: Typically, [RPO < 1 second, RTO in the order of minutes](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html#aurora-global-database-bcdr-planning)
- **Write Forwarding**: Maintain consistency with single-master architecture
- **Simple Setup**: Create a global database in just a few clicks

### Networking and Security
- Network isolation through subnet configuration
- Security groups for access control
- IAM authentication for database access
- Encryption at rest using KMS- Encryption in transit using TLS

### Backup and Recovery
- Continuous backup to Amazon S3
- Point-in-time recovery to any second during retention period
- Fast database cloning using copy-on-write protocol
- Global Database for cross-region disaster recovery (Typically, [RPO < 1 second, RTO in the order of minutes](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html#aurora-global-database-bcdr-planning)) and global read scaling across up to 10 secondary regions
- (Only Aurora MySQL)Backtrack capability to roll back DB clusters to a specific point in time

### High Availability and Disaster Recovery Options

| Feature | RPO (approximate) | RTO (approximate) | Manageability |
|---------|------------------|-------------------|---------------|
| Multi-AZ for high availability (HA) | 0 | ~ 30 seconds | Automatic failover & manual failover |
| Manual snapshot restore (DR) | Depends on snapshot time | <1 to several hours | API: `CreateDBClusterSnapshot`+`RestoreDBClusterFromSnapshot` |
| Point-in-time restore (DR) | 5 minutes | <1 to several hours | API: `RestoreDBClusterToPointInTime` |
| Cross-region snapshot copy and restore (DR) | Depends on snapshot frequency and transfer efficiency | <1 to several hours | API: `CopyDBClusterSnapshot` + `RestoreDBClusterFromSnapshot` |
| Cross-region Aurora Global Cluster (DR) | Typically < 1 second* | Several minutes if headless;<br>Typically few minutes with instance in target region | • Managed unplanned failover:<br>`FailoverGlobalCluster`<br>• Manual unplanned failover:<br>`RemoveFromGlobalCluster` |

\* *Depends on replica lag between regions and `rds.global_db_rpo` parameter*

> **Note**: Single AZ is not considered as a High Availability option for production workloads.

#### Key Terms:
- **RPO (Recovery Point Objective)**: Maximum acceptable amount of data loss
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime
- **DR**: Disaster Recovery
- **HA**: High Availability

## Next Steps

🎉 **Great work!** You've completed this important section and gained valuable Aurora expertise.

**Ready to dive in?** Let's start your hands-on journey with [2.1 Crearting Your First Aurora Cluster](./2.1_Crearting_Your_First_Aurora_Cluster) and begin building your Aurora expertise!

> 💡 **Note**: Ready for hands-on Aurora experience? The [Aurora PostgreSQL Workshop](https://catalog.workshops.aws/apgimmday/en-US) provides interactive labs where you\'ll build real applications. You\'ll gain practical skills in cluster management, performance tuning, and high availability that directly apply to production workloads.

## Learn More

- [Streamline Amazon Aurora database operations at scale: Introducing the AWS Database Acceleration Toolkit](https://aws.amazon.com/blogs/database/streamline-amazon-aurora-database-operations-at-scale-introducing-the-aws-database-acceleration-toolkit/)
- [Aurora PostgreSQL Workshop - Hands-on lab for building PostgreSQL applications](https://catalog.workshops.aws/apgimmday/en-US)
- [Aurora MySQL Workshop - Interactive tutorial for MySQL database development](https://catalog.workshops.aws/awsauroramysql/en-US)
- [Aurora Best Practices Guide - Production-ready configuration and optimization tips](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Aurora User Guide - Complete reference for Amazon Aurora database service](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
