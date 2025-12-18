resource "random_password" "db_password" { length = 16 }

resource "aws_db_subnet_group" "db_subnets" {
  name       = "${var.project}-${var.env}-db-subnet"
  subnet_ids = local.private_subnets_ids
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.project}-${var.env}-db"
  engine = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  username = var.db_username
  password = random_password.db_password.result
  db_subnet_group_name = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible = false
  multi_az = false
  backup_retention_period = var.db_backup_retention_period
  deletion_protection = var.db_deletion_protection
  skip_final_snapshot = true
}

resource "aws_security_group" "rds_sg" {
  name = "${var.project}-${var.env}-rds-sg"
  vpc_id = local.vpc_id
  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }
  egress { from_port=0; to_port=0; protocol="-1"; cidr_blocks=["0.0.0.0/0"] }
}

# Put DB credentials into Secrets Manager
resource "aws_secretsmanager_secret" "db" {
  name = "${var.project}-${var.env}-db-credentials"
}
resource "aws_secretsmanager_secret_version" "db_version" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({ username = var.db_username, password = random_password.db_password.result, host = aws_db_instance.postgres.address, dbname = aws_db_instance.postgres.db_name })
}

output "rds_endpoint" { value = aws_db_instance.postgres.address }
output "db_secret_arn" { value = aws_secretsmanager_secret.db.arn }
