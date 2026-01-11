# AWS Deployment Checklist

## Pre-Deployment

- [X] AWS Account created and configured
- [X] AWS CLI installed and configured
- [X] Docker installed locally
- [X] Repository cloned and up to date
- [ ] All environment variables documented

## Infrastructure Setup

- [ ] VPC created with public/private subnets
- [ ] Internet Gateway and NAT Gateways configured
- [ ] Security Groups created and configured
- [ ] RDS PostgreSQL instance launched
- [ ] ECR repositories created (backend & frontend)
- [ ] ECS cluster created
- [ ] Application Load Balancer created
- [ ] Target Groups configured
- [ ] CloudWatch Log Groups created
- [ ] IAM roles and policies configured

## Secrets Configuration

- [ ] Database password stored in Secrets Manager
- [ ] JWT secret stored in Secrets Manager
- [ ] Database host stored in Secrets Manager
- [ ] Database name stored in Secrets Manager
- [ ] Database user stored in Secrets Manager
- [ ] All secrets ARNs documented

## Configuration Files

- [ ] Update aws/ecs-backend-task-definition.json
  - [ ] AWS Account ID
  - [ ] AWS Region
  - [ ] Secret ARNs
  - [ ] Environment variables
- [ ] Update aws/ecs-frontend-task-definition.json
  - [ ] AWS Account ID
  - [ ] AWS Region
  - [ ] API URL
- [ ] Create backend/.env.production
- [ ] Create frontend/.env.production
- [ ] Update CORS origins in backend

## Database Setup

- [ ] RDS instance accessible from ECS
- [ ] Security groups allow ECS -> RDS traffic
- [ ] Database migrations prepared
- [ ] Test database connection
- [ ] Run initial migrations
- [ ] Create initial admin user

## Docker Images

- [ ] Backend Dockerfile builds successfully
- [ ] Frontend Dockerfile builds successfully
- [ ] Images pushed to ECR
- [ ] Image tags documented

## ECS Services

- [ ] Backend task definition registered
- [ ] Frontend task definition registered
- [ ] Backend service created
- [ ] Frontend service created
- [ ] Services connected to ALB target groups
- [ ] Auto-scaling configured (optional)

## Load Balancer

- [ ] ALB security group allows HTTP/HTTPS
- [ ] Target groups health checks configured
- [ ] Listener rules configured
- [ ] SSL certificate configured (if HTTPS)
- [ ] DNS records updated

## Monitoring & Logging

- [ ] CloudWatch log groups created
- [ ] Log retention policies set
- [ ] CloudWatch alarms configured (optional)
- [ ] ECS Container Insights enabled
- [ ] Health check endpoints tested

## Security

- [ ] Security groups follow least privilege
- [ ] Database in private subnets
- [ ] Secrets stored in Secrets Manager
- [ ] IAM roles follow least privilege
- [ ] ECR image scanning enabled
- [ ] SSL/TLS configured
- [ ] CORS properly configured

## Testing

- [ ] Health endpoints responding (/)
  - [ ] GET /health
  - [ ] GET /health/detailed
  - [ ] GET /ready
- [ ] Frontend loads successfully
- [ ] Backend API accessible
- [ ] Database queries working
- [ ] Authentication working
- [ ] All features tested
- [ ] Load testing performed (optional)

## DNS & Domain

- [ ] Domain purchased/available
- [ ] Route 53 hosted zone created
- [ ] ACM certificate requested and validated
- [ ] DNS records configured
- [ ] HTTPS working

## CI/CD (Optional)

- [ ] GitHub Actions secrets configured
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
- [ ] Workflow files configured
- [ ] Test deployment pipeline
- [ ] Automatic deployment working

## Post-Deployment

- [ ] Application accessible at domain
- [ ] All features working in production
- [ ] Monitoring dashboards configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback procedure tested

## Documentation

- [ ] AWS_DEPLOYMENT.md reviewed
- [ ] Architecture diagram created
- [ ] Runbook created
- [ ] Troubleshooting guide updated
- [ ] Team trained on deployment process

## Maintenance

- [ ] Regular backup schedule established
- [ ] Update schedule planned
- [ ] Monitoring alerts configured
- [ ] Cost monitoring enabled
- [ ] Security audit scheduled

## Notes

**Date:** _______________
**Deployed By:** _______________
**Version:** _______________
**Issues Encountered:** 
_______________________________________________
_______________________________________________
_______________________________________________
