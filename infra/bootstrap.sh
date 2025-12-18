#!/usr/bin/env bash
# Bootstrap script to create an S3 bucket for Terraform remote state and a DynamoDB table for locking.
# Usage: ./bootstrap.sh -b <state-bucket-name> -r <region> -t <dynamodb-table>

set -eu

BUCKET=""
REGION="us-east-1"
TABLE="terraform-locks"

while getopts "b:r:t:" opt; do
  case ${opt} in
    b) BUCKET=${OPTARG} ;;
    r) REGION=${OPTARG} ;;
    t) TABLE=${OPTARG} ;;
    *) echo "Usage: $0 -b <bucket> [-r <region>] [-t <dynamodb-table>]"; exit 1 ;;
  esac
done

if [ -z "$BUCKET" ]; then
  echo "Error: bucket name required. Usage: $0 -b <bucket> [-r <region>] [-t <dynamodb-table>]"
  exit 1
fi

echo "Region: $REGION"
echo "Creating S3 bucket: $BUCKET"

# Create bucket (handle regions that require LocationConstraint)
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Bucket $BUCKET already exists and is accessible"
else
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" --create-bucket-configuration LocationConstraint=$REGION
  fi
  echo "Created bucket $BUCKET"
fi

# Block public access
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration '{"BlockPublicAcls":true,"IgnorePublicAcls":true,"BlockPublicPolicy":true,"RestrictPublicBuckets":true}' || true

# Enable default encryption
aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' || true

# Enable versioning
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled || true

# Create DynamoDB table for locking
echo "Ensuring DynamoDB table: $TABLE"
if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "DynamoDB table $TABLE already exists"
else
  aws dynamodb create-table --table-name "$TABLE" --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --region "$REGION"
  echo "Created DynamoDB table $TABLE"
fi

cat <<EOF

Bootstrap complete.
Next: add the backend configuration to Terraform (example in infra/backend.tf.example) and run:

terraform init -backend-config="bucket=$BUCKET" -backend-config="key=th-insights/terraform.tfstate" -backend-config="region=$REGION" -backend-config="dynamodb_table=$TABLE"

EOF
