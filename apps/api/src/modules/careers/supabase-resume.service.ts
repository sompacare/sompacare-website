import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_BUCKET = "application-files";

@Injectable()
export class SupabaseResumeService {
  private readonly logger = new Logger(SupabaseResumeService.name);
  private client: SupabaseClient | null = null;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return this.hasSupabaseCredentials() || this.isLocalDevMirrorEnabled();
  }

  private hasSupabaseCredentials(): boolean {
    const url = this.config.get<string>("SUPABASE_URL") ??
      this.config.get<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    return Boolean(url && key);
  }

  private localDevRoot(): string {
    const configured = this.config.get<string>("STORAGE_LOCAL_PATH");
    return path.resolve(configured ?? path.join(process.cwd(), "uploads"));
  }

  private isLocalDevMirrorEnabled(): boolean {
    return this.config.get("SUPABASE_RESUME_LOCAL_MIRROR", "true") !== "false";
  }

  canDownload(storagePath: string): boolean {
    if (this.hasSupabaseCredentials()) return true;
    if (!this.isLocalDevMirrorEnabled()) return false;
    return existsSync(path.join(this.localDevRoot(), storagePath));
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url =
      this.config.get<string>("SUPABASE_URL") ??
      this.config.get<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      throw new Error("Supabase is not configured for resume sync");
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.client;
  }

  isSupabaseStoragePath(storagePath: string | undefined | null): boolean {
    if (!storagePath) return false;
    return storagePath.startsWith("resumes/") || storagePath.startsWith("certifications/");
  }

  async download(storagePath: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.hasSupabaseCredentials()) {
      return this.downloadLocalMirror(storagePath);
    }

    const supabase = this.getClient();
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(storagePath);

    if (error || !data) {
      this.logger.warn(
        `Supabase download failed for ${storagePath}: ${error?.message ?? "no data"}`
      );
      throw new Error(`Could not download ${storagePath} from Supabase`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = data.type || this.guessContentType(storagePath);
    return { buffer, contentType };
  }

  private downloadLocalMirror(storagePath: string): { buffer: Buffer; contentType: string } {
    if (!this.isLocalDevMirrorEnabled()) {
      throw new Error("Supabase is not configured for resume sync");
    }

    const fullPath = path.join(this.localDevRoot(), storagePath);
    if (!existsSync(fullPath)) {
      this.logger.warn(`Local resume mirror missing for ${storagePath}`);
      throw new Error(`Could not download ${storagePath} from local mirror`);
    }

    const buffer = readFileSync(fullPath);
    return { buffer, contentType: this.guessContentType(storagePath) };
  }

  private guessContentType(filePath: string): string {
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".doc")) return "application/msword";
    if (lower.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return "application/octet-stream";
  }
}
