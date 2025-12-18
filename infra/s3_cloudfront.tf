resource "random_id" "assets_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "assets" {
  bucket = "${var.project}-${var.env}-assets-${random_id.assets_bucket_suffix.hex}"
  acl    = "private"
  force_destroy = false

  server_side_encryption_configuration {
    rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
  }

  versioning { enabled = true }

  lifecycle_rule {
    id      = "expire-old"
    enabled = true
    expiration { days = var.s3_expire_days }
  }
}

resource "aws_cloudfront_origin_access_control" "assets_oac" {
  count = var.enable_s3_cdn ? 1 : 0
  name  = "${var.project}-${var.env}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  count = var.enable_s3_cdn && length(var.cloudfront_cert_arn) > 0 ? 1 : 0
  enabled = true

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "s3-${aws_s3_bucket.assets.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets_oac[0].id
  }

  default_cache_behavior {
    target_origin_id = "s3-${aws_s3_bucket.assets.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods = ["GET","HEAD","OPTIONS"]
    cached_methods  = ["GET","HEAD"]
    forwarded_values { query_string = false }
  }

  viewer_certificate {
    acm_certificate_arn = var.cloudfront_cert_arn
    ssl_support_method  = "sni-only"
  }
}

output "assets_bucket" { value = aws_s3_bucket.assets.bucket }
output "cloudfront_domain" { value = length(aws_cloudfront_distribution.cdn) > 0 ? aws_cloudfront_distribution.cdn[0].domain_name : "" }
