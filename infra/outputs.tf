output "ecr_repo_url" { value = aws_ecr_repository.backend.repository_url }
output "alb_dns" { value = aws_lb.alb.dns_name }
output "cloudfront_domain" { value = length(aws_cloudfront_distribution.cdn) > 0 ? aws_cloudfront_distribution.cdn[0].domain_name : "" }
output "assets_bucket" { value = aws_s3_bucket.assets.bucket }
output "db_secret_arn" { value = aws_secretsmanager_secret.db.arn }
output "jwt_secret_arn" { value = aws_secretsmanager_secret.jwt.arn }
