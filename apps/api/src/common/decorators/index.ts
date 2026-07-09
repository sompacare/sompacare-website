import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { PlatformRole, PermissionKey } from "@sompacare/shared";

export const PERMISSIONS_KEY = "permissions";
export const ROLES_KEY = "roles";
export const PUBLIC_KEY = "isPublic";

export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireRoles = (...roles: PlatformRole[]) =>
  SetMetadata(ROLES_KEY, roles);

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: PlatformRole[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  }
);

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: "createdAt" })
  @IsOptional()
  @IsString()
  sort?: string = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc" = "desc";
}

export function paginate(page = 1, limit = 20) {
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
