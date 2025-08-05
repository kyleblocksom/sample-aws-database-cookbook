# Understanding the JSON in RDBMS Anti-Pattern

## The Common Scenario
Many organizations start their journey by storing JSON documents in PostgreSQL tables, leveraging PostgreSQL's JSON data types. This approach seems convenient initially, offering:
- Familiar SQL interface
- ACID compliance
- Easy integration with existing applications
- Built-in JSON validation

## Topics

- [The Common Scenario](#the-common-scenario)
- [The Growing Pains](#the-growing-pains)
- [What We'll Explore](#what-we'll-explore)
- [Hands-On Workshop](#hands-on-workshop)
- [📚 AWS Database Service References](#📚-aws-database-service-references)

## The Growing Pains
However, as applications scale and data volumes grow, several challenges emerge:
- Complex query patterns become difficult to optimize
- JSON indexing limitations impact performance
- Large JSON documents affect storage efficiency
- Increased CPU usage for JSON parsing
- Query execution times become unpredictable

## What We'll Explore
In this module, we'll:
1. Demonstrate these challenges through practical examples
2. Create a PostgreSQL table with JSON data
3. Run various queries to highlight performance bottlenecks
4. Analyze query execution plans and performance metrics
5. Set the stage for migration to purpose-built databases

> 💡 **Note**: Confused about which database to choose? The [Purpose-Built Databases Workshop](https://aws.amazon.com/products/databases/learn/) provides a decision framework used by AWS architects. You\'ll learn to match workload characteristics to optimal database engines, avoiding costly architectural mistakes.

## Hands-On Workshop
Ready to see these challenges in action? Proceed to [JSON in PostgreSQL Example](./json-in-pg-example.ipynb) where we'll:
- Create and populate a sample table with JSON data
- Execute increasingly complex queries
- Observe performance implications
- Identify scaling limitations

This will help you understand why and when to consider purpose-built databases for your JSON workloads, which we'll cover in subsequent modules.

## 📚 AWS Database Service References

### Amazon Aurora
- [Getting Started with Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.html)
- [Create a Highly Available Database Tutorial](https://aws.amazon.com/getting-started/hands-on/create-high-availability-database-cluster/)
- [Using Aurora Global Databases](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-getting-started.html)

### Amazon RDS
- [Getting Started with Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.html)
- [Create and Connect to PostgreSQL Database](https://aws.amazon.com/getting-started/hands-on/create-connect-postgresql-db/)
- [Create Web Server and RDS DB Instance](https://aws.amazon.com/getting-started/hands-on/create-mysql-db/)

## Next Steps

🎉 **Transformative!** You've learned to choose the right database for each use case, breaking free from one-size-fits-all thinking. Your database architecture skills are advanced!

**Ready to continue?** Let's advance to [7.3 Migration-Strategies](../7.3_Migration-Strategies) and master the art of seamlessly transitioning your data to purpose-built AWS database solutions for optimal performance and scalability!

> 💡 **Note**: Planning a database migration? The [Database Migration Service Workshop](https://catalog.workshops.aws/databasemigration/en-US) walks you through proven migration patterns with minimal downtime. You\'ll learn techniques used by enterprises to migrate petabyte-scale databases while maintaining business continuity.

## Learn More

- [Purpose-Built Databases Workshop - Choose the right database for each use case](https://aws.amazon.com/products/databases/learn/)
- [Database Migration Service Workshop - Migrate and modernize database workloads](https://catalog.workshops.aws/databasemigration/en-US)
- [AWS Database Services Overview - Complete portfolio of managed database services](https://aws.amazon.com/products/databases/)
- [Database Selection Guide - Match workload requirements to optimal database engines](https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html)
