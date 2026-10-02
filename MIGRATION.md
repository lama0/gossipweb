# The Queens: Cloudflare deployment

Build: `pnpm run build`
Deploy: `pnpm exec wrangler deploy --config dist/server/wrangler.json`

The Worker is named thequeens28 and uses D1 binding DB (thequeens-db).
Images use the private Supabase Storage bucket class-media. No R2 subscription is required.
Set SUPABASE_SECRET_KEY as an encrypted production Worker secret in Cloudflare; never commit it.
SUPABASE_URL and SUPABASE_STORAGE_BUCKET are public configuration included in vite.config.ts.
Image uploads and downloads require an application session; the secret stays on the server.

The new database schema was created through the D1 Console using the combined existing migrations.
Do not reapply the initial migrations to that database. Production accounts, content, and media still need to be copied from the original Site before switching users to this deployment.
Application accounts and sessions remain in D1; Supabase is used only for image storage.
