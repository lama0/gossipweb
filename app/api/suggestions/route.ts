import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { suggestions } from "../../../db/schema";
import { sessionProfile } from "../auth/_auth";

export async function GET() {
  try { return Response.json({ suggestions: await getDb().select().from(suggestions).orderBy(desc(suggestions.createdAt)).limit(50) }); }
  catch { return Response.json({ error: "Suggestions are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const profile=await sessionProfile(request);if(!profile)return Response.json({error:"Sign in required."},{status:401});
    const data = await request.json() as { body?: string };
    const realName = String(profile.real_name).trim().slice(0, 30); const nickname = String(profile.nickname).trim().slice(0, 24); const body = (data.body ?? "").trim().slice(0, 500);
    if (!realName || !nickname || body.length < 3) return Response.json({ error: "Write a little more before sending." }, { status: 400 });
    const [suggestion] = await getDb().insert(suggestions).values({ realName, nickname, body, createdAt: new Date() }).returning();
    return Response.json({ suggestion }, { status: 201 });
  } catch { return Response.json({ error: "Could not send your suggestion." }, { status: 500 }); }
}
