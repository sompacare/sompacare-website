import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";

type StoredObject = {
  key: string;
  contentType: string;
  sizeBytes: number;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return this.isS3Configured() || this.isLocalConfigured();
  }

  isS3Configured(): boolean {
    return Boolean(
      this.config.get("S3_BUCKET_DOCUMENTS") &&
        this.config.get("AWS_ACCESS_KEY_ID") &&
        this.config.get("AWS_SECRET_ACCESS_KEY")
    );
  }

  private isLocalConfigured(): boolean {
    return this.config.get("STORAGE_LOCAL_ENABLED", "true") !== "false";
  }

  private localRoot(): string {
    const configured = this.config.get<string>("STORAGE_LOCAL_PATH");
    return path.resolve(configured ?? path.join(process.cwd(), "uploads"));
  }

  private async getS3() {
    if (!this.isS3Configured()) return null;
    if (!this.s3Client) {
      const { S3Client } = await import("@aws-sdk/client-s3");
      this.s3Client = new S3Client({
        region: this.config.get("AWS_REGION") ?? "us-east-1",
        credentials: {
          accessKeyId: this.config.get<string>("AWS_ACCESS_KEY_ID")!,
          secretAccessKey: this.config.get<string>("AWS_SECRET_ACCESS_KEY")!,
        },
      });
    }
    return this.s3Client;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<StoredObject> {
    if (this.isS3Configured()) {
      const client = await this.getS3();
      const bucket = this.config.get<string>("S3_BUCKET_DOCUMENTS")!;
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      await client!.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      this.logger.log(`Stored s3://${bucket}/${key}`);
      return { key, contentType, sizeBytes: body.length };
    }

    const fullPath = path.join(this.localRoot(), key);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, body);
    this.logger.log(`Stored local://${fullPath}`);
    return { key, contentType, sizeBytes: body.length };
  }

  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string | null> {
    if (this.isS3Configured()) {
      const client = await this.getS3();
      const bucket = this.config.get<string>("S3_BUCKET_DOCUMENTS")!;
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      return getSignedUrl(
        client!,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn }
      );
    }

    if (!existsSync(path.join(this.localRoot(), key))) return null;
    const apiBase = this.config.get("API_PUBLIC_URL") ?? "http://localhost:4000/api/v1";
    return `${apiBase.replace(/\/$/, "")}/files/download?key=${encodeURIComponent(key)}`;
  }

  openLocalReadStream(key: string): Readable | null {
    const fullPath = path.join(this.localRoot(), key);
    if (!existsSync(fullPath)) return null;
    return createReadStream(fullPath);
  }

  guessContentType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".doc")) return "application/msword";
    if (lower.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return "application/octet-stream";
  }
}
