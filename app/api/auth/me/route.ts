import { sessionProfile } from "../_auth";
export async function GET(request:Request){const p=await sessionProfile(request);if(!p)return Response.json({authenticated:false},{status:401});return Response.json({authenticated:true,profile:{id:Number(p.id),avatarKey:String(p.avatar_key||""),realName:p.real_name,nickname:p.nickname,email:p.email,isAdmin:Boolean(p.is_admin)}})}
