# How to Optimize Amazon DocumentDB (with MongoDB Compatibility) Performance

Amazon DocumentDB (with MongoDB compatibility) is designed to provide scalable, highly available document storage. However, like any database service, performance tuning is key to meeting your application's growing demands efficiently. In this blog post, we’ll cover essential techniques to optimize DocumentDB performance based on [AWS best practices](https://docs.aws.amazon.com/documentdb/latest/developerguide/best_practices.html), including how to use diagnostic tools effectively.

## Topics

- [1. Right-Size Your Instances and Clusters](#1.-right-size-your-instances-and-clusters)
- [2. Use Amazon DocumentDB Diagnostic Tools](#2.-use-amazon-documentdb-diagnostic-tools)
- [3. Optimize Your Indexing Strategy](#3.-optimize-your-indexing-strategy)
- [4. Use Read Replicas for Scaling Reads](#4.-use-read-replicas-for-scaling-reads)

## 1. Right-Size Your Instances and Clusters

Choosing the correct instance size is one of the most important performance levers in DocumentDB.

**Best Practices:**
- **Start with smaller instance types** during development and scale up based on workload requirements.
- **Monitor CPU utilization**: If CPU utilization exceeds 80% consistently, consider scaling up to a larger instance type.
- **Check IOPS usage**: If you're consistently throttling on IOPS, a larger instance might help as they provide more network and storage throughput.

**Key Metrics to Watch ([CloudWatch](https://docs.aws.amazon.com/documentdb/latest/developerguide/cloud_watch.html)):**
- `CPUUtilization`
- `FreeableMemory`
- `ReadLatency`, `WriteLatency`
- `DatabaseConnections`

> 🛠️ **Tip:** Over-provisioning resources can be expensive. Always scale based on monitored metrics, not assumptions.

## 2. Use Amazon DocumentDB Diagnostic Tools

AWS provides built-in diagnostic tools to help you troubleshoot and optimize performance.

**Diagnostic Tools:**
- **[Performance Insights](https://docs.aws.amazon.com/documentdb/latest/developerguide/performance-insights.html)**: Provides an easy-to-understand dashboard showing database load and query bottlenecks.
- **[Profiling and Slow Query Logs](https://docs.aws.amazon.com/documentdb/latest/developerguide/profiling.html)**: Enables you to capture slow operations and analyze why they are slow.
- **[Event Monitoring](https://docs.aws.amazon.com/documentdb/latest/developerguide/monitoring_docdb.html)**: Captures events like failovers or backup completions, useful for root cause analysis.

**How to Use Slow Query Logs:**
1. Enable profiler by setting `profilingLevel`:
    ```javascript
    db.setProfilingLevel(1, { slowms: 100 })
    ```
2. Analyze slow queries with:
    ```javascript
    db.system.profile.find().sort({ ts: -1 }).limit(5)
    ```

> 💡 **Tip:** Always review logs after changes or scaling operations to ensure new bottlenecks are not introduced.

## 3. Optimize Your Indexing Strategy

Indexes are critical to fast query performance in DocumentDB. Without the right indexes, even simple queries can slow down.

**Best Practices:**
- **Create indexes** on fields that are frequently used in query filters (`find`, `aggregate`, `update`, etc.).
- **Use compound indexes** when querying multiple fields together to optimize retrieval.
- **Drop unused indexes**: Unused indexes consume resources and slow down write operations.


db.orders.createIndex({ customerId: 1, orderDate: -1 })


**Links to Documentation:**
- [Amazon DocumentDB Indexing Overview](https://docs.aws.amazon.com/documentdb/latest/developerguide/indexes.html)
- [Index Best Practices](https://docs.aws.amazon.com/documentdb/latest/developerguide/best_practices-indexes.html)
- [Query Planning with explain()](https://docs.aws.amazon.com/documentdb/latest/developerguide/profiling.html#profiling_explain)

> 🔍 **Tip:** Use `explain()` to analyze your query execution plans and verify your indexes are being used properly:

db.orders.find({ customerId: "12345" }).explain()

## 4. Use Read Replicas for Scaling Reads

Amazon DocumentDB supports up to 15 read replicas per cluster. If your application is read-heavy, distribute read traffic across replicas to improve performance and scalability.

**Best Practices:**
- Route read-only queries to replicas.
- Monitor replica lag using CloudWatch (`ReplicaLag` metric).
- Use connection string options to direct read preferences.

**Example (Connection String Option):**

```plaintext
mongodb://<username>:<password>@<cluster-endpoint>:27017/?readPreference=secondaryPreferred
```

## Next Steps

🎉 **Excellent!** You've implemented monitoring, alerting, and performance optimization strategies. Your operational excellence skills are top-notch!

**Ready to continue?** Let's advance to [7.5 Scale for Future](../7.5_Scale_for_Future/README.md) and explore advanced strategies to ensure your database architecture can seamlessly grow with your business needs!

## Learn More

- [Purpose-Built Databases Workshop - Choose the right database for each use case](https://aws.amazon.com/products/databases/learn/)
- [Database Migration Service Workshop - Migrate and modernize database workloads](https://catalog.workshops.aws/databasemigration/en-US)
- [AWS Database Services Overview - Complete portfolio of managed database services](https://aws.amazon.com/products/databases/)
- [Database Selection Guide - Match workload requirements to optimal database engines](https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html)
