terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "th-insights-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "th-insights"
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets    = ["10.0.11.0/24", "10.0.12.0/24"]
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs
  
  database_name     = "th_db"
  master_username   = "postgres"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
}

# ECR Repositories
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnet_ids
  certificate_arn = aws_acm_certificate.main.arn
}

# ECS Services
module "ecs_backend" {
  source = "./modules/ecs-service"
  
  project_name = var.project_name
  environment  = var.environment
  service_name = "backend"
  
  cluster_id        = aws_ecs_cluster.main.id
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnet_ids
  
  container_port   = 8080
  cpu              = "512"
  memory           = "1024"
  desired_count    = 2
  
  image_url        = "${aws_ecr_repository.backend.repository_url}:latest"
  target_group_arn = module.alb.backend_target_group_arn
  
  environment_variables = {
    NODE_ENV      = "production"
    PORT          = "8080"
    DATABASE_HOST = module.rds.endpoint
    DATABASE_PORT = "5432"
    DATABASE_NAME = module.rds.database_name
  }
  
  secrets = {
    DATABASE_PASSWORD = aws_secretsmanager_secret.db_password.arn
    JWT_SECRET       = aws_secretsmanager_secret.jwt_secret.arn
  }
}

module "ecs_frontend" {
  source = "./modules/ecs-service"
  
  project_name = var.project_name
  environment  = var.environment
  service_name = "frontend"
  
  cluster_id        = aws_ecs_cluster.main.id
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnet_ids
  
  container_port   = 80
  cpu              = "256"
  memory           = "512"
  desired_count    = 2
  
  image_url        = "${aws_ecr_repository.frontend.repository_url}:latest"
  target_group_arn = module.alb.frontend_target_group_arn
  
  environment_variables = {
    VITE_API_URL = "https://api.${var.domain_name}"
  }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}/db-password"
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}/jwt-secret"
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Route53 & ACM Certificate (if using custom domain)
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "yourdomain.com"
}

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}
