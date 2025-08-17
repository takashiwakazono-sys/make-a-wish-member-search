import React, { useEffect, useMemo, useRef, useState } from "react";

const ADMIN_EMAIL = "waka_zono@yahoo.co.jp";

const zenkakuToHankaku = (str) => str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
const kataToHira = (str) => str.replace(/[ァ-ン]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60));
const normalize = (s) => kataToHira(zenkakuToHankaku((s||"").toLowerCase())).trim();
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date();
const toISODateTimeLocal = (d) => {
  const pad = (n) => n.toString().padStart(2, '0');
  const y = d.getFullYear(); const m = pad(d.getMonth()+1); const dd = pad(d.getDate());
  const hh = pad(d.getHours()); const mm = pad(d.getMinutes());
  return `${y}-${m}-${dd}T${hh}:${mm}`;
};

const demoProfiles = [
  {
    id: uid(), owner: "demo@site", isPublic: true,
    displayName: "斎藤 あかね", fullName: "斎藤 あかね",
    headline: "整体 × 栄養アドバイス",
    bio: "カラダのコリ・疲れが取れない方に、整体と日常のセルフケアを提案します。",
    business: "整体院運営 / オンライン姿勢診断",
    problems: "慢性的な疲労、肩こり、在宅ワークの不調",
    other: "初回体験あり（30分）",
    contact: { line: "akane_bodycare", sns: "https://x.com/akane_fit", email: "hello@akane.jp" },
    images: [],
    events: [
      { id: uid(), title: "姿勢リセット体験会", desc: "セルフケアの基本を学ぶ60分。", date: new Date(Date.now()+1000*60*60*24*3).toISOString(), location: "名古屋・オンライン", link: "https://example.com/posture", image: "" }
    ],
    createdAt: Date.now() - 1000*60*60*24*3,
  },
  {
    id: uid(), owner: "demo@site", isPublic: true,
    displayName: "KENJI", fullName: "山本 健司",
    headline: "パーソナルトレーナー（ダイエット特化）",
    bio: "食事×筋トレで楽しく継続。無理なく-5kgを3ヶ月で。",
    business: "出張トレーニング / オンライン指導",
    problems: "ダイエット、姿勢改善、運動習慣の定着",
    other: "栄駅周辺での対面OK",
    contact: { line: "pt_kenji", sns: "https://instagram.com/pt.kenji", email: "contact@kenjifit.jp" },
    images: [],
    events: [
      { id: uid(), title: "朝活ダイエット講座", desc: "朝に整える習慣作り。", date: new Date(Date.now()+1000*60*60*24*7).toISOString(), location: "栄・カフェスペース", link: "https://example.com/morning", image: "" }
    ],
    createdAt: Date.now() - 1000*60*60*24*10,
  },
  {
    id: uid(), owner: "demo@site", isPublic: true,
    displayName: "若見えLABO", fullName: "若見えLABO",
    headline: "エステ×肌診断 AIで若くいたいを叶える",
    bio: "AI肌診断で最適なホームケアを設計します。",
    business: "フェイシャル/コスメ提案/オンライン相談",
    problems: "若くいたい、ほうれい線、たるみ",
    other: "オンライン相談30分無料",
    contact: { line: "wakamise", sns: "https://example.com/wakamise", email: "info@wakamise.jp" },
    images: [],
    events: [
      { id: uid(), title: "AI肌診断デモ体験", desc: "AIで肌状態をチェック。", date: new Date(Date.now()+1000*60*60*24*14).toISOString(), location: "オンライン", link: "https://example.com/skinai", image: "" }
    ],
    createdAt: Date.now() - 1000*60*60*24*30,
  },
  { id: uid(), owner: "demo@site", isPublic: true, displayName: "YOJI", fullName: "YOJI", headline: "自分夢作成プロデューサー", bio: "“100夢リスト”の作り方をお伝えします。", business: "ワークショップ / コーチング", problems: "やりたいことが言語化できない、行動に移せない", other: "初心者歓迎", contact: { line: "yoji_makeawish", sns: "", email: "yoji@example.com" }, images: [], events: [], createdAt: Date.now() - 1000*60*60*24*1 },
  { id: uid(), owner: "demo@site", isPublic: true, displayName: "はるか（食と睡眠）", fullName: "田中 はるか", headline: "管理栄養士 × 睡眠カウンセラー", bio: "“疲れが取れない”に寄り添い、食事と睡眠の両輪で整える方法を提案します。", business: "オンライン栄養相談 / 睡眠プログラム", problems: "眠りの質が悪い、朝がだるい", other: "30分の無料相談あり", contact: { line: "haruka_sleep", sns: "", email: "hello@haruka.jp" }, images: [], events: [], createdAt: Date.now() - 1000*60*60*24*6 },
];

