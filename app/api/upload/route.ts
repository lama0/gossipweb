import { env } from "cloudflare:workers";
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
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  if(purpose==="avatar")await env.DB.prepare("UPDATE profiles SET avatar_key=? WHERE id=?").bind(key,userId).run();
  return Response.json({ key });
}
