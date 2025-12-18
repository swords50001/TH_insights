# Conditionally use Secrets Manager (prod) or SSM Parameter (dev)
resource "aws_secretsmanager_secret" "jwt" {
  count = var.use_secrets_manager ? 1 : 0
  name  = "${var.project}-${var.env}-jwt"
}
resource "aws_secretsmanager_secret_version" "jwt_ver" {
  count = var.use_secrets_manager ? 1 : 0
  secret_id = var.use_secrets_manager ? aws_secretsmanager_secret.jwt[0].id : null
  secret_string = var.use_secrets_manager ? jsonencode({ jwt_secret = var.jwt_secret }) : null
}

resource "aws_ssm_parameter" "jwt_ssm" {
  count = var.use_secrets_manager ? 0 : 1
  name  = "/${var.project}/${var.env}/jwt"
  type  = "SecureString"
  value = var.jwt_secret
}

output "jwt_secret_arn" {
  value = var.use_secrets_manager ? aws_secretsmanager_secret.jwt[0].arn : ""
  description = "ARN of Secrets Manager secret (if enabled)"
}

output "jwt_ssm_parameter" {
  value = var.use_secrets_manager ? "" : aws_ssm_parameter.jwt_ssm[0].name
  description = "SSM parameter name (if used)"
}