const STORAGE_KEY = "member_matching_profiles_v2";
const AUTH_KEY = "member_matching_current_user_v2";
function loadProfiles(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProfiles)); return demoProfiles; } try{ const data = JSON.parse(raw); return (Array.isArray(data)?data:demoProfiles).map(p=>({ other:"", events:[], ...p, other: typeof p.other==='string'? p.other:"", events: Array.isArray(p.events)? p.events.map(e=>({desc:"",link:"",image:"",...e})):[] })); }catch{ return demoProfiles; } }
function saveProfiles(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function loadAuth(){ return localStorage.getItem(AUTH_KEY)||""; }
function saveAuth(email){ if(email) localStorage.setItem(AUTH_KEY,email); else localStorage.removeItem(AUTH_KEY); }

const USERS_KEY = "member_matching_users_v1";
function loadUsers(){ try{ const raw = localStorage.getItem(USERS_KEY); const base = raw? JSON.parse(raw): {}; if(!base[ADMIN_EMAIL]) base[ADMIN_EMAIL] = { password: 'admin' }; localStorage.setItem(USERS_KEY, JSON.stringify(base)); return base; } catch{ const seed = { [ADMIN_EMAIL]: { password: 'admin' } }; localStorage.setItem(USERS_KEY, JSON.stringify(seed)); return seed; } }
function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }

