"use client";
import {useState} from "react";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
const emojiGroups=[
 ["Faces","😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😔 😢 😭 😤 😠 🤯 😳 🥺 🥹 😱 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🫠 😴 🥱"],
 ["Hearts","❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💔 ❤️‍🔥 ❤️‍🩹 💕 💞 💓 💗 💖 💘 💝 💟 ✨ ⭐ 🌟 💫 🎀 👑 💎 🌸 🌷 🌹 🪻 🦋"],
 ["Gestures","👍 👎 👏 🙌 🫶 🤝 ✌️ 🤞 🤟 🤘 👌 🤌 🤏 🫰 🙏 💪 👀 🧠 💅 💃 🕺"],
 ["More","🔥 💯 ✅ ❌ 🎉 🎊 🎁 🎂 🍰 ☕ 🍵 🍓 🍒 🍉 🍋 🍕 🍿 🐱 🐶 🐻 🐼 🐰 🦊 🐸 🐥 🌙 ☀️ 🌈 🌧️ ❄️ 🍂 🍁 🌻 🎵 🎶 📚 📝 🎓 🏆 🥇"]
];
export function EmojiPicker({onPick}:{onPick:(emoji:string)=>void}){
 const[open,setOpen]=useState(false),[custom,setCustom]=useState("");
 function choose(value:string){if(!value.trim())return;onPick(value.trim());setOpen(false);setCustom("")}
 return <><button className="add-reaction" aria-label="Choose any emoji reaction" onClick={()=>setOpen(true)}>+ React</button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="emoji-dialog"><DialogHeader><DialogTitle>Choose a reaction</DialogTitle></DialogHeader><p>Use the emoji keyboard on your device to choose any emoji.</p><form className="emoji-custom" onSubmit={e=>{e.preventDefault();choose(custom)}}><Input value={custom} maxLength={32} onChange={e=>setCustom(e.target.value)} placeholder="Paste any emoji here…"/><Button disabled={!custom.trim()}>React</Button></form>{emojiGroups.map(([name,list])=><div key={name}><h3>{name}</h3><div className="emoji-grid">{list.split(" ").map(emoji=><button key={emoji} onClick={()=>choose(emoji)}>{emoji}</button>)}</div></div>)}</DialogContent></Dialog></>
}
export function AvatarEditor({avatarKey,onSaved}:{avatarKey?:string;onSaved:(key:string)=>void}){
 const[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function upload(file:File){setBusy(true);setError("");try{
  if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type))throw new Error("Choose a JPG, PNG, WebP or GIF image.");
  const bitmap=await createImageBitmap(file),canvas=document.createElement("canvas");const ratio=Math.min(1,512/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext("2d")!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not read image.")),"image/webp",.85));
  const form=new FormData();form.append("purpose","avatar");form.append("file",blob,"avatar.webp");const r=await fetch("/api/upload",{method:"POST",body:form});const d=await r.json() as {key:string;error?:string};if(!r.ok)throw new Error(d.error||"Upload failed.");onSaved(d.key);
 }catch(e){setError(e instanceof Error?e.message:"Could not upload.")}finally{setBusy(false)}}
 return <div className="avatar-editor">{avatarKey&&<img src={"/api/media/"+avatarKey} alt="Your profile picture"/>}<label className="avatar-upload">{busy?"Uploading…":"Change profile picture"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={e=>{if(e.target.files?.[0])upload(e.target.files[0])}}/></label>{error&&<p role="alert">{error}</p>}</div>
}
