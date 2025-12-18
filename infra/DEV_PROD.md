# Dev vs Prod Terraform guidance (TH_insights)

This document explains the low-cost defaults in `infra/` and how to switch to production-safe settings.

## Dev defaults (cost-optimized)
- CloudFront/CDN disabled by default: `enable_s3_cdn = false`.
- S3 lifecycle policy expires assets after `s3_expire_days` (default 30 days).
- Small RDS instance and storage: `db_instance_class = "db.t3.micro"`, `db_allocated_storage = 20`.
- DB backups are disabled for dev: `db_backup_retention_period = 0` (no automated snapshots).
- DB deletion protection disabled: `db_deletion_protection = false` (so you can destroy resources easily in dev).
- ECS/Fargate tasks use a small footprint: `ecs_cpu = "256"`, `ecs_memory = "512"`.
- Secrets: use SSM for dev by setting `use_secrets_manager = false` (so Secrets Manager charges are avoided).

## Prod changes to enable
When promoting to production, set the following (via `terraform.tfvars` or workspace-specific tfvars):
- `enable_s3_cdn = true` and provide `cloudfront_cert_arn` for custom domain + CloudFront.
- Increase DB to multi-AZ and set `db_backup_retention_period` to appropriate days (e.g., 7).
- Enable `use_secrets_manager = true` and store `jwt_secret` in Secrets Manager (or inject via external secrets manager).
- Increase ECS task size and `desired_count` to meet traffic needs; enable stable deployment strategies.
- Consider enabling RDS `multi_az = true` and `deletion_protection = true`.

## Workspaces and remote state
- Use separate workspaces (or separate state buckets) for `dev` and `prod` to avoid drift and accidental changes.
- Consider enabling remote state locking with S3 + DynamoDB to prevent concurrent changes.

## Cost controls & safety
- Add AWS Budget alarms for dev and prod accounts to avoid surprising bills.
- Use `terraform plan` and review diffs carefully before `apply`ing in production.

If you want, I can:
- Add a `dev.tfvars` and `prod.tfvars` file with recommended settings and add a `bootstrap` script to create the state bucket + DynamoDB lock table.
- Add Terraform `locals` that validate and warn if high-cost settings (e.g., multi-AZ) are enabled in the `dev` environment.