const Input = (props)=>(<input {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />);
const Textarea = (props)=>(<textarea {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />);
const Button = ({children,className="",...rest})=>(<button {...rest} className={`rounded-2xl px-4 py-2 shadow-sm border hover:shadow transition ${className}`}>{children}</button>);
const Chip = ({text})=>(<span className="text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 mr-1 mb-1 inline-block">{text}</span>);

function useProfiles(){ const [profiles,setProfiles]=useState(()=>loadProfiles()); useEffect(()=>{ saveProfiles(profiles); },[profiles]); return {profiles,setProfiles}; }
const emptyProfile = (owner)=>({ id:uid(), owner, isPublic:true, displayName:"", fullName:"", headline:"", bio:"", business:"", problems:"", other:"", contact:{line:"",sns:"",email:""}, images:[], events:[], createdAt:Date.now() });
function SearchSection({ list, onOpen }){
  const [q, setQ] = useState("");
  const filtered = useMemo(()=>{
    const base = list.filter(p=> p.isPublic);
    if (!q) return base;
    const nq = normalize(q);
    return base.filter(p=>{
      const hay = normalize(`${p.displayName} ${p.headline} ${p.bio} ${p.business} ${p.problems} ${p.other}`);
      return nq.split(/\s+/).every(t=> hay.includes(t));
    });
  }, [q, list]);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">メンバー検索</h2>
      <div className="mb-4">
        <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="入力しながら絞り込み（例：若くいたい / ダイエット / 肩こり）" />
        <div className="text-xs text-gray-500 mt-1">{filtered.length}件ヒット</div>
      </div>
      <Directory items={filtered} onOpen={onOpen} />
    </div>
  );
}

function ProfileCard({ p, onOpen }) {
  const tags = useMemo(()=>{
    const s = `${p.headline} ${p.bio} ${p.business} ${p.problems} ${p.other}`;
    return Array.from(new Set(normalize(s).split(/[^a-z0-9ぁ-ん一-龥]+/).filter(w=>w.length>=2))).slice(0,6);
  }, [p]);
  const img = p.images?.[0];
  const nextEvent = (p.events||[]).map(e=>({ ...e, dt: new Date(e.date)})).filter(e=> e.dt >= today()).sort((a,b)=> a.dt - b.dt)[0];
  return (
    <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden flex-none">
          {img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold truncate">{p.displayName || "（未設定）"}</div>
          <div className="text-sm text-gray-600 truncate">{p.headline}</div>
          <div className="mt-2 line-clamp-2 text-sm">{p.bio}</div>
        </div>
      </div>
      <div className="mt-3">{tags.map(t=> <Chip key={t} text={t} />)}</div>
      {nextEvent && (
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          近日イベント：<strong className="ml-1">{nextEvent.title}</strong>（{new Date(nextEvent.date).toLocaleString()} / {nextEvent.location}）
        </div>
      )}
      <div className="mt-4 flex justify-end"><Button onClick={()=>onOpen?.(p)} className="bg-rose-700 text-white">詳細</Button></div>
    </div>
  );
}

function Directory({ items, onOpen }){
  if (!items.length) return <div className="text-center text-gray-500 py-16">該当する会員が見つかりませんでした。</div>;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(p=> <ProfileCard key={p.id} p={p} onOpen={onOpen} />)}</div>;
}

function EventSpotlight({ profiles, onOpen }){
  const events = useMemo(()=>{
    const now = today();
    let list = [];
    for (const p of profiles) for (const e of (p.events||[])) {
      const dt = new Date(e.date); if (!isNaN(dt) && dt >= now) list.push({ ...e, dt, host: p });
    }
    return list.sort((a,b)=> a.dt - b.dt);
  }, [profiles]);
  const [idx, setIdx] = useState(0);
  useEffect(()=>{ if (!events.length) return; const t = setInterval(()=> setIdx(i=> (i+1)%events.length), 3000); return ()=> clearInterval(t);}, [events.length]);
  if (!events.length) return null;
  const ev = events[idx];
  return (
    <div className="relative border border-rose-100 bg-white/90 rounded-3xl p-6 shadow-md overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-rose-50 via-orange-50 to-amber-50 opacity-60"/>
      <div className="relative grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 min-w-0">
          <div className="text-xs text-rose-700">直近イベント</div>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1 break-words">{ev.title}</h2>
          <div className="text-gray-700 mt-2 line-clamp-3">{ev.desc}</div>
          <div className="mt-3 text-sm text-gray-600">{ev.dt.toLocaleString()} ・ {ev.location} ・ 主催：<button className="underline" onClick={()=>onOpen?.(ev.host)}>{ev.host.displayName}</button></div>
          {ev.link && <div className="mt-2 text-sm"><a className="underline" href={ev.link} target="_blank" rel="noreferrer">詳細リンク</a></div>}
          <div className="mt-4 flex gap-2"><Button onClick={()=>onOpen?.(ev.host)} className="bg-rose-700 text-white">主催者を見る</Button></div>
        </div>
        <div className="md:col-span-1 w-full max-h-56 rounded-2xl overflow-hidden bg-rose-50">
          {ev.image ? <img src={ev.image} alt={ev.title} className="w-full h-full object-cover"/> : <div className="w-full h-56 grid place-items-center text-rose-300">IMG</div>}
        </div>
      </div>
      <div className="absolute right-4 bottom-4 text-xs text-gray-500">{idx+1}/{events.length}</div>
    </div>
  );
}

function UpcomingEvents({ profiles }){
  const events = useMemo(()=>{
    const now = today();
    let list = [];
    for (const p of profiles) for (const e of (p.events||[])) {
      const dt = new Date(e.date); if (!isNaN(dt) && dt >= now) list.push({ ...e, dt, host: p });
    }
    return list.sort((a,b)=> a.dt - b.dt).slice(0, 9);
  }, [profiles]);
  if (!events.length) return null;
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">近日のイベント</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map(ev => (
          <div key={ev.id} className="border border-rose-100 bg-white/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 flex-none">{ev.image ? <img src={ev.image} alt={ev.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">IMG</div>}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{ev.title}</div>
                <div className="text-xs text-gray-600 truncate">{ev.dt.toLocaleString()}・{ev.location}</div>
                <div className="text-xs text-rose-700 mt-1 truncate">主催：{ev.host.displayName}</div>
                {ev.link && <div className="text-xs"><a className="underline" href={ev.link} target="_blank" rel="noreferrer">詳細リンク</a></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ p, onBack, onEdit, onRemove, canEdit }){
  const img = p.images?.[0];
  const upcoming = (p.events||[]).map(e=>({ ...e, dt: new Date(e.date)})).filter(e=> e.dt>=today()).sort((a,b)=> a.dt-b.dt);
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button onClick={onBack}>← 戻る</Button>
        {canEdit && <Button onClick={()=>onEdit?.(p)} className="bg-rose-700 text-white">編集</Button>}
        {canEdit && <Button onClick={()=> onRemove?.(p)} className="text-rose-700">削除</Button>}
      </div>
      <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
        <div className="flex gap-6">
          <div className="w-40 h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden flex-none">
            {img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold break-words">{p.displayName}</div>
            <div className="text-gray-600">{p.headline}</div>
            <div className="mt-4 whitespace-pre-wrap leading-relaxed">{p.bio}</div>
            <div className="mt-4"><div className="font-semibold mb-1">行っている事業</div><div className="text-sm whitespace-pre-wrap">{p.business}</div></div>
            <div className="mt-4"><div className="font-semibold mb-1">解決したい課題</div><div className="text-sm whitespace-pre-wrap">{p.problems}</div></div>
            {p.other && <div className="mt-4"><div className="font-semibold mb-1">その他（自由記述）</div><div className="text-sm whitespace-pre-wrap">{p.other}</div></div>}
            <div className="mt-4">
              <div className="font-semibold mb-1">連絡先</div>
              <div className="text-sm break-words">
                {p.contact?.line && <div>LINE: <span className="font-mono">{p.contact.line}</span></div>}
                {p.contact?.sns && <div>SNS: <a className="underline" href={p.contact.sns} target="_blank" rel="noreferrer">{p.contact.sns}</a></div>}
                {p.contact?.email && <div>Mail: <span className="font-mono">{p.contact.email}</span></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="font-semibold mb-2">この会員の今後のイベント</div>
          {upcoming.length ? (
            <ul className="space-y-2">
              {upcoming.map(ev => (
                <li key={ev.id} className="border border-rose-100 rounded-xl p-3 bg-rose-50/40">
                  <div className="text-sm font-medium">{ev.title}</div>
                  {ev.desc && <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{ev.desc}</div>}
                  <div className="text-xs text-gray-600">{ev.dt.toLocaleString()}・{ev.location}</div>
                  {ev.link && <div className="text-xs mt-1"><a className="underline" href={ev.link} target="_blank" rel="noreferrer">リンク</a></div>}
                  {ev.image && (<div className="mt-2 w-full max-h-48 overflow-hidden rounded-lg"><img src={ev.image} alt={ev.title} className="w-full object-cover"/></div>)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">予定されているイベントはありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditForm({ profile, onSave, onCancel }){
  const [p, setP] = useState(profile);
  const handleFile = async (file, cb) => { const reader = new FileReader(); reader.onload = ()=> cb(reader.result); reader.readAsDataURL(file); };
  const addEvent = () => { const dt = new Date(Date.now()+1000*60*60*24); const ne = { id: uid(), title: "新しいイベント", desc:"", date: dt.toISOString(), location:"", link:"", image:"" }; setP(prev=>({...prev, events:[...(prev.events||[]), ne]})); };
  const updateEvent = (id, patch) => setP(prev=>({...prev, events: prev.events.map(e=> e.id===id? {...e, ...patch}: e)}));
  const removeEvent = (id) => setP(prev=>({...prev, events: prev.events.filter(e=> e.id!==id)}));
  return (
    <div className="max-w-3xl mx-auto">
      <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
        <div className="text-xl font-semibold mb-4">プロフィール編集</div>
        <label className="block text-sm mb-1">公開設定</label>
        <div className="mb-4 flex items-center gap-3"><input type="checkbox" checked={p.isPublic} onChange={(e)=>setP({...p, isPublic: e.target.checked})} /><span className="text-sm">一般公開（検索に表示）</span></div>
        <label className="block text-sm mb-1">写真（1枚）</label>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-28 h-28 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden">{p.images?.[0]? <img src={p.images[0]} alt="preview" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}</div>
          <div><input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleFile(f, (src)=> setP(prev=>({...prev, images:[src]}))); }} /></div>
        </div>
        <label className="block text-sm mb-1">表示名（公開）</label>
        <Input value={p.displayName} onChange={(e)=>setP({...p, displayName: e.target.value})} className="mb-3" />
        <label className="block text-sm mb-1">キャッチコピー</label>
        <Input value={p.headline} onChange={(e)=>setP({...p, headline: e.target.value})} className="mb-3" />
        <label className="block text-sm mb-1">自己紹介</label>
        <Textarea rows={4} value={p.bio} onChange={(e)=>setP({...p, bio: e.target.value})} className="mb-3" />
        <label className="block text-sm mb-1">行っている事業</label>
        <Textarea rows={3} value={p.business} onChange={(e)=>setP({...p, business: e.target.value})} className="mb-3" />
        <label className="block text-sm mb-1">解決したい課題</label>
        <Textarea rows={3} value={p.problems} onChange={(e)=>setP({...p, problems: e.target.value})} className="mb-3" />
        <label className="block text-sm mb-1">その他（自由記述）</label>
        <Textarea rows={3} value={p.other||""} onChange={(e)=>setP({...p, other: e.target.value})} className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="block text-sm mb-1">LINE ID</label><Input value={p.contact?.line||""} onChange={(e)=>setP({...p, contact: {...p.contact, line: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">SNS URL</label><Input value={p.contact?.sns||""} onChange={(e)=>setP({...p, contact: {...p.contact, sns: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">メール</label><Input type="email" value={p.contact?.email||""} onChange={(e)=>setP({...p, contact: {...p.contact, email: e.target.value}})} /></div>
        </div>

        <div className="mt-8">
          <div className="text-lg font-semibold mb-2">イベント</div>
          <div className="text-xs text-gray-500 mb-3">画像・リンク可。トップの告知に使われます。</div>
          <div className="space-y-4">
            {(p.events||[]).map(ev => (
              <div key={ev.id} className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1">タイトル</label><Input value={ev.title} onChange={(e)=>updateEvent(ev.id, { title: e.target.value })} /></div>
                  <div><label className="block text-sm mb-1">日時</label><input type="datetime-local" value={toISODateTimeLocal(new Date(ev.date))} onChange={(e)=>updateEvent(ev.id, { date: new Date(e.target.value).toISOString() })} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400" /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div><label className="block text-sm mb-1">場所</label><Input value={ev.location} onChange={(e)=>updateEvent(ev.id, { location: e.target.value })} /></div>
                  <div><label className="block text-sm mb-1">リンク</label><Input value={ev.link||""} onChange={(e)=>updateEvent(ev.id, { link: e.target.value })} placeholder="Zoom / 参加フォーム / SNS など"/></div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm mb-1">概要</label>
                  <Textarea rows={2} value={ev.desc||""} onChange={(e)=>updateEvent(ev.id, { desc: e.target.value })} />
                </div>
                <div className="mt-3">
                  <label className="block text-sm mb-1">画像</label>
                  <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (!f) return; handleFile(f, (src)=> updateEvent(ev.id, { image: src })); }} />
                  {ev.image && <div className="mt-2 w-full max-h-32 overflow-hidden rounded-lg"><img src={ev.image} alt="event" className="w-full object-cover"/></div>}
                </div>
                <div className="mt-3 text-right"><Button onClick={()=>removeEvent(ev.id)} className="text-rose-700">削除</Button></div>
              </div>
            ))}
          </div>
          <div className="mt-3"><Button onClick={addEvent} className="bg-rose-600 text-white">＋ イベントを追加</Button></div>
        </div>

        <div className="mt-6 flex gap-3"><Button onClick={()=>onSave?.(p)} className="bg-rose-700 text-white">保存</Button><Button onClick={onCancel}>キャンセル</Button></div>
      </div>
    </div>
  );
}

function AuthPanel({ onLogin, onSignup, onForgot, onCancel }){
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="max-w-md mx-auto border border-rose-100 bg-white/80 rounded-2xl p-6 shadow-sm">
      <div className="flex gap-2 mb-4">
        <Button className={`${mode==='login'? 'bg-rose-600 text-white':'bg-white'}`} onClick={()=>{setMode('login'); setMessage('');}}>ログイン</Button>
        <Button className={`${mode==='signup'? 'bg-rose-600 text-white':'bg-white'}`} onClick={()=>{setMode('signup'); setMessage('');}}>新規登録</Button>
        <Button className={`${mode==='forgot'? 'bg-rose-600 text-white':'bg-white'}`} onClick={()=>{setMode('forgot'); setMessage('');}}>パスワードを忘れた方</Button>
      </div>

      {mode !== 'forgot' && (
        <>
          <label className="block text-sm mb-1">メールアドレス</label>
          <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="your@email.com" />
          <label className="block text-sm mb-1 mt-3">パスワード</label>
          <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••" />
          <div className="mt-3 flex gap-2">
            {mode==='login' ? (
              <Button className="bg-rose-700 text-white" onClick={()=> email && onLogin(email, password)}>ログイン</Button>
            ) : (
              <Button className="bg-rose-700 text-white" onClick={()=> email && onSignup(email, password)}>登録する</Button>
            )}
            <Button onClick={onCancel}>キャンセル</Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">※ デモ: 資格情報は端末ローカルに保存されます。管理者初期PWは <span className="font-mono">admin</span>。</p>
          {message && <div className="mt-3 text-sm text-rose-700">{message}</div>}
        </>
      )}

      {mode === 'forgot' && (
        <div>
          <label className="block text-sm mb-1">登録済みのメールアドレス</label>
          <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="your@email.com" />
          <div className="mt-3 flex gap-2">
            <Button className="bg-rose-700 text-white" onClick={()=>{ if(!email) return; onForgot(email); setMessage('入力されたメールアドレスに仮パスワードを送ります。'); }}>再申請</Button>
            <Button onClick={onCancel}>キャンセル</Button>
          </div>
          {message && <div className="mt-3 text-sm text-rose-700">{message}</div>}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { profiles, setProfiles } = useProfiles();
  const [me, setMe] = useState(loadAuth());
  const [mode, setMode] = useState("home"); // home | edit | detail | directory | auth
  const [active, setActive] = useState(null);

  useEffect(()=>{ saveAuth(me); }, [me]);

  const isAdmin = me === ADMIN_EMAIL;
  const myProfile = useMemo(()=> profiles.find(p=> p.owner===me) || null, [profiles, me]);
  const visibleList = useMemo(()=> profiles.filter(p=> p.isPublic).sort((a,b)=> b.createdAt - a.createdAt), [profiles]);

  const startEdit = (profile) => {
    if (!me) { setMode("auth"); return; }
    if (profile) { setActive(profile); setMode("edit"); return; }
    if (myProfile) { setActive(myProfile); setMode("edit"); }
    else { setActive(emptyProfile(me)); setMode("edit"); }
  };

  const saveProfile = (p) => {
    setProfiles((prev)=>{
      const exists = prev.some(x=> x.id===p.id);
      if (exists) return prev.map(x=> x.id===p.id? {...p, updatedAt: Date.now()}: x);
      return [{...p, createdAt: Date.now()}, ...prev];
    });
    setMode("home");
  };

  const removeProfile = (p) => {
    if (!confirm(`本当に削除しますか？\n${p.displayName}`)) return;
    setProfiles(prev => prev.filter(x=> x.id !== p.id));
    setMode("home");
  };

  const logout = ()=>{ setMe(""); setMode("home"); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-orange-50 to-amber-50 text-gray-900">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button className="font-black tracking-tight text-xl" onClick={()=>{ setMode('home'); setActive(null); window.scrollTo({top:0, behavior:'smooth'}); }}>make a wish 会員マッチング</button>
          <nav className="ml-auto flex items-center gap-2">
            {isAdmin && <Button onClick={()=> startEdit(emptyProfile(me))} className="bg-rose-700 text-white">新規会員</Button>}
            <Button onClick={()=>setMode("directory")}>会員を探す</Button>
            <Button onClick={()=> startEdit()} className="bg-rose-700 text-white">プロフィール編集</Button>
            {me ? (<><span className="text-sm text-gray-500">{me}{isAdmin && "（管理者）"}</span><Button onClick={logout}>ログアウト</Button></>) : (<Button onClick={()=>setMode("auth")}>ログイン</Button>)}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {mode === "home" && (
          <div>
            <EventSpotlight profiles={visibleList} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />
            <UpcomingEvents profiles={visibleList} />
            <div className="mt-10"><SearchSection list={visibleList} onOpen={(p)=>{ setActive(p); setMode("detail"); }} /></div>
          </div>
        )}

        {mode === "directory" && (
          <div>
            <EventSpotlight profiles={visibleList} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />
            <UpcomingEvents profiles={visibleList} />
            <div className="mt-10"><SearchSection list={visibleList} onOpen={(p)=>{ setActive(p); setMode("detail"); }} /></div>
          </div>
        )}

        {mode === "detail" && active && (
          <Detail p={active} onBack={()=> setMode("directory")} onEdit={(p)=> startEdit(p)} onRemove={(p)=> isAdmin && removeProfile(p)} canEdit={isAdmin || active.owner===me} />
        )}

        {mode === "edit" && active && (
          <EditForm profile={active} onSave={saveProfile} onCancel={()=> setMode("home")} />
        )}

        {mode === "auth" && (
          <AuthPanel
            onLogin={(email,pass)=>{ const users = loadUsers(); if(users[email] && users[email].password === pass){ setMe(email); setMode('home'); } else { alert('メールアドレスまたはパスワードが違います'); } }}
            onSignup={(email,pass)=>{ if(!email){ alert('メールを入力してください'); return;} const users = loadUsers(); const pw = pass || ''; users[email] = { password: pw }; saveUsers(users); setMe(email); setMode('home'); }}
            onForgot={(email)=>{ const users = loadUsers(); const temp = Math.random().toString(36).slice(2,10); users[email] = { password: temp }; saveUsers(users); return temp; }}
            onCancel={()=> setMode('home')}
          />
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500 flex flex-wrap gap-4 items-center">
          <div>© {new Date().getFullYear()} make a wish</div>
          <div className="ml-auto">ブラウザのみで動作するデモ（データはこの端末のローカルに保存されます）</div>
        </div>
      </footer>
    </div>
  );
}
