aws_region = "us-east-1"
project = "th-insights"
env = "prod"
create_vpc = true

# CDN recommended in prod
enable_s3_cdn = true
s3_expire_days = 365

# production ECS size
ecs_cpu = "512"
ecs_memory = "1024"
use_fargate_spot = false
desired_count = 2

# DB production settings
# Consider using a larger instance class and multi-AZ in production
db_instance_class = "db.t3.small"
db_allocated_storage = 50
db_backup_retention_period = 7
db_deletion_protection = true

# Use Secrets Manager in prod
use_secrets_manager = true

# Provide jwt_secret via secrets manager or pipeline
jwt_secret = ""
