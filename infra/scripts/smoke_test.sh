#!/usr/bin/env bash
set -euo pipefail

# Smoke test script used by GitHub Actions to validate the deployer role end-to-end
# Expected env vars: AWS_REGION, REPO_NAME, CLUSTER_NAME, SERVICE_NAME, S3_BUCKET, CLOUDFRONT_DIST_ID

AWS_REGION=${AWS_REGION:-us-east-1}
REPO_NAME=${REPO_NAME:-smoke-deploy-repo}
CLUSTER_NAME=${CLUSTER_NAME:-}
SERVICE_NAME=${SERVICE_NAME:-}
S3_BUCKET=${S3_BUCKET:-}
CLOUDFRONT_DIST_ID=${CLOUDFRONT_DIST_ID:-}

echo "Starting smoke test: repo=$REPO_NAME cluster=$CLUSTER_NAME service=$SERVICE_NAME s3=$S3_BUCKET cf=$CLOUDFRONT_DIST_ID region=$AWS_REGION"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Assumed account: $ACCOUNT_ID"

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_URI}/${REPO_NAME}:ci-${GITHUB_RUN_ID:-local}"

# Create ECR repo if it doesn't exist
if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region $AWS_REGION >/dev/null 2>&1; then
  echo "Creating ECR repository $REPO_NAME"
  aws ecr create-repository --repository-name "$REPO_NAME" --region $AWS_REGION || true
fi

# Build small image
echo "Building image"
docker build -t "$REPO_NAME:smoke" -f infra/smoke/Dockerfile infra/smoke

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

echo "Tagging and pushing to ECR: $FULL_IMAGE"
docker tag "$REPO_NAME:smoke" "$FULL_IMAGE"
docker push "$FULL_IMAGE"

# Update ECS service to trigger a new deployment (will pick up latest task definition/container image if using :latest or force-new-deployment)
if [ -n "$CLUSTER_NAME" ] && [ -n "$SERVICE_NAME" ]; then
  echo "Triggering ECS service update: cluster=$CLUSTER_NAME service=$SERVICE_NAME"
  aws ecs update-service --cluster "$CLUSTER_NAME" --service "$SERVICE_NAME" --force-new-deployment --region $AWS_REGION
else
  echo "Skipping ECS update (cluster/service not provided)"
fi

# Upload a small file to S3
if [ -n "$S3_BUCKET" ]; then
  KEY="smoke-${GITHUB_RUN_ID:-local}.txt"
  echo "Uploading /tmp/$KEY to s3://$S3_BUCKET/$KEY"
  echo "smoke test $(date)" > /tmp/$KEY
  aws s3 cp /tmp/$KEY s3://$S3_BUCKET/$KEY --region $AWS_REGION
else
  echo "Skipping S3 upload (S3_BUCKET not provided)"
fi

# Create CloudFront invalidation (best-effort)
if [ -n "$CLOUDFRONT_DIST_ID" ]; then
  echo "Creating CloudFront invalidation for $CLOUDFRONT_DIST_ID"
  aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/$KEY" || echo "CloudFront invalidation failed (possibly no permission or wrong ID)"
else
  echo "Skipping CloudFront invalidation (CLOUDFRONT_DIST_ID not provided)"
fi

# Basic validation: show the object if S3 upload was done
if [ -n "$S3_BUCKET" ]; then
  echo "Listing S3 object"
  aws s3 ls s3://$S3_BUCKET/$KEY --region $AWS_REGION
fi

echo "Smoke test completed successfully"
