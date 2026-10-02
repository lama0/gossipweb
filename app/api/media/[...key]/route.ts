import { sessionProfile } from "../../auth/_auth";
import { storageRequest } from "../../_storage";

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!await sessionProfile(request)) return new Response("Sign in to view images.", { status: 401 });
  const { key } = await params;
  if (key.length !== 3 || !["avatars", "newsletter"].includes(key[0]) || key.some(part => !/^[a-zA-Z0-9._-]+$/.test(part) || part === "." || part === "..")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const object = await storageRequest(key.join("/"));
    if (object.status === 404) return new Response("Not found", { status: 404 });
    if (!object.ok) return new Response("Image unavailable", { status: 502 });
    const type = object.headers.get("content-type") || "application/octet-stream";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type.split(";")[0])) return new Response("Invalid image", { status: 415 });
    return new Response(object.body, { headers: {
      "content-type": type, "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff", "vary": "Cookie",
    } });
  } catch {
    return new Response("Image unavailable", { status: 503 });
  }
}
