import "server-only";

import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sompacare_admin_session";

export function getAdminSessionToken(): string | undefined {
  return process.env.ADMIN_SESSION_TOKEN;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (expectedEmail && normalizedEmail !== expectedEmail) return false;
  return verifyAdminPassword(password);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = getAdminSessionToken();
  if (!token) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === token;
}

export async function setAdminSession(): Promise<void> {
  const token = getAdminSessionToken();
  if (!token) throw new Error("ADMIN_SESSION_TOKEN is not configured.");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
