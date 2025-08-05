# Clean Up
---

To avoid incurring future charges, follow these steps to remove the resources created by this solution:

1. Delete the CloudFormation stacks:

```bash
cdk destroy --all --force --require-approval never --ci --context-from-config cdk.context.json --profile <YOUR_AWS_CLI_PROFILE>
```

This will remove most of the resources created by the CDK stacks, including:
- ECS Fargate clusters and services
- Application Load Balancer
- CloudFront distribution
- Cognito User Pool
- Most Lambda functions
- IAM roles and policies

2. Manually delete the following resources that may not be automatically removed:

- Lambda custom resource handlers:
  - Visit the Lambda console
  - Delete the project's custom resource Lambda functions

- S3 buckets:
  - Navigate to the S3 console
  - Empty and delete the buckets created for this project (e.g., agent assets, deployment artifacts)

- ECR repositories:
  - Go to the ECR console
  - Delete the repository created for this project

- CloudWatch log groups:
  - Visit the CloudWatch console
  - Remove log groups associated with the project's Lambda functions and ECS tasks

Remember to review your AWS account for any other resources or services that might have been created as part of this solution and remove them if they are no longer needed.

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0