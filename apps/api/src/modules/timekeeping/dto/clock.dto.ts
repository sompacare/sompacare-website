import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ClockLocationDto {
  @ApiProperty({ example: 39.2904 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: -76.6122 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;
}

export class ProxyClockDto {
  @ApiPropertyOptional({ description: "Optional override timestamp (ISO). Defaults to now." })
  @IsOptional()
  @IsString()
  timestamp?: string;

  @ApiPropertyOptional({ description: "Reason for manual clock (audit trail)" })
  @IsOptional()
  @IsString()
  note?: string;
}
