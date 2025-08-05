# PostgreSQL to DocumentDB Migration Strategies

> 💡 **Note**: Planning a database migration? The [Database Migration Service Workshop](https://catalog.workshops.aws/databasemigration/en-US) walks you through proven migration patterns with minimal downtime. You\'ll learn techniques used by enterprises to migrate petabyte-scale databases while maintaining business continuity.

## Overview
This module explores approaches for migrating JSON data from PostgreSQL to Amazon DocumentDB. We'll focus on two primary migration methods, each suited for different scenarios and requirements.

## Topics

- [Overview](#overview)
- [What You'll Learn](#what-you'll-learn)
- [Migration Patterns Covered](#migration-patterns-covered)

## What You'll Learn

### Migration Options
1. **AWS Database Migration Service (DMS)**
   - Fully managed migration service
   - Supports both one-time and continuous replication
   - Minimal downtime options
   - Built-in monitoring and validation

2. **Custom Python Migration**
   - Fine-grained control over migration process
   - Customizable data transformation
   - Batch processing capabilities
   - Detailed error handling and logging

## Migration Patterns Covered
- Full Load (one-time complete data copy)
- Full Load + CDC (initial copy with continuous updates)
- CDC Only (change data capture for ongoing replication)

## Next Steps

🎉 **Transformative!** You've learned to choose the right database for each use case, breaking free from one-size-fits-all thinking. Your database architecture skills are advanced!

**Ready to continue?** Let's advance to [7.4 Performance-tuning-best-practices](../7.4_Performance-tuning-best-practices) and unlock the secrets to fine-tuning the database for peak performance and efficiency!

## Learn More

- [Purpose-Built Databases Workshop - Choose the right database for each use case](https://aws.amazon.com/products/databases/learn/)
- [Database Migration Service Workshop - Migrate and modernize database workloads](https://catalog.workshops.aws/databasemigration/en-US)
- [AWS Database Services Overview - Complete portfolio of managed database services](https://aws.amazon.com/products/databases/)
- [Database Selection Guide - Match workload requirements to optimal database engines](https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html)
