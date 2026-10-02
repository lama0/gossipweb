import { env } from "cloudflare:workers";
import { sessionProfile } from "../auth/_auth";

async function requireProfile(request: Request) { const profile = await sessionProfile(request); if (!profile) throw new Error("AUTH_REQUIRED"); return profile; }
function weekKey() { const d = new Date(); const day = d.getUTCDay(); const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((day + 6) % 7))); return monday.toISOString().slice(0, 10); }

export async function GET(request: Request) {
  try {
    const profile = await sessionProfile(request);
    if (!profile) return Response.json({ error: "Sign in required." }, { status: 401 });
    const [polls, options, votes, events, songs, news, comments, candidates, bestieVotes, settings] = await Promise.all([
      env.DB.prepare("SELECT polls.*, profiles.nickname creator FROM polls JOIN profiles ON profiles.id = polls.creator_id ORDER BY polls.id DESC LIMIT 20").all(),
      env.DB.prepare("SELECT poll_options.*, COUNT(poll_votes.id) votes FROM poll_options LEFT JOIN poll_votes ON poll_votes.option_id = poll_options.id GROUP BY poll_options.id").all(),
      env.DB.prepare("SELECT poll_id, option_id FROM poll_votes WHERE voter_id = ?").bind(profile.id).all(),
      env.DB.prepare("SELECT calendar_events.*, profiles.nickname creator FROM calendar_events JOIN profiles ON profiles.id = calendar_events.creator_id ORDER BY event_date LIMIT 60").all(),
      env.DB.prepare("SELECT song_suggestions.*, profiles.nickname creator FROM song_suggestions JOIN profiles ON profiles.id = song_suggestions.creator_id ORDER BY id DESC LIMIT 30").all(),
      env.DB.prepare("SELECT * FROM newsletter ORDER BY id DESC LIMIT 30").all(),
      env.DB.prepare("SELECT drama_comments.*, profiles.nickname author FROM drama_comments JOIN profiles ON profiles.id = drama_comments.author_id ORDER BY id DESC LIMIT 80").all(),
      env.DB.prepare("SELECT bestie_candidates.*, COUNT(bestie_votes.id) votes FROM bestie_candidates LEFT JOIN bestie_votes ON bestie_votes.candidate_id = bestie_candidates.id AND bestie_votes.week_key = ? GROUP BY bestie_candidates.id ORDER BY position").bind(weekKey()).all(),
      env.DB.prepare("SELECT candidate_id FROM bestie_votes WHERE voter_id = ? AND week_key = ?").bind(profile.id, weekKey()).first(),
      env.DB.prepare("SELECT key, value FROM site_settings").all(),
    ]);
    return Response.json({ profile, polls: polls.results, options: options.results, myPollVotes: votes.results, events: events.results, songs: songs.results, news: news.results, comments: comments.results, candidates: candidates.results, myBestieVote: bestieVotes, settings: Object.fromEntries((settings.results as {key:string,value:string}[]).map(x => [x.key,x.value])), weekKey: weekKey() });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Unavailable" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>; const action = String(data.action ?? "");
    const profile = await requireProfile(request); const uid = Number(profile.id); const admin = Boolean(profile.is_admin);
    if (action === "delete_poll" || action === "delete_event") {
      const table=action==="delete_poll"?"polls":"calendar_events",id=Number(data.id);
      const row=await env.DB.prepare(`SELECT creator_id FROM ${table} WHERE id=?`).bind(id).first<{creator_id:number}>();
      if(!row)return Response.json({ok:true});
      if(!admin&&Number(row.creator_id)!==uid)return Response.json({error:"Only the creator or admin can delete this."},{status:403});
      if(action==="delete_poll")await env.DB.batch([env.DB.prepare("DELETE FROM poll_votes WHERE poll_id=?").bind(id),env.DB.prepare("DELETE FROM poll_options WHERE poll_id=?").bind(id),env.DB.prepare("DELETE FROM polls WHERE id=?").bind(id)]);
      else await env.DB.prepare("DELETE FROM calendar_events WHERE id=?").bind(id).run();
      return Response.json({ok:true});
    }
    if (action === "create_poll") {
      const question = String(data.question ?? "").trim().slice(0, 180); const options = (Array.isArray(data.options) ? data.options : []).map(String).map(x=>x.trim().slice(0,80)).filter(Boolean);
      if (!question || options.length < 2 || options.length > 6) return Response.json({ error: "Add a question and 2–6 choices." }, { status: 400 });
      const result = await env.DB.prepare("INSERT INTO polls (question, creator_id, created_at) VALUES (?, ?, ?)").bind(question, uid, Date.now()).run(); const pollId = result.meta.last_row_id;
      await env.DB.batch(options.map(label => env.DB.prepare("INSERT INTO poll_options (poll_id, label) VALUES (?, ?)").bind(pollId, label))); return Response.json({ ok:true });
    }
    if (action === "vote_poll") {
      const pollId=Number(data.pollId),optionId=Number(data.optionId);
      const poll=await env.DB.prepare("SELECT created_at FROM polls WHERE id=?").bind(pollId).first<{created_at:number}>();
      if(!poll)return Response.json({error:"Poll not found."},{status:404});
      if(Date.now()>=Number(poll.created_at)+3*86400000)return Response.json({error:"This poll closed after three days."},{status:400});
      const option=await env.DB.prepare("SELECT id FROM poll_options WHERE id=? AND poll_id=?").bind(optionId,pollId).first();
      if(!option)return Response.json({error:"Choose an option from this poll."},{status:400});
      await env.DB.prepare("INSERT INTO poll_votes (poll_id,option_id,voter_id) VALUES (?,?,?) ON CONFLICT(poll_id,voter_id) DO UPDATE SET option_id=excluded.option_id").bind(pollId,optionId,uid).run();
      return Response.json({ok:true});
    }
    if (action === "add_event") {
      const title=String(data.title??"").trim().slice(0,120),date=String(data.eventDate??""),endDate=String(data.endDate??date);
      const time=String(data.eventTime??""),endTime=String(data.endTime??""),allDay=data.allDay?1:0;
      const category=String(data.category??"Event"),color=String(data.color??"pink"),reminder=String(data.reminder??"none");
      if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||endDate<date||!["Event","Task","Birthday"].includes(category)||!["pink","gold","blue","green","purple"].includes(color)||!["none","10 minutes","30 minutes","1 hour","1 day"].includes(reminder)||(!allDay&&!/^\d{2}:\d{2}$/.test(time))||(!allDay&&endDate===date&&endTime&&endTime<=time))return Response.json({error:"Check the event details and dates."},{status:400});
      await env.DB.prepare("INSERT INTO calendar_events (title,event_date,event_time,end_date,end_time,category,all_day,location,reminder,color,details,creator_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(title,date,allDay?"":time,endDate,allDay?"":endTime.slice(0,5),category,allDay,String(data.location??"").trim().slice(0,120),reminder,color,String(data.details??"").trim().slice(0,500),uid,Date.now()).run();
      return Response.json({ok:true});
    }
    if (action === "suggest_song") { await env.DB.prepare("INSERT INTO song_suggestions (title,artist,creator_id,created_at) VALUES (?,?,?,?)").bind(String(data.title).slice(0,100), String(data.artist).slice(0,100), uid, Date.now()).run(); return Response.json({ok:true}); }
    if (action === "comment_drama") { await env.DB.prepare("INSERT INTO drama_comments (newsletter_id,author_id,body,created_at) VALUES (?,?,?,?)").bind(data.newsletterId, uid, String(data.body).slice(0,500), Date.now()).run(); return Response.json({ok:true}); }
    if (action === "vote_bestie") { await env.DB.batch([env.DB.prepare("DELETE FROM bestie_votes WHERE week_key=? AND voter_id=?").bind(weekKey(),uid),env.DB.prepare("INSERT INTO bestie_votes (week_key,candidate_id,voter_id) VALUES (?,?,?)").bind(weekKey(),data.candidateId,uid)]); return Response.json({ok:true}); }
    if (!admin) return Response.json({ error:"Admin only." }, { status:403 });
    if (action === "publish_news") { await env.DB.prepare("INSERT INTO newsletter (category,title,body,image_key,created_at) VALUES (?,?,?,?,?)").bind(String(data.category),String(data.title).slice(0,140),String(data.body).slice(0,5000),String(data.imageKey??data.imageUrl??"").slice(0,1000)||null,Date.now()).run(); return Response.json({ok:true}); }
    if (action === "set_besties") { const names = (Array.isArray(data.names)?data.names:[]).map(String).slice(0,3); await env.DB.batch([1,2,3].map((p,i)=>env.DB.prepare("INSERT OR REPLACE INTO bestie_candidates (id,name,position) VALUES ((SELECT id FROM bestie_candidates WHERE position=?),?,?)").bind(p,names[i]||`Bestie ${p}`,p))); return Response.json({ok:true}); }
    if (action === "set_song") { await env.DB.batch([env.DB.prepare("INSERT OR REPLACE INTO site_settings (key,value) VALUES ('song_title',?)").bind(String(data.title).slice(0,100)),env.DB.prepare("INSERT OR REPLACE INTO site_settings (key,value) VALUES ('song_artist',?)").bind(String(data.artist).slice(0,100))]); return Response.json({ok:true}); }
    return Response.json({error:"Unknown action"},{status:400});
  } catch (e) { const message=e instanceof Error?e.message:"Could not save."; return Response.json({ error: message }, { status: message==="AUTH_REQUIRED"?401:500 }); }
}
