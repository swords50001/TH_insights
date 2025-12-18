# Create a VPC optionally using terraform-aws-modules/vpc
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 4.0"

  enable_dns_hostnames = true
  enable_dns_support   = true

  name = "${var.project}-${var.env}-vpc"
  cidr = var.vpc_cidr

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs

  tags = { "Name" = "${var.project}-${var.env}" }

  count = var.create_vpc ? 1 : 0
}

# Data AZ
data "aws_availability_zones" "available" {}

# Expose subnet ids when module was created
locals {
  public_subnets_ids  = var.create_vpc ? module.vpc.public_subnets : var.public_subnet_ids
  private_subnets_ids = var.create_vpc ? module.vpc.private_subnets : var.private_subnet_ids
  vpc_id              = var.create_vpc ? module.vpc.vpc_id : var.vpc_id
}
