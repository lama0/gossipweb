import { env } from "cloudflare:workers";

export const COOKIE = "gg_session";
export const ADMIN_EMAIL = "lamaghamdi85@gmail.com";
const DAYS_30 = 60 * 60 * 24 * 30;
const enc = new TextEncoder();

export async function ensureAuthSchema() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, profile_id INTEGER NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY NOT NULL, account_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS sessions_account_id_idx ON sessions(account_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)`),
  ]);
}

function hex(bytes: Uint8Array) { return [...bytes].map(b => b.toString(16).padStart(2, "0")).join(""); }
function unhex(value: string) { return new Uint8Array(value.match(/.{1,2}/g)?.map(x => parseInt(x, 16)) ?? []); }
async function sha(value: string) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)))); }
function randomHex(size: number) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return hex(bytes); }

export async function hashPassword(password: string, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(salt), iterations: 100000 }, key, 256);
  return { hash: hex(new Uint8Array(bits)), salt };
}
export async function verifyPassword(password: string, salt: string, expected: string) {
  const { hash } = await hashPassword(password, salt); let diff = hash.length ^ expected.length;
  for (let i = 0; i < Math.min(hash.length, expected.length); i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export function cookieValue(request: Request) {
  const pair = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(COOKIE.length + 1)) : "";
}
export async function sessionProfile(request: Request) {

  const token = cookieValue(request); if (!token) return null;
  const profile = await env.DB.prepare(`SELECT profiles.*, accounts.id account_id, accounts.email
    FROM sessions JOIN accounts ON accounts.id=sessions.account_id JOIN profiles ON profiles.id=accounts.profile_id
    WHERE sessions.token_hash=? AND sessions.expires_at>?`).bind(await sha(token), Date.now()).first<Record<string, unknown>>();
  if (!profile) return null;
  profile.is_admin = String(profile.email).toLowerCase() === ADMIN_EMAIL ? 1 : 0;
  return profile;
}
export async function newSession(accountId: number) {

  const token = randomHex(32), now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash,account_id,expires_at,created_at) VALUES (?,?,?,?)")
    .bind(await sha(token), accountId, now + DAYS_30 * 1000, now).run();
  return { token, cookie: `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DAYS_30}` };
}
export async function deleteSession(request: Request) { const token = cookieValue(request); if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha(token)).run(); }
export const clearCookie = `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
