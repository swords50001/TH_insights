# ECS execution role
data "aws_iam_policy_document" "ecs_exec_assume" {
  statement { actions = ["sts:AssumeRole"] principals { type = "Service" identifiers = ["ecs-tasks.amazonaws.com"] } }
}
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project}-${var.env}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_exec_assume.json
}
resource "aws_iam_role_policy_attachment" "exec_ecr" {
  role = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS task role - app permissions (S3, Secrets Manager). Tighten ARNs in prod.
data "aws_iam_policy_document" "ecs_task_policy_doc" {
  statement {
    actions = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
  }
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = ["*"]
  }
}
resource "aws_iam_policy" "ecs_task_policy" {
  name = "${var.project}-${var.env}-ecs-task-policy"
  policy = data.aws_iam_policy_document.ecs_task_policy_doc.json
}
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project}-${var.env}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_exec_assume.json
}
resource "aws_iam_role_policy_attachment" "task_attach" {
  role = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}

# GitHub OIDC provider and role (minimal trust for repo); edit repo var to match
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions_deployer" {
  name = "${var.project}-${var.env}-gh-deployer"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = { StringLike = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_oidc_repo}:ref:refs/heads/main" } }
    }]
  })
}

# The focused deployer policy (ECR/ECS/S3/CloudFront) is defined and attached in `infra/iam/deployer_policy.tf`.
# Promote or tighten ARNs in production for least privilege.
