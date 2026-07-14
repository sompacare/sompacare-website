import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "@sompacare/database";
import { IsEnum } from "class-validator";

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
