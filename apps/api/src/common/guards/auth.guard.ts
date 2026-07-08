import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, PlatformRole } from "@sompacare/shared";
import {
  AuthenticatedUser,
  PERMISSIONS_KEY,
  PUBLIC_KEY,
  ROLES_KEY,
} from "../decorators";
import { AuthService } from "../../modules/auth/auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      if (!hasRole && !user.roles.includes(PlatformRole.SUPER_ADMIN)) {
        throw new ForbiddenException("Insufficient role");
      }
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (requiredPermissions?.length) {
      if (!hasPermission(user.roles, requiredPermissions as never)) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    return true;
  }
}
