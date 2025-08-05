# 2.1 Creating Your First Aurora Cluster

Ready to launch your first Amazon Aurora cluster? We've got you covered! 🚀

In this hands-on lab, we'll guide you through creating a production-ready Amazon Aurora PostgreSQL database cluster. No more wrestling with complex networking setups or security configurations - our automated templates will help you follow AWS best practices right from the start.

By the end of this section, you'll have:
- A fully configured Amazon Aurora cluster running across multiple Availability Zones
- Production-grade security settings
- Automated backup and recovery capabilities
- High availability with automated failover

## Topics

- [What We'll Build Together](#what-well-build-together)
- [Prerequisites](#prerequisites)
- [Cost Overview 💰](#cost-overview-)
- [Next Steps](#next-steps)
- [Learn More](#learn-more)

## What We'll Build Together
- **[Part 1: Infrastructure and Networking Setup](2.1.1_create_your_first_aurora_postgresql_part1.ipynb)** - Create the networking foundation, including VPC and networking infrastructure, Subnet groups for high availability, Security group configuration. 
- **[Part 2: Configuration and Advanced Features](2.1.2_create_your_first_aurora_postgresql_part2.ipynb)** - Deploy your first Amazon Aurora PostgreSQL cluster with high availability across multiple Availability Zones with best practices, such as encryption at rest, IAM authentication, SSL connection, RDS proxy for connection pooling, database monitoring with free-tier Performance Insights (now, it is transitioning to [Database Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Database-Insights.html)).

> 💡 **Note**: Ready for hands-on Aurora experience? The [Aurora PostgreSQL Workshop](https://catalog.workshops.aws/apgimmday/en-US) provides interactive labs where you\'ll build real applications. You\'ll gain practical skills in cluster management, performance tuning, and high availability that directly apply to production workloads.

## Prerequisites
You'll need:
- An AWS Account. [Create your first AWS account](../1_Getting_Started_with_AWS/README.MD) if you have not.
- Basic SQL knowledge
- Python 3.8+ for running examples

## Cost Overview 💰

Check cost overview of the AWS resources created in the Jupyter notebooks. 

> 💡 **Cost Optimization Tips:**
> - [Stop the Aurora cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-cluster-stop-start.html) if not used for some period of time, and start the cluster without losing any data stored to resume the work.
> - Use [Aurora Serverless v2 and allow it scale to 0 capacity](https://aws.amazon.com/blogs/database/introducing-scaling-to-0-capacity-with-amazon-aurora-serverless-v2/). 
> - Right-size [instances](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.Types.html) based on actual workload. For testing purpose, you can surely start from the [db.t](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.Types.html#Concepts.DBInstanceClass.Types.burstable) family.
> - Monitor database performane bottleneck and adjust using [Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html). **Performance Insights offers a rolling seven days of performance data history at no charge.**
> - Clean up unnecessary backup retention. **There is also no charge for an automated backup whose retention period is just 1 day.**

## Next Steps

🎉 **Incredible!** Ready to build? Open [2.1.1_create_your_first_aurora_postgresql_part1.ipynb](../2.1_Crearting_Your_First_Aurora_Cluster/2.1.1_create_your_first_aurora_postgresql_part1.ipynb) to start deploying your Aurora cluster! 🚀

## Learn More

- [Streamline Amazon Aurora database operations at scale: Introducing the AWS Database Acceleration Toolkit](https://aws.amazon.com/blogs/database/streamline-amazon-aurora-database-operations-at-scale-introducing-the-aws-database-acceleration-toolkit/)
- [Aurora PostgreSQL Workshop - Hands-on lab for building PostgreSQL applications](https://catalog.workshops.aws/apgimmday/en-US)
- [Aurora MySQL Workshop - Interactive tutorial for MySQL database development](https://catalog.workshops.aws/awsauroramysql/en-US)
- [Aurora Best Practices Guide - Production-ready configuration and optimization tips](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Aurora User Guide - Complete reference for Amazon Aurora database service](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
