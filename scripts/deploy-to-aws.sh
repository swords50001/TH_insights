#!/bin/bash

# Deploy to AWS ECS
# Usage: ./deploy-to-aws.sh [environment] [region]

set -e

ENVIRONMENT="${1:-production}"
AWS_REGION="${2:-us-east-1}"
CLUSTER_NAME="th-insights-$ENVIRONMENT"
BACKEND_SERVICE="th-insights-backend-$ENVIRONMENT"
FRONTEND_SERVICE="th-insights-frontend-$ENVIRONMENT"

echo "🚀 Deploying to AWS ECS..."
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"

# Update Backend Service
echo "📦 Updating backend service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $BACKEND_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

# Update Frontend Service
echo "📦 Updating frontend service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $FRONTEND_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "⏳ Waiting for services to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $BACKEND_SERVICE $FRONTEND_SERVICE \
  --region $AWS_REGION

echo "✅ Deployment completed successfully!"
