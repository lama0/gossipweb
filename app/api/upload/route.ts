import { env } from "cloudflare:workers";
import { storageRequest } from "../_storage";
import { sessionProfile } from "../auth/_auth";

export async function POST(request: Request) {
  const profile = await sessionProfile(request);
  const userId = profile?.id;
  if (!userId) return Response.json({ error: "Sign in before uploading." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)) return Response.json({ error: "Choose an image file." }, { status: 400 });
  if (file.size > 6_000_000) return Response.json({ error: "Image must be smaller than 6 MB." }, { status: 400 });
  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const purpose=form.get("purpose");
  const key = `${purpose==="avatar"?"avatars":"newsletter"}/${userId}/${crypto.randomUUID()}.${ext}`;
  try {
    const result = await storageRequest(key, {
      method: "POST", body: await file.arrayBuffer(),
      headers: { "content-type": file.type, "x-upsert": "false" },
    });
    if (!result.ok) return Response.json({ error: "Image could not be saved. Please try again." }, { status: 502 });
  } catch {
    return Response.json({ error: "Image storage is unavailable. Please try again." }, { status: 503 });
  }
  if(purpose==="avatar")await env.DB.prepare("UPDATE profiles SET avatar_key=? WHERE id=?").bind(key,userId).run();
  return Response.json({ key });
}
