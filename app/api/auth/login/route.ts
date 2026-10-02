import { env } from "cloudflare:workers";
import { ADMIN_EMAIL, ensureAuthSchema, newSession, verifyPassword } from "../_auth";
export async function POST(request: Request){
 try{await ensureAuthSchema();const d=await request.json() as Record<string,unknown>,email=String(d.email??"").trim().toLowerCase(),password=String(d.password??"");const a=await env.DB.prepare("SELECT * FROM accounts WHERE email=?").bind(email).first<Record<string,unknown>>();if(!a||!await verifyPassword(password,String(a.password_salt),String(a.password_hash)))return Response.json({error:"Email or password is incorrect."},{status:401});await env.DB.prepare("UPDATE profiles SET is_admin=? WHERE id=?").bind(email===ADMIN_EMAIL?1:0,a.profile_id).run();const s=await newSession(Number(a.id));return Response.json({ok:true},{headers:{"Set-Cookie":s.cookie}})}catch(e){console.error("login failed",e);return Response.json({error:"Could not sign in."},{status:500})}
}
