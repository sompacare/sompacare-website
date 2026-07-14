import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LegalDocumentType } from "@sompacare/database";
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class RecordConsentDto {
  @ApiProperty({ type: [String], enum: LegalDocumentType })
  @IsArray()
  @IsEnum(LegalDocumentType, { each: true })
  documentTypes!: LegalDocumentType[];

  @ApiProperty({ example: "careers_apply" })
  @IsString()
  @MinLength(1)
  context!: string;

  @ApiPropertyOptional({ description: "Required for public/unauthenticated consent" })
  @IsOptional()
  @IsEmail()
  email?: string;
}
