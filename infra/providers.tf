terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = { source = "hashicorp/aws" }
    random = { source = "hashicorp/random" }
  }
}

# Uncomment and configure the backend block to enable remote state in S3
# terraform {
#   backend "s3" {
#     bucket = "your-terraform-state-bucket"
#     key    = "th-insights/terraform.tfstate"
#     region = "us-west-2"
#   }
# }

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
