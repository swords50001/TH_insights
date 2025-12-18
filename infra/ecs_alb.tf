resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.env}-cluster"
}

resource "aws_lb" "alb" {
  name = "${var.project}-${var.env}-alb"
  internal = false
  load_balancer_type = "application"
  subnets = local.public_subnets_ids
  security_groups = [aws_security_group.alb_sg.id]
}

resource "aws_security_group" "alb_sg" {
  name   = "${var.project}-${var.env}-alb-sg"
  vpc_id = local.vpc_id
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_lb_target_group" "tg" {
  name     = "${var.project}-${var.env}-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = local.vpc_id
  health_check { path = "/health"; interval = 30; timeout = 5 }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port = 80
  default_action { type = "forward"; target_group_arn = aws_lb_target_group.tg.arn }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.env}-task"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "backend",
      image = "${aws_ecr_repository.backend.repository_url}:latest",
      essential = true,
      portMappings = [{ containerPort = 8080, hostPort = 8080 }],
      environment = [{ name = "DB_SECRET_ARN", value = aws_secretsmanager_secret.db.arn }]
    }
  ])
}

resource "aws_ecs_service" "service" {
  name            = "${var.project}-${var.env}-svc"
  cluster         = aws_ecs_cluster.main.id
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.app.arn

  network_configuration {
    subnets = local.private_subnets_ids
    security_groups = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg.arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_security_group" "ecs_sg" {
  name = "${var.project}-${var.env}-ecs-sg"
  vpc_id = local.vpc_id
  ingress { from_port = 8080; to_port = 8080; protocol = "tcp"; security_groups = [aws_security_group.alb_sg.id] }
  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

output "alb_dns" { value = aws_lb.alb.dns_name }
