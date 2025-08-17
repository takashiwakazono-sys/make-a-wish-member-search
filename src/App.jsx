import React, { useEffect, useMemo, useRef, useState } from "react";

// 単一ファイルMVP（ローカルストレージ保存 / 画像はDataURL）
// - タイトル：make a wish 会員マッチング
// - 暖色テーマ（ローズ/オレンジ/アンバー）
// - サンプル会員5名 + イベント機能（画像添付可）
// - トップで会員カードを3秒ごとに自動スライド
// - 近日のイベント（カレンダー）をトップで告知

// ---------- ユーティリティ ----------
const zenkakuToHankaku = (str) => str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
const kataToHira = (str) => str.replace(/[ァ-ン]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60));
const normalize = (s) => kataToHira(zenkakuToHankaku((s||"").toLowerCase())).trim();
const uid = () => Math.random().toString(36).slice(2, 10);

const today = () => new Date();
const toISODateTimeLocal = (d) => {
  const pad = (n) => n.toString().padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`; // for input[type=datetime-local]
};

// ---------- デモデータ ----------
const demoProfiles = [
  {
    id: uid(),
    owner: "demo@site",
    isPublic: true,
    displayName: "斎藤 あかね",
    fullName: "斎藤 あかね",
    headline: "整体 × 栄養アドバイス",
    bio: "カラダのコリ・疲れが取れない方に、整体と日常のセルフケアを提案します。",
    business: "整体院運営 / オンライン姿勢診断",
    problems: "慢性的な疲労、肩こり、在宅ワークの不調",
    contact: { line: "akane_bodycare", sns: "https://x.com/akane_fit", email: "hello@akane.jp" },
    images: [],
    events: [
      { id: uid(), title: "姿勢リセット体験会", date: new Date(Date.now()+1000*60*60*24*3).toISOString(), location: "名古屋・オンライン", image: "" }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: uid(),
    owner: "demo@site",
    isPublic: true,
    displayName: "KENJI",
    fullName: "山本 健司",
    headline: "パーソナルトレーナー（ダイエット特化）",
    bio: "食事×筋トレで楽しく継続。無理なく-5kgを3ヶ月で。",
    business: "出張トレーニング / オンライン指導",
    problems: "ダイエット、姿勢改善、運動習慣の定着",
    contact: { line: "pt_kenji", sns: "https://instagram.com/pt.kenji", email: "contact@kenjifit.jp" },
    images: [],
    events: [
      { id: uid(), title: "朝活ダイエット講座", date: new Date(Date.now()+1000*60*60*24*7).toISOString(), location: "栄・カフェスペース", image: "" }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: uid(),
    owner: "demo@site",
    isPublic: true,
    displayName: "若見えLABO",
    fullName: "若見えLABO",
    headline: "エステ×肌診断 AIで若くいたいを叶える",
    bio: "AI肌診断で最適なホームケアを設計します。",
    business: "フェイシャル/コスメ提案/オンライン相談",
    problems: "若くいたい、ほうれい線、たるみ",
    contact: { line: "wakamise", sns: "https://example.com/wakamise", email: "info@wakamise.jp" },
    images: [],
    events: [
      { id: uid(), title: "AI肌診断デモ体験", date: new Date(Date.now()+1000*60*60*24*14).toISOString(), location: "オンライン", image: "" }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: uid(),
    owner: "demo@site",
    isPublic: true,
    displayName: "YOJI",
    fullName: "YOJI",
    headline: "自分夢作成プロデューサー",
    bio: "ベイビーステップで叶える“100夢リスト”の作り方をお伝えします。",
    business: "ワークショップ / コーチング",
    problems: "やりたいことが言語化できない、行動に移せない",
    contact: { line: "yoji_makeawish", sns: "", email: "yoji@example.com" },
    images: [],
    events: [
      { id: uid(), title: "100夢リスト会", date: new Date(Date.now()+1000*60*60*24*12).toISOString(), location: "名古屋・花車ビル中館306", image: "" }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: uid(),
    owner: "demo@site",
    isPublic: true,
    displayName: "はるか（食と睡眠）",
    fullName: "田中 はるか",
    headline: "管理栄養士 × 睡眠カウンセラー",
    bio: "“疲れが取れない”に寄り添い、食事と睡眠の両輪で整える方法を提案します。",
    business: "オンライン栄養相談 / 睡眠プログラム",
    problems: "眠りの質が悪い、朝がだるい",
    contact: { line: "haruka_sleep", sns: "", email: "hello@haruka.jp" },
    images: [],
    events: [
      { id: uid(), title: "ぐっすり睡眠セミナー", date: new Date(Date.now()+1000*60*60*24*5).toISOString(), location: "オンライン", image: "" }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
];

const STORAGE_KEY = "member_matching_profiles_v1";
const AUTH_KEY = "member_matching_current_user_v1";

function loadProfiles() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProfiles));
    return demoProfiles;
  }
  try {
    const data = JSON.parse(raw);
    return (Array.isArray(data) ? data : demoProfiles).map(p => ({
      events: [],
      ...p,
      events: Array.isArray(p.events) ? p.events : [],
    }));
  } catch {
    return demoProfiles;
  }
}

function saveProfiles(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function loadAuth() { return localStorage.getItem(AUTH_KEY) || ""; }
function saveAuth(email) { if (email) localStorage.setItem(AUTH_KEY, email); else localStorage.removeItem(AUTH_KEY); }

// ---------- UI 基本 ----------
const Input = (props) => (
  <input {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />
);
const Textarea = (props) => (
  <textarea {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />
);
const Button = ({ children, className = "", ...rest }) => (
  <button {...rest} className={`rounded-2xl px-4 py-2 shadow-sm border hover:shadow transition ${className}`}>{children}</button>
);
const Chip = ({ text }) => (
  <span className="text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 mr-1 mb-1 inline-block">{text}</span>
);

function useProfiles() {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  return { profiles, setProfiles };
}

const emptyProfile = (owner) => ({
  id: uid(), owner, isPublic: true,
  displayName: "", fullName: "", headline: "", bio: "", business: "", problems: "",
  contact: { line: "", sns: "", email: "" }, images: [], events: [], createdAt: Date.now(),
});

// ---------- 検索バー ----------
function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit?.();}} className="flex gap-2 w-full">
      <Input placeholder="キーワードで検索（例：疲れが取れない / 若くいたい / ダイエット）" value={value} onChange={(e)=>onChange(e.target.value)} />
      <Button type="submit" className="bg-rose-600 text-white">検索</Button>
    </form>
  );
}

// ---------- カード/ディレクトリ ----------
function ProfileCard({ p, onOpen }) {
  const tags = useMemo(()=>{
    const s = `${p.headline} ${p.bio} ${p.business} ${p.problems}`;
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
        <div className="flex-1">
          <div className="text-lg font-semibold">{p.displayName || "（未設定）"}</div>
          <div className="text-sm text-gray-600">{p.headline}</div>
          <div className="mt-2 line-clamp-2 text-sm">{p.bio}</div>
        </div>
      </div>
      <div className="mt-3">{tags.map(t=> <Chip key={t} text={t} />)}</div>
      {nextEvent && (
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          近日イベント：<strong className="ml-1">{nextEvent.title}</strong>（{nextEvent.dt.toLocaleString()} / {nextEvent.location}）
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

// ---------- 詳細 ----------
function Detail({ p, onBack }){
  const img = p.images?.[0];
  const upcoming = (p.events||[]).map(e=>({ ...e, dt: new Date(e.date)})).filter(e=> e.dt>=today()).sort((a,b)=> a.dt-b.dt);
  return (
    <div className="max-w-3xl mx-auto">
      <Button onClick={onBack} className="mb-4">← 戻る</Button>
      <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
        <div className="flex gap-6">
          <div className="w-40 h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden flex-none">
            {img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{p.displayName}</div>
            <div className="text-gray-600">{p.headline}</div>
            <div className="mt-4 whitespace-pre-wrap leading-relaxed">{p.bio}</div>
            <div className="mt-4"><div className="font-semibold mb-1">行っている事業</div><div className="text-sm whitespace-pre-wrap">{p.business}</div></div>
            <div className="mt-4"><div className="font-semibold mb-1">解決したい課題</div><div className="text-sm whitespace-pre-wrap">{p.problems}</div></div>
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
                  <div className="text-xs text-gray-600">{ev.dt.toLocaleString()}・{ev.location}</div>
                  {ev.image && <div className="mt-2 w-full max-h-48 overflow-hidden rounded-lg"><img src={ev.image} alt={ev.title} className="w-full object-cover"/></div>}
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

// ---------- 編集（プロフィール + イベント） ----------
function EditForm({ profile, onSave, onCancel }){
  const [p, setP] = useState(profile);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    const reader = new FileReader();
    reader.onload = () => { setP((prev)=> ({...prev, images: [reader.result]})); };
    reader.readAsDataURL(file);
  };

  const addEvent = () => {
    const dt = new Date(Date.now()+1000*60*60*24);
    const newEv = { id: uid(), title: "新しいイベント", date: dt.toISOString(), location: "", image: "" };
    setP(prev => ({...prev, events: [...(prev.events||[]), newEv]}));
  };
  const updateEvent = (id, patch) => { setP(prev => ({...prev, events: prev.events.map(e=> e.id===id? {...e, ...patch}: e)})); };
  const removeEvent = (id) => setP(prev => ({...prev, events: prev.events.filter(e=> e.id!==id)}));
  const handleEventImage = (id, file) => { const reader = new FileReader(); reader.onload = () => { updateEvent(id, { image: reader.result }); }; reader.readAsDataURL(file); };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
        <div className="text-xl font-semibold mb-4">プロフィール編集</div>

        <label className="block text-sm mb-1">公開設定</label>
        <div className="mb-4 flex items-center gap-3"><input type="checkbox" checked={p.isPublic} onChange={(e)=>setP({...p, isPublic: e.target.checked})} /><span className="text-sm">一般公開（検索に表示）</span></div>

        <label className="block text-sm mb-1">写真（1枚）</label>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-28 h-28 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden">{p.images?.[0] ? <img src={p.images[0]} alt="preview" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}</div>
          <div><input ref={fileRef} type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleFile(f); }} /></div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="block text-sm mb-1">LINE ID</label><Input value={p.contact?.line||""} onChange={(e)=>setP({...p, contact: {...p.contact, line: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">SNS URL</label><Input value={p.contact?.sns||""} onChange={(e)=>setP({...p, contact: {...p.contact, sns: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">メール</label><Input type="email" value={p.contact?.email||""} onChange={(e)=>setP({...p, contact: {...p.contact, email: e.target.value}})} /></div>
        </div>

        {/* イベント編集 */}
        <div className="mt-8">
          <div className="text-lg font-semibold mb-2">イベント</div>
          <div className="text-xs text-gray-500 mb-3">画像を添付するとトップのカレンダー告知でサムネイル表示されます。</div>
          <div className="space-y-4">
            {(p.events||[]).map(ev => (
              <div key={ev.id} className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1">タイトル</label><Input value={ev.title} onChange={(e)=>updateEvent(ev.id, { title: e.target.value })} /></div>
                  <div><label className="block text-sm mb-1">日時</label><input type="datetime-local" value={toISODateTimeLocal(new Date(ev.date))} onChange={(e)=>updateEvent(ev.id, { date: new Date(e.target.value).toISOString() })} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400" /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div><label className="block text-sm mb-1">場所</label><Input value={ev.location} onChange={(e)=>updateEvent(ev.id, { location: e.target.value })} /></div>
                  <div>
                    <label className="block text-sm mb-1">画像</label>
                    <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleEventImage(ev.id, f); }} />
                    {ev.image && <div className="mt-2 w-full max-h-32 overflow-hidden rounded-lg"><img src={ev.image} alt="event" className="w-full object-cover"/></div>}
                  </div>
                </div>
                <div className="mt-3 text-right"><Button onClick={()=>removeEvent(ev.id)} className="text-rose-700">削除</Button></div>
              </div>
            ))}
          </div>
          <div className="mt-3"><Button onClick={addEvent} className="bg-rose-600 text-white">＋ イベントを追加</Button></div>
        </div>

        <div className="mt-6 flex gap-3"><Button onClick={()=>onSave?.(p)} className="bg-rose-600 text-white">保存</Button><Button onClick={onCancel}>キャンセル</Button></div>
      </div>
    </div>
  );
}

// ---------- トップ：カルーセル + 近日イベント ----------
function FeaturedCarousel({ items, onOpen }){
  const [idx, setIdx] = useState(0);
  useEffect(()=>{ if (!items.length) return; const t = setInterval(()=> setIdx(i => (i+1) % items.length), 3000); return ()=> clearInterval(t); }, [items.length]);
  if (!items.length) return null;
  const p = items[idx];
  const img = p.images?.[0];
  return (
    <div className="relative border border-rose-100 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-sm overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-rose-50 via-orange-50 to-amber-50 opacity-60"/>
      <div className="relative flex items-center gap-6">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl overflow-hidden flex-none">{img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xl md:text-2xl font-bold truncate">{p.displayName}</div>
          <div className="text-sm md:text-base text-gray-700 mt-1 line-clamp-2">{p.headline}</div>
          <div className="mt-3 flex gap-2"><Button onClick={()=>onOpen?.(p)} className="bg-rose-700 text-white">詳細を見る</Button><Button className="" onClick={()=>window.scrollTo({top: document.body.scrollHeight/3, behavior:'smooth'})}>会員を探す</Button></div>
        </div>
      </div>
      <div className="absolute right-4 bottom-4 text-xs text-gray-500">{idx+1}/{items.length}</div>
    </div>
  );
}

function UpcomingEvents({ profiles }){
  const events = useMemo(()=>{
    const now = today();
    let list = [];
    for (const p of profiles) {
      for (const e of (p.events||[])) {
        const dt = new Date(e.date);
        if (isNaN(dt)) continue;
        if (dt >= now) list.push({ ...e, dt, host: p });
      }
    }
    return list.sort((a,b)=> a.dt - b.dt).slice(0, 6);
  }, [profiles]);
  if (!events.length) return null;
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">近日のイベント</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {events.map(ev => (
          <div key={ev.id} className="border border-rose-100 bg-white/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 flex-none">{ev.image ? <img src={ev.image} alt={ev.title} className="w-full h-full object-cover"/> :
                <div className="w-full h-full grid place-items-center text-rose-300">IMG</div>}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{ev.title}</div>
                <div className="text-xs text-gray-600 truncate">{ev.dt.toLocaleString()}・{ev.location}</div>
                <div className="text-xs text-rose-700 mt-1 truncate">主催：{ev.host.displayName}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- アプリ本体 ----------
export default function App() {
  const { profiles, setProfiles } = useProfiles();
  const [me, setMe] = useState(loadAuth());
  const [mode, setMode] = useState("home"); // home | edit | detail | directory | login
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  useEffect(()=>{ saveAuth(me); }, [me]);

  const myProfile = useMemo(()=> profiles.find(p=> p.owner===me) || null, [profiles, me]);
  const visibleList = useMemo(()=> profiles.filter(p=> p.isPublic).sort((a,b)=> b.createdAt - a.createdAt), [profiles]);

  const results = useMemo(()=>{
    if (!query) return visibleList;
    const q = normalize(query);
    return visibleList.filter(p=>{
      const hay = normalize(`${p.displayName} ${p.headline} ${p.bio} ${p.business} ${p.problems}`);
      return q.split(/\s+/).every(t=> hay.includes(t));
    });
  }, [query, visibleList]);

  const startEdit = () => {
    if (!me) { setMode("login"); return; }
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

  const logout = ()=>{ setMe(""); setMode("home"); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-orange-50 to-amber-50 text-gray-900">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-black tracking-tight text-xl">make a wish 会員マッチング</div>
          <nav className="ml-auto flex items-center gap-2">
            <Button onClick={()=>setMode("directory")}>会員を探す</Button>
            <Button onClick={startEdit} className="bg-rose-700 text-white">プロフィール登録</Button>
            {me ? (<><span className="text-sm text-gray-500">{me}</span><Button onClick={logout}>ログアウト</Button></>) : (<Button onClick={()=>setMode("login")}>ログイン</Button>)}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {mode === "home" && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">あたたかい出会いで、“叶えたい”が動きだす</h1>
              <p className="text-rose-700/80 font-medium">make a wish 会員マッチング</p>
            </div>

            {/* スライダー */}
            <FeaturedCarousel items={visibleList.slice(0, 8)} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />

            <div className="mt-8">
              <SearchBar value={query} onChange={setQuery} onSubmit={()=>setMode("directory")} />
            </div>

            <UpcomingEvents profiles={visibleList} />

            <h2 className="text-xl font-semibold mt-10 mb-3">新着会員</h2>
            <Directory items={visibleList.slice(0,6)} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />
          </div>
        )}

        {mode === "directory" && (
          <div>
            <div className="mb-6">
              <SearchBar value={query} onChange={setQuery} onSubmit={()=>{}} />
            </div>
            <Directory items={results} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />
          </div>
        )}

        {mode === "detail" && active && (<Detail p={active} onBack={()=> setMode("directory")} />)}
        {mode === "edit" && active && (<EditForm profile={active} onSave={saveProfile} onCancel={()=> setMode("home")} />)}

        {mode === "login" && (
          <div className="max-w-md mx-auto border border-rose-100 bg-white/80 rounded-2xl p-6 shadow-sm">
            <div className="text-xl font-semibold mb-4">ログイン / 新規メール登録</div>
            <Input placeholder="メールアドレス" onKeyDown={(e)=>{ if(e.key==='Enter'){ setMe(e.currentTarget.value); setMode("home"); } }} />
            <div className="mt-3 flex gap-2">
              <Button className="bg-rose-600 text-white" onClick={()=>{
                const el = document.querySelector("input[placeholder='メールアドレス']");
                const v = el?.value?.trim(); if (!v) return; setMe(v); setMode("home");
              }}>続ける</Button>
              <Button onClick={()=> setMode("home")}>キャンセル</Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">※ このデモではパスワードは不要です。メールはローカル保存のみで送信されません。</p>
          </div>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500 flex flex-wrap gap-4 items-center">
          <div>© {new Date().getFullYear()} make a wish 会員マッチング Demo</div>
          <div className="ml-auto">ブラウザのみで動作するデモ（データはこの端末のローカルに保存されます）</div>
        </div>
      </footer>
    </div>
  );
}
