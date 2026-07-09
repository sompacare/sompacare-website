variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "documents_bucket_name" {
  type = string
}

variable "db_name" {
  type    = string
  default = "sompacare_platform"
}

variable "db_username" {
  type    = string
  default = "sompacare"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "rds_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "api_image" {
  type    = string
  default = "sompacare/api:latest"
}

variable "api_port" {
  type    = number
  default = 4000
}

variable "ecs_desired_count" {
  type    = number
  default = 2
}

variable "sentry_dsn" {
  type      = string
  default   = ""
  sensitive = true
}
