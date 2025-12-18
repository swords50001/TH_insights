data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Focused deployer policy for GitHub Actions OIDC role used by CI/CD to perform deploy operations in staging
# Grants ECR push, ECS update, S3 put, CloudFront invalidation, and logs write for relevant resources

data "aws_iam_policy_document" "gh_deployer" {
  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:CreateRepository"
    ]
    resources = ["arn:aws:ecr:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:repository/${var.project}-${var.env}-*"]
  }

  statement {
    sid    = "ECSUpdate"
    effect = "Allow"
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "iam:PassRole"
    ]
    resources = [
      aws_ecs_cluster.main.arn,
      aws_ecs_service.service.arn,
      aws_iam_role.ecs_task_role.arn,
      aws_iam_role.ecs_task_execution.arn
    ]
  }

  statement {
    sid    = "S3Put"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.assets.arn,
      "${aws_s3_bucket.assets.arn}/*"
    ]
  }

  statement {
    sid    = "CloudFrontInvalidate"
    effect = "Allow"
    actions = ["cloudfront:CreateInvalidation"]
    resources = ["arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = ["logs:CreateLogStream","logs:PutLogEvents","logs:DescribeLogStreams"]
    resources = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/${var.project}-${var.env}-*"]
  }
}

resource "aws_iam_policy" "gh_deployer" {
  name   = "${var.project}-${var.env}-gh-deployer-policy"
  policy = data.aws_iam_policy_document.gh_deployer.json
}

resource "aws_iam_role_policy_attachment" "gh_deployer_attach" {
  role       = aws_iam_role.github_actions_deployer.name
  policy_arn = aws_iam_policy.gh_deployer.arn
}

output "gh_deployer_policy_arn" {
  value = aws_iam_policy.gh_deployer.arn
}
