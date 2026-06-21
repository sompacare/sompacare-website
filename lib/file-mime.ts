const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function resolveFileMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[ext] ?? "";
}

export function isAllowedResumeMime(mime: string): boolean {
  return (
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export function isAllowedCertMime(mime: string): boolean {
  return isAllowedResumeMime(mime) || mime === "image/jpeg" || mime === "image/png";
}
