import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker, type Job } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeService } from "../realtime/realtime.service";

export type ReminderJobData = {
  type: "shift.reminder" | "compliance.escalation" | "urgent.shift";
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: string;
  phone?: string;
  sendSms?: boolean;
  sendPush?: boolean;
};

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private queue: Queue<ReminderJobData> | null = null;
  private worker: Worker<ReminderJobData> | null = null;
  private readonly memoryTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private config: ConfigService,
    private notifications: NotificationsService,
    private realtime: RealtimeService
  ) {
    this.initQueue();
  }

  private useDevBypass() {
    return this.config.get("JOBS_DEV_BYPASS", "true") === "true";
  }

  private getConnectionOptions(): ConnectionOptions | null {
    const redisUrl = this.config.get<string>("REDIS_URL")?.trim();
    if (!redisUrl) return null;

    const parsed = new URL(redisUrl);
    const tls = redisUrl.startsWith("rediss://") ? {} : undefined;
    const username = parsed.username && parsed.username !== "default" ? parsed.username : undefined;
    const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;

    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(tls !== undefined ? { tls } : {}),
    };
  }

  private initQueue() {
    if (this.useDevBypass()) {
      this.logger.log("Jobs queue using in-memory dev bypass");
      return;
    }

    try {
      const connection = this.getConnectionOptions();
      if (!connection) {
        this.logger.log("REDIS_URL unset — jobs use in-memory fallback");
        return;
      }
      this.queue = new Queue<ReminderJobData>("sompacare-reminders", { connection });
      this.worker = new Worker<ReminderJobData>(
        "sompacare-reminders",
        async (job) => this.processJob(job),
        { connection }
      );
      this.logger.log("BullMQ reminder queue connected");
    } catch (err) {
      this.logger.warn(`BullMQ init failed, using memory fallback: ${(err as Error).message}`);
    }
  }

  async scheduleReminder(
    data: ReminderJobData,
    delayMs: number,
    jobId?: string
  ): Promise<{ scheduled: boolean; devBypass: boolean; jobId?: string }> {
    const id = jobId ?? `${data.type}-${data.userId}-${Date.now()}`;

    if (this.queue && !this.useDevBypass()) {
      await this.queue.add(data.type, data, {
        jobId: id,
        delay: Math.max(delayMs, 1000),
        removeOnComplete: true,
      });
      return { scheduled: true, devBypass: false, jobId: id };
    }

    const existing = this.memoryTimers.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      void this.processJob({ data } as Job<ReminderJobData>);
      this.memoryTimers.delete(id);
    }, Math.max(delayMs, 1000));

    this.memoryTimers.set(id, timer);
    this.logger.log(`Scheduled in-memory job ${id} in ${delayMs}ms`);
    return { scheduled: true, devBypass: true, jobId: id };
  }

  private async processJob(job: Job<ReminderJobData> | { data: ReminderJobData }) {
    const data = job.data;
    this.logger.log(`Processing reminder: ${data.type} for ${data.userId}`);

    await this.notifications.deliverReminder(data);

    this.realtime.emitToUser(data.userId, "notification:new", {
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
    });
  }

  async onModuleDestroy() {
    for (const timer of this.memoryTimers.values()) clearTimeout(timer);
    await this.worker?.close();
    await this.queue?.close();
  }
}
