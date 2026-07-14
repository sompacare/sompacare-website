import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";
import { StorageService } from "../../common/storage/storage.service";
import { SupabaseResumeService } from "./supabase-resume.service";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "resume.pdf";
}

@Injectable()
export class CandidateResumeSyncService {
  private readonly logger = new Logger(CandidateResumeSyncService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private supabase: SupabaseResumeService
  ) {}

  async syncFromSupabase(input: {
    candidateId: string;
    supabasePath: string;
    fileName?: string | null;
  }) {
    if (!this.supabase.isSupabaseStoragePath(input.supabasePath)) {
      return { synced: false, reason: "not_supabase_path" as const };
    }

    if (!this.supabase.isConfigured()) {
      this.logger.warn("Supabase not configured — skipping resume copy");
      return { synced: false, reason: "supabase_not_configured" as const };
    }

    if (!this.storage.isConfigured()) {
      this.logger.warn("Platform storage not configured — skipping resume copy");
      return { synced: false, reason: "storage_not_configured" as const };
    }

    const existing = await this.prisma.candidate.findUnique({
      where: { id: input.candidateId },
      select: { resumeStorageKey: true, resumeSourcePath: true },
    });

    if (
      existing?.resumeStorageKey &&
      existing.resumeSourcePath === input.supabasePath
    ) {
      return {
        synced: true,
        storageKey: existing.resumeStorageKey,
        reused: true,
      };
    }

    const downloaded = await this.supabase.download(input.supabasePath);
    const fileName =
      input.fileName?.trim() ||
      input.supabasePath.split("/").pop() ||
      "resume.pdf";
    const storageKey = `candidates/${input.candidateId}/${Date.now()}-${sanitizeFileName(fileName)}`;

    const stored = await this.storage.putObject(
      storageKey,
      downloaded.buffer,
      downloaded.contentType || this.storage.guessContentType(fileName)
    );

    await this.prisma.candidate.update({
      where: { id: input.candidateId },
      data: {
        resumeStorageKey: stored.key,
        resumeFileName: fileName,
        resumeSourcePath: input.supabasePath,
        resumeUrl: stored.key,
      },
    });

    this.logger.log(
      `Copied resume for candidate ${input.candidateId}: ${input.supabasePath} → ${stored.key}`
    );

    return { synced: true, storageKey: stored.key, reused: false };
  }

  async getResumeDownload(candidateId: string, recruiterId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, recruiterId },
      select: {
        resumeStorageKey: true,
        resumeFileName: true,
        resumeSourcePath: true,
        resumeUrl: true,
      },
    });

    if (!candidate) return null;

    const storageKey = candidate.resumeStorageKey ?? candidate.resumeUrl;
    if (!storageKey || this.supabase.isSupabaseStoragePath(storageKey)) {
      return null;
    }

    const url = await this.storage.getDownloadUrl(storageKey);
    if (!url) return null;

    return {
      url,
      fileName: candidate.resumeFileName ?? "resume",
      storageKey,
      sourcePath: candidate.resumeSourcePath,
    };
  }
}
