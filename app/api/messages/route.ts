import { env } from "cloudflare:workers";
import { sessionProfile } from "../auth/_auth";

const names = new Set(["rose sh", "samar", "wed", "rose dos", "rana", "leen", "lubna", "nora", "taleen", "ghina", "haneen", "aljazy", "jana", "lama", "jumana", "fatima", "noran", "sara", "hessa", "aljoharah", "alkawthar", "zahraa", "zainab", "aqilah"]);
const banned = ["67", "six seven", "fuck", "bitch", "bitchy", "shit", "shitty", "cunt", "whore", "ass", "hoe", "كلي زق", "كلي زقين", "كل زق", "كل زقين", "كلبه", "ملعونه", "خايسه", "اكرهك", "بضربك", "قبيحه", "قحبه", "حماره", "مياو", "كلب", "قدرات", "تحصيلي", "بترول", "جامعه", "قياس", "سديد", "مبكر", "المبكر", "النسبه", "مس ساره", "مس سارا", "الاداره", "استاذه ساره", "استاذه سارا", "انسه ساره", "انسه سارا", "دبه", "نحيفه", "نحيف", "دب", "pussy", "fat", "fatty", "صلعه", "ام اربع عيون", "نيرد", "nerd"];
const reactionKinds = new Set(["love", "agree", "seen"]);

function clean(value: string) { return value.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim(); }
function hasBannedWord(value: string) { const normalized=clean(value);return banned.some(term=>{const t=clean(term);if(/^[a-z\d ]+$/.test(t))return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(normalized);return normalized.includes(t)}) }
export async function GET(request:Request){
  try{const profile=await sessionProfile(request);if(!profile)return Response.json({error:"Sign in required."},{status:401});
    const rows=await env.DB.prepare("SELECT messages.*,profiles.avatar_key FROM messages LEFT JOIN profiles ON profiles.id=messages.author_id ORDER BY messages.created_at DESC, messages.id DESC LIMIT 160").all<Record<string,unknown>>();
    const reacts=await env.DB.prepare("SELECT message_id,kind,COUNT(*) count,MAX(CASE WHEN profile_id=? THEN 1 ELSE 0 END) mine FROM message_reactions WHERE message_id IN (SELECT id FROM messages ORDER BY id DESC LIMIT 160) GROUP BY message_id,kind").bind(profile.id).all<Record<string,unknown>>();
    const grouped=new Map<number,Record<string,unknown>[]>();for(const r of reacts.results){const id=Number(r.message_id),list=grouped.get(id)||[];list.push(r);grouped.set(id,list)}
    return Response.json({messages:rows.results.reverse().map(m=>({...m,realName:m.real_name,nickname:m.nickname,createdAt:m.created_at,authorId:m.author_id,channel:m.channel||"class",avatarKey:m.avatar_key,reactions:grouped.get(Number(m.id))||[]}))});
  }catch{return Response.json({error:"Chat is temporarily unavailable."},{status:503})}
}

export async function POST(request:Request){
  try{const profile=await sessionProfile(request);if(!profile)return Response.json({error:"Sign in required."},{status:401});const data=await request.json() as {body?:string;channel?:string};
    const realName=clean(String(profile.real_name)),nickname=String(profile.nickname).trim().slice(0,24),body=String(data.body||"").trim().slice(0,500),channel=data.channel==="admin"?"admin":"class";
    if(channel==="admin"&&!profile.is_admin)return Response.json({error:"Only the admin can post here."},{status:403});
    if(!names.has(realName)||nickname.length<2||!body)return Response.json({error:"Please check your profile and message."},{status:400});if(hasBannedWord(body))return Response.json({error:"That message includes a banned word and was not posted."},{status:400});
    await env.DB.prepare("INSERT INTO messages (real_name,nickname,body,created_at,author_id,channel) VALUES (?,?,?,?,?,?)").bind(realName,nickname,body,Date.now(),profile.id,channel).run();return Response.json({ok:true},{status:201});
  }catch{return Response.json({error:"Could not post your message. Try again."},{status:500})}
}

export async function PATCH(request:Request){
  try{const profile=await sessionProfile(request);if(!profile)return Response.json({error:"Sign in required."},{status:401});const data=await request.json() as {messageId?:number;kind?:string};const messageId=Number(data.messageId),kind=String(data.kind||"");if(!messageId||!(reactionKinds.has(kind)||(/\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\ufe0f?\u20e3/u.test(kind)&&/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\u200d|\ufe0f|[0-9#*]|\u20e3)+$/u.test(kind)&&kind.length<=32)))return Response.json({error:"Invalid reaction."},{status:400});
    const existing=await env.DB.prepare("SELECT id FROM message_reactions WHERE message_id=? AND profile_id=? AND kind=?").bind(messageId,profile.id,kind).first();if(existing)await env.DB.prepare("DELETE FROM message_reactions WHERE id=?").bind(existing.id).run();else await env.DB.prepare("INSERT INTO message_reactions (message_id,profile_id,kind,created_at) VALUES (?,?,?,?)").bind(messageId,profile.id,kind,Date.now()).run();return Response.json({ok:true});
  }catch{return Response.json({error:"Could not save reaction."},{status:500})}
}

export async function DELETE(request:Request){
  try{const profile=await sessionProfile(request);if(!profile)return Response.json({error:"Sign in required."},{status:401});const id=Number(new URL(request.url).searchParams.get("id"));const message=await env.DB.prepare("SELECT author_id FROM messages WHERE id=?").bind(id).first<Record<string,unknown>>();if(!message)return Response.json({ok:true});if(Number(message.author_id)!==Number(profile.id)&&!profile.is_admin)return Response.json({error:"You can only delete your own messages."},{status:403});await env.DB.batch([env.DB.prepare("DELETE FROM message_reactions WHERE message_id=?").bind(id),env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id)]);return Response.json({ok:true});
  }catch{return Response.json({error:"Could not delete message."},{status:500})}
}
