import { clearCookie, deleteSession } from "../_auth";
export async function POST(request:Request){await deleteSession(request);return Response.json({ok:true},{headers:{"Set-Cookie":clearCookie}})}
