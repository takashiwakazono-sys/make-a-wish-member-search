import React, { useEffect, useMemo, useRef, useState } from "react";

// ---- Utils ----
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
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

// ---- Sample Data (8 members / 5 events) ----
const demoProfiles = [
  // 1
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "斎藤 あかね", fullName: "斎藤 あかね",
    headline: "整体 × 栄養アドバイス",
    bio: "コリ・疲れが取れない方に、整体と日常のセルフケアをご提案。",
    business: "整体院運営 / オンライン姿勢診断",
    problems: "慢性的な疲労、肩こり、在宅ワークの不調",
    contact: { line: "akane_bodycare", sns: "https://x.com/akane_fit", email: "hello@akane.jp" },
    images: [],
    events: [
      { id: uid(), title: "姿勢リセット体験会", date: new Date(Date.now()+1000*60*60*24*3).toISOString(), location: "名古屋・オンライン", desc: "30分で姿勢のコツを体感。", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" }
    ],
    createdAt: Date.now() - 1000*60*60*24*3,
  },
  // 2
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "KENJI", fullName: "山本 健司",
    headline: "パーソナルトレーナー（ダイエット特化）",
    bio: "食事×筋トレで楽しく継続。無理なく-5kgを3ヶ月で。",
    business: "出張トレーニング / オンライン指導",
    problems: "ダイエット、姿勢改善、運動習慣の定着",
    contact: { line: "pt_kenji", sns: "https://instagram.com/pt.kenji", email: "contact@kenjifit.jp" },
    images: [],
    events: [
      { id: uid(), title: "朝活ダイエット講座", date: new Date(Date.now()+1000*60*60*24*7).toISOString(), location: "栄・カフェスペース", desc: "朝の30分で代謝アップ習慣。", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" }
    ],
    createdAt: Date.now() - 1000*60*60*24*10,
  },
  // 3
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "若見えLABO", fullName: "若見えLABO",
    headline: "エステ×肌診断 AIで若くいたいを叶える",
    bio: "AI肌診断で最適なホームケアを設計。",
    business: "フェイシャル/コスメ提案/オンライン相談",
    problems: "若くいたい、ほうれい線、たるみ",
    contact: { line: "wakamise", sns: "https://example.com/wakamise", email: "info@wakamise.jp" },
    images: [],
    events: [
      { id: uid(), title: "AI肌診断デモ体験", date: new Date(Date.now()+1000*60*60*24*14).toISOString(), location: "オンライン", desc: "AIで肌コンディションを見える化。", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" }
    ],
    createdAt: Date.now() - 1000*60*60*24*30,
  },
  // 4
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "YOJI", fullName: "YOJI",
    headline: "自分夢作成プロデューサー",
    bio: "ベイビーステップで叶える“100夢リスト”の作り方をお伝えします。",
    business: "ワークショップ / コーチング",
    problems: "やりたいことが言語化できない、行動に移せない",
    contact: { line: "yoji_makeawish", sns: "", email: "yoji@example.com" },
    images: [],
    events: [
      { id: uid(), title: "100夢リスト会", date: new Date(Date.now()+1000*60*60*24*12).toISOString(), location: "名古屋・花車ビル中館306", desc: "20分で“叶う”が始まる！", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" }
    ],
    createdAt: Date.now() - 1000*60*60*24*1,
  },
  // 5
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "はるか（食と睡眠）", fullName: "田中 はるか",
    headline: "管理栄養士 × 睡眠カウンセラー",
    bio: "“疲れが取れない”に寄り添い、食事と睡眠の両輪で整える方法を提案します。",
    business: "オンライン栄養相談 / 睡眠プログラム",
    problems: "眠りの質が悪い、朝がだるい",
    contact: { line: "haruka_sleep", sns: "", email: "hello@haruka.jp" },
    images: [],
    events: [
      { id: uid(), title: "ぐっすり睡眠セミナー", date: new Date(Date.now()+1000*60*60*24*5).toISOString(), location: "オンライン", desc: "睡眠の土台を作る30分。", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" }
    ],
    createdAt: Date.now() - 1000*60*60*24*6,
  },
  // 6
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "内海 直樹", fullName: "内海 直樹",
    headline: "呼吸法コーチ",
    bio: "ストレスケアと呼吸リセットで日常の集中力UP。",
    business: "オンライン個別セッション",
    problems: "緊張・不安・浅い呼吸",
    contact: { line: "naoki_breath", sns: "", email: "naoki@example.com" },
    images: [],
    events: [],
    createdAt: Date.now() - 1000*60*60*24*20,
  },
  // 7
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "グリーンフード鈴木", fullName: "鈴木 みどり",
    headline: "発酵食アドバイザー",
    bio: "腸から整える簡単レシピと食習慣。",
    business: "発酵教室 / オンライン講座",
    problems: "便通、むくみ、肌荒れ",
    contact: { line: "midori_ferment", sns: "", email: "midori@example.com" },
    images: [],
    events: [],
    createdAt: Date.now() - 1000*60*60*24*25,
  },
  // 8
  { id: uid(), owner: "demo@site", isPublic: true,
    displayName: "RINA（姿勢ラボ）", fullName: "高橋 里奈",
    headline: "理学療法士 / 姿勢改善",
    bio: "在宅ワーカーの首肩ケアをオンラインでサポート。",
    business: "オンライン姿勢トレーニング",
    problems: "猫背、肩こり、目の疲れ",
    contact: { line: "rina_posture", sns: "", email: "rina@example.com" },
    images: [],
    events: [],
    createdAt: Date.now() - 1000*60*60*24*15,
  },
];

