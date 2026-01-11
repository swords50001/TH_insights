# TH Insights - AWS Deployment Guide

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed
4. Terraform installed (optional, for infrastructure)
5. Git repository

## Quick Start Deployment

### 1. Set Up AWS Infrastructure

#### Option A: Using Terraform (Recommended)

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the infrastructure
terraform apply
```

#### Option B: Manual Setup

Create the following AWS resources:
- VPC with public/private subnets
- RDS PostgreSQL instance
- ECR repositories (backend & frontend)
- ECS cluster
- Application Load Balancer
- CloudWatch log groups
- Secrets Manager secrets

### 2. Configure Secrets

Store sensitive data in AWS Secrets Manager:

```bash
# Database password
aws secretsmanager create-secret \
  --name th-insights/db-password \
  --secret-string "your-secure-password"

# JWT Secret
aws secretsmanager create-secret \
  --name th-insights/jwt-secret \
  --secret-string "your-jwt-secret-min-32-characters"

# Database host
aws secretsmanager create-secret \
  --name th-insights/db-host \
  --secret-string "your-rds-endpoint.region.rds.amazonaws.com"

# Database name
aws secretsmanager create-secret \
  --name th-insights/db-name \
  --secret-string "th_db"

# Database user
aws secretsmanager create-secret \
  --name th-insights/db-user \
  --secret-string "postgres"
```

### 3. Update Configuration Files

Update the following files with your AWS details:

**aws/ecs-backend-task-definition.json:**
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Replace `YOUR_REGION` with your AWS region

**aws/ecs-frontend-task-definition.json:**
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Replace `YOUR_REGION` with your AWS region
- Update `VITE_API_URL` environment variable

**backend/.env.production:**
```bash
cp backend/.env.production.example backend/.env.production
# Edit with your values
```

### 4. Build and Push Docker Images

```bash
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh us-east-1 YOUR_ACCOUNT_ID
```

### 5. Run Database Migrations

```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

### 6. Deploy to ECS

```bash
chmod +x scripts/deploy-to-aws.sh
./scripts/deploy-to-aws.sh production us-east-1
```

## GitHub Actions CI/CD

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Automatic Deployment

Push to the `main` branch to trigger automatic deployment:

```bash
git push origin main
```

## Architecture

```
Internet
   |
   v
Application Load Balancer (ALB)
   |
   +-- Frontend Target Group (Port 80)
   |      |
   |      v
   |   ECS Service (Frontend)
   |   - 2 Fargate tasks
   |   - Nginx serving React app
   |
   +-- Backend Target Group (Port 8080)
          |
          v
       ECS Service (Backend)
       - 2 Fargate tasks
       - Node.js/Express API
          |
          v
       RDS PostgreSQL
       - Private subnet
       - Multi-AZ
```

## Monitoring

### CloudWatch Logs

View logs in AWS Console:
- `/ecs/th-insights-backend`
- `/ecs/th-insights-frontend`

### Health Checks

- Basic: `https://api.yourdomain.com/health`
- Detailed: `https://api.yourdomain.com/health/detailed`
- Readiness: `https://api.yourdomain.com/ready`

## Scaling

### Auto Scaling

Configure in ECS:
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/th-insights-production/th-insights-backend-production \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

## Cost Optimization

**Estimated Monthly Costs (us-east-1):**
- ECS Fargate: ~$50-100
- RDS db.t3.micro: ~$15
- ALB: ~$20
- Data Transfer: ~$10-50
- **Total: ~$95-185/month**

### Tips:
- Use Fargate Spot for non-production
- Enable RDS auto-stop for development
- Use CloudWatch Logs retention policies
- Consider Reserved Instances for production

## Troubleshooting

### Check ECS Task Status
```bash
aws ecs describe-services \
  --cluster th-insights-production \
  --services th-insights-backend-production
```

### View Task Logs
```bash
aws logs tail /ecs/th-insights-backend --follow
```

### Check Task Failures
```bash
aws ecs describe-tasks \
  --cluster th-insights-production \
  --tasks TASK_ID
```

### Database Connection Issues
1. Check security group rules
2. Verify RDS is in private subnets
3. Confirm ECS tasks can reach RDS
4. Test connection from ECS task

## Rollback

```bash
# List previous task definitions
aws ecs list-task-definitions --family-prefix th-insights-backend

# Update service to previous version
aws ecs update-service \
  --cluster th-insights-production \
  --service th-insights-backend-production \
  --task-definition th-insights-backend:PREVIOUS_VERSION
```

## Security Best Practices

1. ✅ Use Secrets Manager for sensitive data
2. ✅ Enable encryption at rest (RDS, ECS)
3. ✅ Use VPC private subnets for backend/database
4. ✅ Implement least-privilege IAM roles
5. ✅ Enable CloudWatch Container Insights
6. ✅ Use SSL/TLS certificates (ACM)
7. ✅ Enable ECR image scanning
8. ✅ Implement WAF rules on ALB (optional)

## Support

For issues or questions:
- Check CloudWatch Logs
- Review ECS task events
- Verify security group rules
- Test health endpoints

## Next Steps

1. Set up custom domain with Route 53
2. Configure ACM certificate for HTTPS
3. Implement CloudFront CDN (optional)
4. Set up backup strategy for RDS
5. Configure monitoring alerts
6. Implement blue/green deployments
