# Terraform infra for TH_insights

This directory contains a minimal Terraform scaffold to provision the production stack for TH_insights:

- S3 bucket + CloudFront distribution (assets)
- RDS (Postgres)
- ECR repository
- ECS Fargate cluster + Service behind an ALB
- IAM roles for ECS tasks and GitHub Actions OIDC deploy role
- Secrets Manager entries for DB credentials and JWT secret

Quick notes
- The module can either create a new VPC (recommended for isolated infra) or use an existing VPC by setting `create_vpc = false` and supplying `vpc_id`, `public_subnet_ids`, and `private_subnet_ids`.
- The CloudFront cert must be in `us-east-1` (pass `cloudfront_cert_arn`).
- This scaffold is intended as a starting point — for production, restrict IAM ARNs further, set up remote state (S3 + DynamoDB locking), and configure backups/multi-AZ for RDS.

Getting started
1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill values (or use `dev.tfvars`/`prod.tfvars`).

2. (Optional) Create remote state bucket + DynamoDB lock table and configure backend:

```bash
# bootstrap with AWS CLI (must have AWS credentials configured locally)
cd infra
./bootstrap.sh -b <your-terraform-state-bucket> -r <region> -t <dynamodb-lock-table>

# initialize terraform with backend config (either edit backend.tf or pass backend-config flags)
terraform init -backend-config="bucket=<your-terraform-state-bucket>" -backend-config="key=th-insights/terraform.tfstate" -backend-config="region=<region>" -backend-config="dynamodb_table=<dynamodb-lock-table>"
```

3. Initialize and plan:

```bash
cd infra
terraform init
terraform plan -var-file=dev.tfvars   # for dev
terraform plan -var-file=prod.tfvars  # for prod
```

4. Apply:

```bash
terraform apply -var-file=dev.tfvars -auto-approve
```

After apply you will have outputs for ECR repo, ALB DNS, CloudFront domain and RDS endpoint.

CI / deploy notes
- Use GitHub Actions OIDC role defined here to build/push backend image to ECR and call `aws ecs update-service --force-new-deployment`.
- Frontend build should upload to the S3 bucket and trigger a CloudFront invalidation.

If you want, I can:
- Add a `terraform` remote state backend configuration that uses S3 + DynamoDB locking.
- Generate a GitHub Actions example that uses OIDC and the created deploy role.
- Harden IAM policies and add a proper migration system (recommended).
