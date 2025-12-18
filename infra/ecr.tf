resource "aws_ecr_repository" "backend" {
  name = "${var.project}-${var.env}-backend"
  image_scanning_configuration { scan_on_push = true }
}

output "ecr_repo_url" { value = aws_ecr_repository.backend.repository_url }
