import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isAllowedCertMime, isAllowedResumeMime, resolveFileMime } from "@/lib/file-mime";
import type { ApplicationRecord } from "./types";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type ApplicationInsert = Omit<
  ApplicationRecord,
  "created_at" | "updated_at" | "status" | "onboarding_sent_at"
> & {
  id?: string;
  status?: ApplicationRecord["status"];
  onboarding_sent_at?: string | null;
};

export async function insertApplication(data: ApplicationInsert) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: row, error } = await supabase
    .from("applications")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return row as ApplicationRecord;
}

export async function listApplications() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApplicationRecord[];
}

export async function getApplication(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();
  if (error) return null;
  return data as ApplicationRecord;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationRecord["status"],
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ApplicationRecord;
}

export async function markOnboardingSent(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("applications")
    .update({ onboarding_sent_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ApplicationRecord;
}

export async function updateApplicationFiles(
  id: string,
  files: {
    resume_url: string | null;
    resume_file_name: string | null;
    certification_urls: ApplicationRecord["certification_urls"];
  },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("applications")
    .update(files)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ApplicationRecord;
}

const BUCKET = "application-files";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_CERT_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadApplicationFile(
  file: File,
  folder: "resumes" | "certifications",
  applicationId: string,
): Promise<{ path: string; fileName: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const maxSize = folder === "resumes" ? MAX_RESUME_BYTES : MAX_CERT_BYTES;
  if (file.size > maxSize) {
    throw new Error(`File "${file.name}" exceeds the size limit.`);
  }

  const mime = resolveFileMime(file);
  const allowed = folder === "resumes" ? isAllowedResumeMime(mime) : isAllowedCertMime(mime);
  if (!allowed) {
    throw new Error(`File type not allowed for "${file.name}".`);
  }

  const path = `${folder}/${applicationId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime || "application/octet-stream",
    upsert: false,
  });

  if (error) throw error;

  return { path, fileName: file.name };
}

export async function createSignedFileUrl(storagePath: string, expiresIn = 3600) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) return null;
  return data.signedUrl;
}
