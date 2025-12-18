variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project" {
  description = "Project prefix"
  type        = string
  default     = "th-insights"
}

variable "env" {
  description = "Environment name (dev/prod)"
  type        = string
  default     = "prod"
}

variable "create_vpc" {
  description = "Whether to create a VPC or use existing"
  type        = bool
  default     = true
}

variable "vpc_cidr" { type = string; default = "10.0.0.0/16" }
variable "public_subnet_cidrs" { type = list(string); default = ["10.0.1.0/24","10.0.2.0/24"] }
variable "private_subnet_cidrs" { type = list(string); default = ["10.0.101.0/24","10.0.102.0/24"] }

# If create_vpc == false, provide these
variable "vpc_id" { type = string; default = "" }
variable "public_subnet_ids" { type = list(string); default = [] }
variable "private_subnet_ids" { type = list(string); default = [] }

variable "db_instance_class" { type = string; default = "db.t3.micro" }
variable "db_allocated_storage" { type = number; default = 20 }
variable "db_username" { type = string; default = "th_admin" }

variable "cloudfront_cert_arn" { type = string; default = "" }
variable "domain_name" { type = string; default = "" }
variable "hosted_zone_id" { type = string; default = "" }

# S3
variable "enable_s3_cdn" { type = bool; default = false }
variable "s3_expire_days" { type = number; default = 30 }

# ECS
variable "ecs_cpu" { type = string; default = "256" }
variable "ecs_memory" { type = string; default = "512" }
variable "use_fargate_spot" { type = bool; default = false }
variable "desired_count" { type = number; default = 1 }

# DB cost options
variable "db_backup_retention_period" { type = number; default = 0 }
variable "db_deletion_protection" { type = bool; default = false }

# Secrets selection
variable "use_secrets_manager" { type = bool; default = false }

# GitHub OIDC usage: provide repo selector
variable "github_oidc_repo" { type = string; default = "owner/repo" }

# Secrets (for initial creation you can provide JWT here, or store later in Secrets Manager)
variable "jwt_secret" { type = string; default = "" }
