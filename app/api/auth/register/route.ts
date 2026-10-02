import { env } from "cloudflare:workers";
import { ADMIN_EMAIL, ensureAuthSchema, hashPassword, newSession } from "../_auth";

const names = new Set(["rose sh","samar","wed","rose dos","rana","leen","lubna","nora","taleen","ghina","haneen","aljazy","jana","lama","jumana","fatima","noran","sara","hessa","aljoharah","alkawthar","zahraa","zainab","aqilah"]);
export async function POST(request: Request) {
  try {
    await ensureAuthSchema();
    const data = await request.json() as Record<string, unknown>;
    const email=String(data.email??"").trim().toLowerCase(), password=String(data.password??""), realName=String(data.realName??"").trim().toLowerCase(), nickname=String(data.nickname??"").trim().slice(0,24);
    if(!/^\S+@\S+\.\S+$/.test(email)) return Response.json({error:"Enter a valid email."},{status:400});
    if(password.length<8) return Response.json({error:"Password must be at least 8 characters."},{status:400});
    if(!names.has(realName)||nickname.length<2||data.agreed!==true) return Response.json({error:"Complete your name, nickname, and all three promises."},{status:400});
    if(await env.DB.prepare("SELECT 1 FROM accounts WHERE email=?").bind(email).first()) return Response.json({error:"This email already has an account. Sign in instead."},{status:409});
    const {hash,salt}=await hashPassword(password); const now=Date.now();
    const old=await env.DB.prepare("SELECT profiles.*, accounts.id linked_account FROM profiles LEFT JOIN accounts ON accounts.profile_id=profiles.id WHERE profiles.nickname=?").bind(nickname).first<Record<string,unknown>>();
    if(old?.linked_account) return Response.json({error:"That nickname is already taken."},{status:409});
    if(old&&String(old.real_name).toLowerCase()!==realName) return Response.json({error:"That nickname belongs to another class member."},{status:409});
    let profileId:number;
    if(old){profileId=Number(old.id);await env.DB.prepare("UPDATE profiles SET is_admin=? WHERE id=?").bind(email===ADMIN_EMAIL?1:0,profileId).run()}
    else{const result=await env.DB.prepare("INSERT INTO profiles (platform_id,real_name,nickname,is_admin,created_at) VALUES (?,?,?,?,?)").bind(`account:${crypto.randomUUID()}`,realName,nickname,email===ADMIN_EMAIL?1:0,now).run();profileId=Number(result.meta.last_row_id)}
    const account=await env.DB.prepare("INSERT INTO accounts (profile_id,email,password_hash,password_salt,created_at) VALUES (?,?,?,?,?)").bind(profileId,email,hash,salt,now).run();
    const session=await newSession(Number(account.meta.last_row_id));
    return Response.json({profile:{realName,nickname,email}},{status:201,headers:{"Set-Cookie":session.cookie}});
  } catch(e) { console.error("register failed", e); const msg=String(e); return Response.json({error:msg.includes("UNIQUE")?"That name or email is already in use.":"Account setup failed. Please try again."},{status:500}); }
}
