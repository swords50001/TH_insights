aws_region = "us-east-1"
project = "th-insights"
env = "dev"
create_vpc = true

# CDN disabled in dev to save costs
enable_s3_cdn = false
s3_expire_days = 7

# small ECS task size
ecs_cpu = "256"
ecs_memory = "512"
use_fargate_spot = false
desired_count = 1

# DB small/dev settings
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_backup_retention_period = 0
db_deletion_protection = false

# use SSM for dev secrets (avoid Secrets Manager charges)
use_secrets_manager = false

# Optional: fill these after apply or via other tools
jwt_secret = "dev-jwt-secret-placeholder"
