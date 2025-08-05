# 1.2 Understanding AWS Free Tier and Cost Management

AWS offers a Free Tier to help you get hands-on experience with AWS services at no cost. Understanding these free offerings and implementing proper cost management from the start ensures a predictable and controlled cloud spending experience while you learn and build.

## Topics

- [AWS Free Tier Overview](#aws-free-tier-overview)
- [Cost Management Tools](#cost-management-tools)
- [Free Tier Usage Tracking](#free-tier-usage-tracking)
- [High-level Cost Optimization Tips](#high-level-cost-optimization-tips)
- [High-level Cost Control Checklist](#high-level-cost-control-checklist)
- [Troubleshooting FAQ](#troubleshooting-faq)
- [Next Steps](#next-steps)
- [Learn More](#learn-more)

## AWS Free Tier Overview

### Three Types of Free Offers

More than 100 AWS products are available on [AWS Free Tier](https://aws.amazon.com/free/) today. Three different types of free offers are available
depending on the services used. 

1. Always Free
   - Never expire
   - Available to all AWS customers

2. 12 Months Free
   - Start from account creation date
   - Limited to new AWS customers

3. Short-term Trials
   - Start from service activation
   - Vary from 30 days to several months

> 💡 Most of the AWS services in this cookbook are covered by AWS Free Tier.

## Cost Management Tools

### 1. [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/)

**📌 Recommended Setup:**
- Create monthly budget
- Set alert at 50% and 80% of Free Tier limits
- Configure email notifications

> **💡 Best Practice:** Set budgets lower than your actual limit to give yourself buffer room

### 2. [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)

**Key Features:**
- Visualize spending patterns
- Break down costs by service
- Identify cost trends

> **⚠️ Warning:** Cost Explorer itself has a small monthly fee after Free Tier ($0.01 per request)

### 3. [Billing Alerts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)

**Setup Steps:**

1. Enable billing alerts in account preferences
2. Create CloudWatch alarm for estimated charges
3. Set notification thresholds

## Free Tier Usage Tracking

![Free Tier Usage Tracking](../images/1.2-create-free-tier-alert.gif)

[Turn on Free Tier usage alerts in Billing preferences](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html). By default, AWS Free Tier usage alerts automatically notify you over email when you exceed 85 percent of the Free Tier limit for each service. Then, review your AWS Free Tier usage by using the Free Tier page in the Billing and Cost Management console.

### Key Metrics to Monitor
- Service usage versus Free Tier limits
- Forecasted usage
- Services approaching limits

## High-level Cost Optimization Tips

> **⚠️ Common Cost Pitfalls**
> 
> - Leaving resources running after testing
> - Exceeding Free Tier limits unknowingly
> - Data transfer costs between regions
> - External API calls costs
> - Storage of unused snapshots/backups

Here are some typical Dos and Don'ts. For comprehensive checks and recommendations for your AWS environment using best practice across the categories of cloud cost optimization, performance, resilience, security, operational excellence, and service limits, consult [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/). All AWS account plans get access to 56 AWS Trusted Advisor checks. Business Support and above unlock an additional 426 checks, totaling 482 Trusted Advisor checks.

```markdown
✅ Do:
- Terminate unused instances
- Use Free Tier eligible instance types
- Clean up old storage
- Use auto-scaling appropriately
- Leverage serverless when possible (note if it can scale down to 0 when idle)
- Create a custom dashboard to monitor resource utilization of the services

❌ Don't:
- Leave test instances running even no longer needed
- Store unnecessary data
- Over-provision resources without usage tracking
- Ignore regional price differences
- Forget about data transfer fees
```

> 💡 **Note**: Want to master AWS cost optimization? The [AWS Cost Optimization Workshop](https://catalog.workshops.aws/well-architected-cost-optimization/en-US) teaches you proven strategies to reduce costs by up to 75%. You\'ll learn hands-on techniques for rightsizing resources and implementing cost controls that scale with your business.

## High-level Cost Control Checklist

```markdown
Daily:
□ Check active resources
□ Review usage metrics
□ Stop unused instances

Weekly:
□ Review billing dashboard
□ Check Free Tier usage
□ Clean up test resources

Monthly:
□ Analyze Cost Explorer reports
□ Review and adjust budgets
□ Check for unused resources
```

## Troubleshooting FAQ

### Unexpected Charges
```markdown
Q: Seeing charges during the Free Tier period?
A: 1. Check if the service is Free Tier eligible
   2. Verify usage is within limits
   3. Review resource configurations

Q: Charges after terminating resources?
A: 1. Check for lingering snapshots
   2. Review partial hour billing
   3. Verify all regions for resources
```

### Free Tier Limits
```markdown
Q: How to track Free Tier usage?
A: 1. Use AWS Free Tier dashboard
   2. Set up AWS Budgets
   3. Enable billing alerts

Q: Approaching Free Tier limits?
A: 1. Review usage patterns
   2. Optimize resource usage
```

## Next Steps

🎉 **Well done!** You've mastered AWS cost management and set up budgets to keep your spending on track. You're now equipped to explore AWS services without surprises!

**Ready to continue?** Let's advance to [1.3 AWS Fundamentals A Quick Tour](../1.3_AWS_Fundamentals_A_Quick_Tour) and keep building your Aurora mastery!

## Learn More

- [AWS Free Tier - Start building on AWS with 12 months of free services](https://aws.amazon.com/free/)
- [AWS Well-Architected Framework - Build secure, high-performing, resilient, and efficient infrastructure](https://aws.amazon.com/architecture/well-architected/)
- [AWS Getting Started Resource Center - Step-by-step guides and tutorials for beginners](https://aws.amazon.com/getting-started/)
- [AWS Account Setup Best Practices - Security and operational guidance for new accounts](https://docs.aws.amazon.com/accounts/latest/reference/best-practices.html)