const STORAGE_KEY = "member_matching_profiles_v1";
const AUTH_KEY = "member_matching_current_user_v1";
function loadProfiles() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProfiles)); return demoProfiles; }
  try {
    const data = JSON.parse(raw);
    return (Array.isArray(data) ? data : demoProfiles).map(p=> ({ events:[], ...p, events: Array.isArray(p.events)? p.events: [] }));
  } catch { return demoProfiles; }
}
function saveProfiles(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function loadAuth() { return localStorage.getItem(AUTH_KEY) || ""; }
function saveAuth(email) { if (email) localStorage.setItem(AUTH_KEY, email); else localStorage.removeItem(AUTH_KEY); }

// ---- Small UI ----
const Input = (props) => (<input {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />);
const Textarea = (props) => (<textarea {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 ${props.className||""}`} />);
const Button = ({ children, className = "", ...rest }) => (<button {...rest} className={`rounded-2xl px-4 py-2 shadow-sm border hover:shadow transition ${className}`}>{children}</button>);
const Chip = ({ text }) => (<span className="text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 mr-1 mb-1 inline-block">{text}</span>);

// ---- Cropper Modal ----
function CropperModal({ open, onClose, src, aspect = 16/9, onDone, viewport }) {
  const imgRef = useRef(null);
  const [natural, setNatural] = useState({w:0,h:0});
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x:0,y:0});
  const vp = viewport || (window.innerWidth < 640 ? {w: 320, h: Math.round(320/aspect)} : {w: 640, h: Math.round(640/aspect)});

  useEffect(()=>{ if (open){ setScale(1); setOffset({x:0,y:0}); }}, [open, src, aspect]);

  const onImgLoad = (e)=>{
    const w = e.currentTarget.naturalWidth; const h = e.currentTarget.naturalHeight; setNatural({w,h});
    const base = Math.max(vp.w / w, vp.h / h); // cover
    const dispW = w * base, dispH = h * base;
    setOffset({x: (vp.w - dispW)/2, y: (vp.h - dispH)/2});
  };

  const clamp = (nx, ny, s)=>{
    const base = Math.max(vp.w / natural.w, vp.h / natural.h);
    const dispW = natural.w * base * s; const dispH = natural.h * base * s;
    const minX = vp.w - dispW, maxX = 0; const minY = vp.h - dispH, maxY = 0;
    return { x: Math.min(maxX, Math.max(minX, nx)), y: Math.min(maxY, Math.max(minY, ny)) };
  };

  const dragging = useRef(false); const last = useRef({x:0,y:0});
  const getPoint = (e)=> ({ x: e.touches? e.touches[0].clientX: e.clientX, y: e.touches? e.touches[0].clientY: e.clientY });
  const startDrag = (e)=>{ dragging.current = true; last.current = getPoint(e); };
  const moveDrag = (e)=>{
    if(!dragging.current) return; const p = getPoint(e);
    const dx = p.x - last.current.x; const dy = p.y - last.current.y; last.current = p;
    setOffset(prev => clamp(prev.x + dx, prev.y + dy, scale));
  };
  const endDrag = ()=>{ dragging.current = false; };

  const doCrop = ()=>{
    const base = Math.max(vp.w / natural.w, vp.h / natural.h);
    const eff = base * scale;
    const sx = (-offset.x) / eff; const sy = (-offset.y) / eff; const sw = vp.w / eff; const sh = vp.h / eff;
    const canvas = document.createElement('canvas'); canvas.width = vp.w; canvas.height = vp.h;
    const ctx = canvas.getContext('2d'); const img = imgRef.current; if (!img) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, vp.w, vp.h);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    onDone?.(url); onClose?.();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onMouseUp={endDrag} onMouseLeave={endDrag} onTouchEnd={endDrag}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-4">
        <div className="text-lg font-semibold mb-3">画像の切り取り調整</div>
        <div className="w-full overflow-auto">
          <div className="relative mx-auto" style={{width: vp.w, height: vp.h, touchAction:'none'}}>
            {src ? (
              <img ref={imgRef} src={src} alt="crop"
                   onLoad={onImgLoad}
                   onMouseDown={startDrag} onMouseMove={moveDrag}
                   onTouchStart={startDrag} onTouchMove={moveDrag}
                   draggable={false}
                   style={{ position:'absolute', left: offset.x, top: offset.y, transform:`scale(${Math.max(1,scale)})`, transformOrigin:'top left' }} />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400">画像を選択してください</div>
            )}
            <div className="absolute inset-0 border-2 border-rose-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm">ズーム</span>
          <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e)=> setScale(Number(e.target.value))} className="w-full" />
          <Button onClick={()=>{ setScale(1); setOffset({x:0,y:0}); }}>リセット</Button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>キャンセル</Button>
          <Button className="bg-rose-600 text-white" onClick={doCrop}>切り取って保存</Button>
        </div>
      </div>
    </div>
  );
}

// ---- Feature Pieces ----
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
        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl overflow-hidden flex-none">
          {img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl md:text-2xl font-bold truncate">{p.displayName}</div>
          <div className="text-sm md:text-base text-gray-700 mt-1">{p.headline}</div>
          <div className="mt-3 flex gap-2"><Button onClick={()=>onOpen?.(p)} className="bg-rose-700 text-white">詳細を見る</Button></div>
        </div>
      </div>
      <div className="absolute right-4 bottom-4 text-xs text-gray-500">{idx+1}/{items.length}</div>
    </div>
  );
}

function UpcomingEvents({ profiles, onOpenEvent }){
  const events = useMemo(()=>{
    const now = today(); let list = [];
    for (const p of profiles) for (const e of (p.events||[])) { const dt = new Date(e.date); if(!isNaN(dt) && dt>=now) list.push({ ...e, dt, host:p }); }
    return list.sort((a,b)=> a.dt - b.dt).slice(0, 9);
  }, [profiles]);
  if (!events.length) return null;
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">近日のイベント</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => (
          <button key={ev.id} onClick={()=> onOpenEvent?.(ev, ev.host)} className="text-left border border-rose-100 rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-rose-50 flex-none">
                {ev.thumbImage ? <img src={ev.thumbImage} alt={ev.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">IMG</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{ev.title}</div>
                <div className="text-xs text-gray-600 truncate">{ev.dt.toLocaleString()}・{ev.location}</div>
                <div className="text-xs text-rose-700 mt-1">詳細を見る →</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ p, onOpen }){
  const tags = useMemo(()=>{
    const s = `${p.headline} ${p.bio} ${p.business} ${p.problems}`;
    return Array.from(new Set(normalize(s).split(/[^a-z0-9ぁ-ん一-龥]+/).filter(w=>w.length>=2))).slice(0,6);
  }, [p]);
  const img = p.images?.[0];
  return (
    <div className="border border-rose-100 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden flex-none">
          {img ? <img src={img} alt={p.displayName} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold truncate">{p.displayName || "（未設定）"}</div>
          <div className="text-sm text-gray-600 truncate">{p.headline}</div>
          <div className="mt-2 text-sm">{p.bio}</div>
        </div>
      </div>
      <div className="mt-3">{tags.map(t=> <Chip key={t} text={t} />)}</div>
      <div className="mt-4 flex justify-end"><Button onClick={()=>onOpen?.(p)} className="bg-rose-700 text-white">詳細</Button></div>
    </div>
  );
}
function Directory({ items, onOpen }){
  if (!items.length) return <div className="text-center text-gray-500 py-16">該当する会員が見つかりませんでした。</div>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(p=> <ProfileCard key={p.id} p={p} onOpen={onOpen} />)}</div>;
}

function Detail({ p, onBack }){
  const img = p.images?.[0];
  const upcoming = (p.events||[]).map(e=>({ ...e, dt: new Date(e.date)})).filter(e=> e.dt>=today()).sort((a,b)=> a.dt-b.dt);
  return (
    <div className="max-w-3xl mx-auto">
      <Button onClick={onBack} className="mb-4">← 戻る</Button>
      <div className="border border-rose-100 bg-white/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-40 h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden flex-none">
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
                  <div className="text-xs text-gray-600">{new Date(ev.date).toLocaleString()}・{ev.location}</div>
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

function EventDetail({ ev, host, onBack }){
  const dt = new Date(ev.date);
  return (
    <div className="max-w-3xl mx-auto">
      <Button onClick={onBack} className="mb-4">← 戻る</Button>
      <div className="border border-rose-100 bg-white rounded-2xl p-0 overflow-hidden shadow-sm">
        <div className="w-full aspect-video bg-rose-50">
          {ev.heroImage ? <img src={ev.heroImage} alt={ev.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Image</div>}
        </div>
        <div className="p-6">
          <div className="text-2xl font-bold">{ev.title}</div>
          <div className="text-sm text-gray-600 mt-1">{dt.toLocaleString()}・{ev.location}</div>
          {ev.desc && <div className="mt-3 whitespace-pre-wrap">{ev.desc}</div>}
          {host && (
            <div className="mt-6 border-t pt-4">
              <div className="text-sm text-gray-500">主催</div>
              <div className="text-base font-medium">{host.displayName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Forms ----
const emptyProfile = (owner) => ({
  id: uid(), owner, isPublic: true,
  displayName: "", fullName: "", headline: "", bio: "", business: "", problems: "",
  contact: { line: "", sns: "", email: "" }, images: [], events: [], createdAt: Date.now(),
});

function EditForm({ profile, onSave, onCancel }){
  const [p, setP] = useState(profile);
  const handleFile = async (file) => { const r = new FileReader(); r.onload = () => setP(prev=>({...prev, images:[r.result]})); r.readAsDataURL(file); };

  const addEvent = () => {
    const dt = new Date(Date.now()+1000*60*60*24);
    const newEv = { id: uid(), title: "新しいイベント", date: dt.toISOString(), location: "", desc:"", heroBase:"", heroImage:"", thumbBase:"", thumbImage:"" };
    setP(prev => ({...prev, events: [...(prev.events||[]), newEv]}));
  };
  const updateEvent = (id, patch) => setP(prev => ({...prev, events: prev.events.map(e=> e.id===id? {...e, ...patch}: e)}));
  const removeEvent = (id) => setP(prev => ({...prev, events: prev.events.filter(e=> e.id!==id)}));

  const [crop, setCrop] = useState({ open:false, src:"", aspect:16/9, onDone:()=>{}, viewport:null });
  const openCropper = (src, aspect, onDone, viewport)=> setCrop({ open:true, src, aspect, onDone, viewport });
  const pickAndCrop = (aspect, onDone, viewport)=> (e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=> openCropper(r.result, aspect, onDone, viewport); r.readAsDataURL(f); };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="border border-rose-100 bg-white/80 rounded-2xl p-6 shadow-sm">
        <div className="text-xl font-semibold mb-4">プロフィール編集</div>

        <label className="block text-sm mb-1">公開設定</label>
        <div className="mb-4 flex items-center gap-3"><input type="checkbox" checked={p.isPublic} onChange={(e)=>setP({...p, isPublic: e.target.checked})} /><span className="text-sm">一般公開（検索に表示）</span></div>

        <label className="block text-sm mb-1">写真（1枚）</label>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-28 h-28 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl overflow-hidden">{p.images?.[0] ? <img src={p.images[0]} alt="preview" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Photo</div>}</div>
          <div><input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleFile(f); }} /></div>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="block text-sm mb-1">LINE ID</label><Input value={p.contact?.line||""} onChange={(e)=>setP({...p, contact: {...p.contact, line: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">SNS URL</label><Input value={p.contact?.sns||""} onChange={(e)=>setP({...p, contact: {...p.contact, sns: e.target.value}})} /></div>
          <div><label className="block text-sm mb-1">メール</label><Input type="email" value={p.contact?.email||""} onChange={(e)=>setP({...p, contact: {...p.contact, email: e.target.value}})} /></div>
        </div>

        <div className="mt-8">
          <div className="text-lg font-semibold mb-2">イベント</div>
          <div className="text-xs text-gray-500 mb-3">① 大きめ（Hero/16:9） ② 近日表示（Thumb/1:1） の2画像を登録 → 切り取り調整ができます。</div>

          <div className="space-y-4">
            {(p.events||[]).map(ev => (
              <div key={ev.id} className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1">タイトル</label><Input value={ev.title} onChange={(e)=>updateEvent(ev.id, { title: e.target.value })} /></div>
                  <div><label className="block text-sm mb-1">日時</label><input type="datetime-local" value={toISODateTimeLocal(new Date(ev.date))} onChange={(e)=>updateEvent(ev.id, { date: new Date(e.target.value).toISOString() })} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div><label className="block text-sm mb-1">場所</label><Input value={ev.location} onChange={(e)=>updateEvent(ev.id, { location: e.target.value })} /></div>
                  <div><label className="block text-sm mb-1">説明</label><Input value={ev.desc||\"\"} onChange={(e)=>updateEvent(ev.id, { desc: e.target.value })} /></div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">① 大きめ画像（Hero / 16:9）</div>
                    <div className="w-full aspect-video bg-rose-50 rounded-xl overflow-hidden">
                      {ev.heroImage ? <img src={ev.heroImage} alt="hero" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Image</div>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <label className="cursor-pointer text-sm underline">
                        画像を選択<input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ updateEvent(ev.id,{heroBase:r.result}); setTimeout(()=> setCrop({open:true, src:r.result, aspect:16/9, viewport:{w:window.innerWidth<640?320:640, h:window.innerWidth<640?180:360}, onDone:(url)=> updateEvent(ev.id,{heroImage:url})}),0); }; r.readAsDataURL(f); }} />
                      </label>
                      {ev.heroBase && <Button className="text-sm" onClick={()=> setCrop({open:true, src: ev.heroBase, aspect: 16/9, viewport:{w: window.innerWidth<640?320:640, h: window.innerWidth<640?180:360}, onDone:(url)=> updateEvent(ev.id, { heroImage:url })})}>切り抜きを調整</Button>}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">② 近日表示用（Thumb / 1:1）</div>
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-rose-50 rounded-xl overflow-hidden">
                      {ev.thumbImage ? <img src={ev.thumbImage} alt="thumb" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-rose-300">No Image</div>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <label className="cursor-pointer text-sm underline">
                        画像を選択<input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ updateEvent(ev.id,{thumbBase:r.result}); setTimeout(()=> setCrop({open:true, src:r.result, aspect:1, viewport:{w:window.innerWidth<640?200:300, h:window.innerWidth<640?200:300}, onDone:(url)=> updateEvent(ev.id,{thumbImage:url})}),0); }; r.readAsDataURL(f); }} />
                      </label>
                      {ev.thumbBase && <Button className="text-sm" onClick={()=> setCrop({open:true, src: ev.thumbBase, aspect: 1, viewport:{w: window.innerWidth<640?200:300, h: window.innerWidth<640?200:300}, onDone:(url)=> updateEvent(ev.id, { thumbImage:url })})}>切り抜きを調整</Button>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-right"><Button onClick={()=>removeEvent(ev.id)} className="text-rose-700">イベント削除</Button></div>
              </div>
            ))}
          </div>

          <div className="mt-3"><Button onClick={addEvent} className="bg-rose-600 text-white">＋ イベントを追加</Button></div>
        </div>

        <div className="mt-6 flex gap-3"><Button onClick={()=>onSave?.(p)} className="bg-rose-600 text-white">保存</Button><Button onClick={onCancel}>キャンセル</Button></div>
      </div>

      <CropperModal open={crop.open} src={crop.src} aspect={crop.aspect} onDone={crop.onDone} onClose={()=> setCrop(s=>({...s, open:false}))} viewport={crop.viewport} />
    </div>
  );
}

// ---- Search Bar ----
function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit?.();}} className="flex gap-2 w-full">
      <Input placeholder="キーワードで検索（例：疲れが取れない / 若くいたい / ダイエット）" value={value} onChange={(e)=>onChange(e.target.value)} />
      <Button type="submit" className="bg-rose-600 text-white">検索</Button>
    </form>
  );
}

// ---- Data Hook ----
function useProfiles() {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  return { profiles, setProfiles };
}

// ---- App ----
export default function App() {
  const { profiles, setProfiles } = useProfiles();
  const [me, setMe] = useState(loadAuth());
  const [mode, setMode] = useState("home"); // home | edit | detail | directory | login | event
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeHost, setActiveHost] = useState(null);

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
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b border-rose-100 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-black tracking-tight text-xl truncate">make a wish 会員マッチング</div>
          <nav className="ml-auto flex items-center gap-2">
            <Button onClick={()=>setMode("directory")}>会員を探す</Button>
            <Button onClick={startEdit} className="bg-rose-700 text-white">プロフィール登録</Button>
            {me ? (<><span className="text-sm text-gray-500 hidden sm:inline">{me}</span><Button onClick={logout}>ログアウト</Button></>) : (<Button onClick={()=>setMode("login")}>ログイン</Button>)}
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
            <FeaturedCarousel items={visibleList.slice(0, 8)} onOpen={(p)=>{ setActive(p); setMode("detail"); }} />
            <div className="mt-8"><SearchBar value={query} onChange={setQuery} onSubmit={()=>setMode(\"directory\")} /></div>
            <UpcomingEvents profiles={visibleList} onOpenEvent={(ev,host)=>{ setActiveEvent(ev); setActiveHost(host); setMode(\"event\"); }} />
            <h2 className="text-xl font-semibold mt-10 mb-3">新着会員</h2>
            <Directory items={visibleList.slice(0,6)} onOpen={(p)=>{ setActive(p); setMode(\"detail\"); }} />
          </div>
        )}

        {mode === "directory" && (
          <div>
            <div className="mb-6"><SearchBar value={query} onChange={setQuery} onSubmit={()=>{}} /></div>
            <Directory items={results} onOpen={(p)=>{ setActive(p); setMode(\"detail\"); }} />
          </div>
        )}

        {mode === "detail" && active && (<Detail p={active} onBack={()=> setMode(\"directory\")} />)}
        {mode === "event" && activeEvent && (<EventDetail ev={activeEvent} host={activeHost} onBack={()=> setMode(\"home\")} />)}
        {mode === "edit" && active && (<EditForm profile={active} onSave={saveProfile} onCancel={()=> setMode(\"home\")} />)}

        {mode === "login" && (
          <div className="max-w-md mx-auto border border-rose-100 bg-white/80 rounded-2xl p-6 shadow-sm">
            <div className="text-xl font-semibold mb-4">ログイン / 新規メール登録</div>
            <Input placeholder="メールアドレス" onKeyDown={(e)=>{ if(e.key==='Enter'){ setMe(e.currentTarget.value); setMode(\"home\"); } }} />
            <div className="mt-3 flex gap-2">
              <Button className="bg-rose-600 text-white" onClick={()=>{ const el = document.querySelector(\"input[placeholder='メールアドレス']\"); const v = el?.value?.trim(); if (!v) return; setMe(v); setMode(\"home\"); }}>続ける</Button>
              <Button onClick={()=> setMode(\"home\")}>キャンセル</Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">※ このデモではパスワードは不要です。メールはローカル保存のみで送信されません。</p>
          </div>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500 flex flex-wrap gap-4 items-center">
          <div>© {new Date().getFullYear()} make a wish 会員マッチング Demo</div>
          <div className="ml-auto">スマホ対応 / ローカル保存デモ（この端末のみ）</div>
        </div>
      </footer>
    </div>
  );
}
