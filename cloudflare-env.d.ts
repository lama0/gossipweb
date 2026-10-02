declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SUPABASE_URL: string;
    SUPABASE_STORAGE_BUCKET: string;
    SUPABASE_SECRET_KEY: string;
  }
}
