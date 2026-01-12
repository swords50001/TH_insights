#!/bin/bash

# Build and Push Docker Images to AWS ECR
# Usage: ./build-and-push.sh [region] [account-id]

set -e

# Configuration
AWS_REGION="${1:-us-west-2}"
AWS_ACCOUNT_ID="${2}"
BACKEND_REPO="th-insights-backend"
FRONTEND_REPO="th-insights-frontend"

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Error: AWS Account ID is required"
  echo "Usage: ./build-and-push.sh [region] [account-id]"
  exit 1
fi

echo "🚀 Starting build and push to AWS ECR..."
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"

# Login to ECR
echo "📦 Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Backend
echo "🔨 Building backend image..."
cd backend
docker build -t $BACKEND_REPO:latest -f dockerfile .
docker tag $BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest
docker tag $BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$(git rev-parse --short HEAD)

echo "⬆️  Pushing backend image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$(git rev-parse --short HEAD)

cd ..

# Build Frontend
echo "🔨 Building frontend image..."
cd frontend
docker build -t $FRONTEND_REPO:latest -f Dockerfile .
docker tag $FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest
docker tag $FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$(git rev-parse --short HEAD)

echo "⬆️  Pushing frontend image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$(git rev-parse --short HEAD)

cd ..

echo "✅ Build and push completed successfully!"
echo "Backend image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest"
echo "Frontend image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest"
