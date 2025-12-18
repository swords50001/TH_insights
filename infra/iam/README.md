# Deployer IAM Policy

This folder contains Terraform resources that create a focused IAM policy for the GitHub Actions deployer role.

What it does:
- Grants ECR push permissions for repositories named `${var.project}-${var.env}-*`
- Grants ECS update/register and iam:PassRole to allow service updates
- Grants S3 Put/Get/List on the assets bucket
- Grants CloudFront CreateInvalidation on distributions in the account
- Grants minimal CloudWatch Logs put/create rights for ECS logs

Usage:
- Apply Terraform in your environment (e.g., `terraform apply -var="env=staging" -var="project=myproj"`) to create policy and attach it to `aws_iam_role.github_actions_deployer`.
- After apply, copy the role ARN (output from `aws_iam_role.github_actions_deployer`) and add it to this repo's secrets: `AWS_ROLE_ARN`.
- Add `AWS_REGION` to repo secrets as well (used by the smoke test workflow).

Security notes:
- The policy uses resource-scoped ARNs where possible. In production you can tighten ARNs further (e.g., explicit ECR repository names and CloudFront distribution IDs).
- Use least privilege - update this policy to restrict to specific resources your CI uses.
