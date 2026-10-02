import { env } from "cloudflare:workers";

export async function storageRequest(key: string, init: RequestInit = {}) {
  const config = env as unknown as { SUPABASE_URL?: string; SUPABASE_STORAGE_BUCKET?: string; SUPABASE_SECRET_KEY?: string };
  if (!config.SUPABASE_URL || !config.SUPABASE_STORAGE_BUCKET || !config.SUPABASE_SECRET_KEY) {
    throw new Error("Image storage is not configured.");
  }
  const base = new URL(config.SUPABASE_URL);
  if (base.protocol !== "https:" || !base.hostname.endsWith(".supabase.co")) throw new Error("Invalid storage endpoint.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.SUPABASE_SECRET_KEY);
  const path = key.split("/").map(encodeURIComponent).join("/");
  return fetch(`${base.origin}/storage/v1/object/${encodeURIComponent(config.SUPABASE_STORAGE_BUCKET)}/${path}`, {
    ...init, headers, redirect: "error", signal: AbortSignal.timeout(20000),
  });
}
