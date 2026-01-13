terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
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

variable "db_endpoint" {
  description = "RDS database endpoint"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = ""
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# Data sources to reference existing ALBs, target groups, and default VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "subnet-id"
    values = ["subnet-057cc109e4e13ddd8", "subnet-0f055b2bd5e5b2799", "subnet-063c3a2fe1fd5a1b6"]
  }
}

data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.default.id
  name   = "default"
}

data "aws_lb" "backend" {
  name = "${var.project_name}-backend-alb"
}

data "aws_lb" "frontend" {
  name = "${var.project_name}-frontend-alb"
}

data "aws_lb_target_group" "backend" {
  name = "${var.project_name}-backend-tg"
}

data "aws_lb_target_group" "frontend" {
  name = "${var.project_name}-frontend-tg"
}
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "th-insights-backend:12"
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [data.aws_security_group.default.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = data.aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.project_name}-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "th-insights-frontend:1"
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [data.aws_security_group.default.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = data.aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  tags = {
    Name = "${var.project_name}-frontend-service"
  }
}

# ECR VPC Endpoints in default VPC for frontend task
resource "aws_vpc_endpoint" "ecr_api_default" {
  vpc_id              = data.aws_vpc.default.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = slice(data.aws_subnets.default.ids, 0, min(2, length(data.aws_subnets.default.ids)))
  security_group_ids  = [data.aws_security_group.default.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-api-endpoint-default"
  }
}

resource "aws_vpc_endpoint" "ecr_dkr_default" {
  vpc_id              = data.aws_vpc.default.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = slice(data.aws_subnets.default.ids, 0, min(2, length(data.aws_subnets.default.ids)))
  security_group_ids  = [data.aws_security_group.default.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-dkr-endpoint-default"
  }
}

# VPC Peering between default VPC and Terraform VPC
resource "aws_vpc_peering_connection" "default_to_terraform" {
  vpc_id      = data.aws_vpc.default.id
  peer_vpc_id = module.vpc.vpc_id
  auto_accept = true

  tags = {
    Name = "${var.project_name}-peering"
  }
}

# Route in default VPC to Terraform VPC through peering
resource "aws_route" "default_to_terraform" {
  route_table_id            = data.aws_route_table.default_main.id
  destination_cidr_block    = module.vpc.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.default_to_terraform.id
}

# Route in Terraform VPC to default VPC through peering
resource "aws_route" "terraform_to_default" {
  route_table_id            = module.vpc.public_route_table_id
  destination_cidr_block    = data.aws_vpc.default.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.default_to_terraform.id
}

# Data source for default VPC main route table
data "aws_route_table" "default_main" {
  vpc_id = data.aws_vpc.default.id
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

# Outputs
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnet_ids
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnet_ids
  description = "Private subnet IDs"
}

output "ecs_security_group_id" {
  value       = module.vpc.ecs_security_group_id
  description = "ECS security group ID"
}

output "alb_security_group_id" {
  value       = module.vpc.alb_security_group_id
  description = "ALB security group ID"
}

output "ecs_cluster_id" {
  value       = aws_ecs_cluster.main.id
  description = "ECS cluster ID"
}
