# 6.1 Understanding Aurora Cost Components

Amazon Aurora clusters are available in two pricing models—Aurora Standard and Aurora I/O-Optimized—each designed to cater to different workload patterns and cost-efficiency needs.

| Component | Description |
|-----------|-------------|
| Compute | DB Instance Class, Count, or Aurora Capacity Units (ACUs) for Serverless |
| Storage | GBs of database volume used |
| I/O Operations | Read/Write IOPS from/to Aurora storage |
| Backups | Size and retention of automated/manual snapshots |
| Data Transfer | Inter-AZ or inter-region traffic |

![Aurora Cluster Modes](../images/2.1-aurora-cluster-modes.png)

## Topics

- [Aurora Standard](#aurora-standard)
- [Aurora I/O-Optimized](#aurora-i/o-optimized)

## Aurora Standard
This is the default configuration and is ideal for workloads with moderate and predictable I/O usage. Costs are broken down into:
•	Compute: Billed based on instance type and usage (On-Demand or Reserved Instances).
•	Storage: Charged on a pay-per-use basis for the storage consumed.
•	I/O: Charged separately on a pay-per-request model, which means the more read/write operations you perform, the higher your costs.
•	Other Features: Additional charges may apply for features like backtracking, global databases, and snapshot exports.

## Aurora I/O-Optimized
This option is better suited for I/O-intensive applications were eliminating variable I/O charges provides more predictable costs.
•	Compute: Billed similarly to the standard model but incurs a 30% premium.
•	Storage: Still pay-per-use but with a 125% cost increase over the standard model.
•	I/O: No additional charges for I/O operations—read and write requests are included in the compute and storage pricing, making this attractive for high-throughput applications.
•	Other Features: Feature-based costs remain the same as with the standard model.

## Next Steps

🎉 **Excellent!** You've implemented monitoring, alerting, and performance optimization strategies. Your operational excellence skills are top-notch!

**Ready to continue?** Let's advance to [6.2 Performance Tuning Strategies](../6.2_Performance_Tuning_Strategies) and unlock advanced techniques to supercharge your Aurora database performance!

## Learn More

- [AWS Cost Optimization Workshop - Reduce costs while maintaining performance](https://catalog.workshops.aws/well-architected-cost-optimization/en-US)
- [Aurora I/O-Optimized - New storage configuration for I/O-intensive workloads](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html#aurora-storage-type)
- [RDS Reserved Instances - Save up to 75% with 1 or 3-year capacity reservations](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithReservedDBInstances.html)
- [Aurora Cost Optimization Guide - Strategies for optimizing database costs and performance](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Performance.html)
