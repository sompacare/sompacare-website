import { Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions("notifications:read")
  @ApiOperation({ summary: "List in-app notifications for current user" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    const take = Math.min(Number(limit) || 20, 50);
    return this.notificationsService.findForUser(user.id, take);
  }

  @Get("unread-count")
  @RequirePermissions("notifications:read")
  @ApiOperation({ summary: "Unread in-app notification count" })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post("read-all")
  @RequirePermissions("notifications:read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(":id/read")
  @RequirePermissions("notifications:read")
  @ApiOperation({ summary: "Mark notification as read" })
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user.id);
  }
}
