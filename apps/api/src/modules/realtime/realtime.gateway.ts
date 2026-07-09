import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { RealtimeService } from "./realtime.service";

@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") ?? [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
    ],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private authService: AuthService,
    private realtimeService: RealtimeService
  ) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const raw = (client.handshake.auth?.token as string) ?? "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    if (!token) {
      client.disconnect();
      return;
    }

    const user = await this.authService.validateToken(token);
    if (!user) {
      client.disconnect();
      return;
    }

    client.data.userId = user.id;
    client.join(`user:${user.id}`);

    if (user.roles.some((r) => r === "FACILITY_MANAGER" || r === "FACILITY_STAFF")) {
      client.join("facility:managers");
    }

    this.logger.debug(`Client connected: ${user.id}`);
    client.emit("connected", { userId: user.id });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.data.userId ?? "unknown"}`);
  }
}
