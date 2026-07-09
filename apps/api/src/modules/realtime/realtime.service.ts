import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
    this.logger.log("Socket.IO server registered");
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitShiftUpdate(facilityId: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`facility:${facilityId}`).emit("shift:updated", payload);
  }

  broadcast(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }
}
