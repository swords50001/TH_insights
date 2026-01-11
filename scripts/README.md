# Deployment Scripts

This directory contains scripts for deploying TH Insights to AWS.

## Scripts

### build-and-push.sh
Builds Docker images and pushes them to AWS ECR.

**Usage:**
```bash
./build-and-push.sh [region] [account-id]
```

**Example:**
```bash
./build-and-push.sh us-east-1 123456789012
```

### deploy-to-aws.sh
Deploys the application to AWS ECS by forcing a new deployment.

**Usage:**
```bash
./deploy-to-aws.sh [environment] [region]
```

**Example:**
```bash
./deploy-to-aws.sh production us-east-1
```

### run-migrations.sh
Runs database migrations on AWS RDS.

**Usage:**
```bash
./run-migrations.sh
```

**Prerequisites:**
- AWS CLI configured
- Database credentials stored in AWS Secrets Manager
- PostgreSQL client (psql) installed

## Making Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Environment Variables

Scripts use the following environment variables:
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCOUNT_ID` - Your AWS account ID

## Prerequisites

1. AWS CLI installed and configured
2. Docker installed
3. Appropriate AWS IAM permissions
4. ECR repositories created
5. ECS cluster and services created

## Workflow

1. **Build and Push Images:**
   ```bash
   ./scripts/build-and-push.sh us-east-1 YOUR_ACCOUNT_ID
   ```

2. **Run Migrations (first time only):**
   ```bash
   ./scripts/run-migrations.sh
   ```

3. **Deploy to ECS:**
   ```bash
   ./scripts/deploy-to-aws.sh production us-east-1
   ```

## Troubleshooting

### Login Issues
If ECR login fails, ensure:
- AWS CLI is configured correctly
- You have permissions for ECR
- Region is correct

### Build Failures
- Check Docker is running
- Verify Dockerfile paths
- Ensure dependencies are available

### Deployment Failures
- Verify ECS cluster exists
- Check service names match
- Ensure task definitions are valid
- Review CloudWatch logs

## Security Notes

- Never commit AWS credentials to Git
- Use IAM roles when possible
- Store secrets in AWS Secrets Manager
- Enable MFA for production deployments
