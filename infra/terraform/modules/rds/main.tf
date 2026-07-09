variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "allowed_cidr_blocks" { type = list(string) }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "instance_class" { type = string }

resource "aws_db_subnet_group" "main" {
  name       = "sompacare-db-${var.environment}"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "sompacare-db-${var.environment}" }
}

resource "aws_security_group" "rds" {
  name        = "sompacare-rds-${var.environment}"
  description = "RDS access from VPC"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier              = "sompacare-${var.environment}"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = var.instance_class
  allocated_storage       = 20
  max_allocated_storage   = 100
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  skip_final_snapshot     = var.environment != "prod"
  backup_retention_period = 7
  storage_encrypted       = true
  publicly_accessible     = false
  multi_az                = var.environment == "prod"

  tags = { Name = "sompacare-rds-${var.environment}" }
}

output "endpoint" { value = aws_db_instance.main.address }
