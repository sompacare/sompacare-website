import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class VerifyEmployeeDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "SC-A1B2C3" })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  employeeNumber!: string;
}

export class BootstrapWorkerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  employeeNumber?: string;
}
