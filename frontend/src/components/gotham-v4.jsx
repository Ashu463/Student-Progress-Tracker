import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GOTHAM ORBITAL v9 — CesiumJS Edition
// Photorealistic Earth · 3D orbital paths · Satellite markers · Palantir UI
// ─────────────────────────────────────────────────────────────────────────────

const SAT_CATALOG = [
  { id:"ISS",        name:"ISS (ZARYA)",      owner:"NASA/Roscosmos", color:"#00eeff", orbitColor:"#00eeff", threat:0, type:"CIVILIAN"    },
  { id:"TIANGONG",   name:"CSS Tiangong",     owner:"CNSA",           color:"#ffcc00", orbitColor:"#ffcc00", threat:1, type:"MILITARY"    },
  { id:"NOAA19",     name:"NOAA-19",          owner:"NOAA",           color:"#44ffaa", orbitColor:"#44ffaa", threat:0, type:"WEATHER"     },
  { id:"TERRA",      name:"Terra EOS AM-1",   owner:"NASA",           color:"#66ccff", orbitColor:"#66ccff", threat:0, type:"SCIENCE"     },
  { id:"AQUA",       name:"Aqua EOS PM-1",    owner:"NASA",           color:"#4488ff", orbitColor:"#4488ff", threat:0, type:"SCIENCE"     },
  { id:"SENTINEL2B", name:"Sentinel-2B",      owner:"ESA",            color:"#44ff88", orbitColor:"#44ff88", threat:0, type:"OBSERVATION" },
  { id:"STARLINK30", name:"Starlink-1007",    owner:"SpaceX",         color:"#88aacc", orbitColor:"#88aacc", threat:0, type:"COMMERCIAL"  },
  { id:"STARLINK31", name:"Starlink-2341",    owner:"SpaceX",         color:"#88aacc", orbitColor:"#88aacc", threat:0, type:"COMMERCIAL"  },
  { id:"IRIDIUM140", name:"IRIDIUM-140",      owner:"Iridium",        color:"#aabbcc", orbitColor:"#aabbcc", threat:0, type:"COMMERCIAL"  },
  { id:"GPS001",     name:"GPS IIF-2",        owner:"USAF",           color:"#bb88ff", orbitColor:"#bb88ff", threat:1, type:"NAVIGATION"  },
  { id:"GLONASS",    name:"GLONASS-M 730",    owner:"Russia",         color:"#ff4466", orbitColor:"#ff4466", threat:1, type:"NAVIGATION"  },
  { id:"COSMOS2543", name:"COSMOS-2543",      owner:"Russia",         color:"#ff1133", orbitColor:"#ff1133", threat:3, type:"MILITARY"    },
  { id:"YAOGAN30",   name:"YAOGAN-30F",       owner:"China/PLA",      color:"#ff8800", orbitColor:"#ff8800", threat:2, type:"MILITARY"    },
  { id:"LACROSSE5",  name:"USA-182",          owner:"NRO",            color:"#ff6600", orbitColor:"#ff6600", threat:2, type:"INTEL"       },
];

const THREAT_META = [
  { label:"NOMINAL",  color:"#1a7a4a", bg:"#e8f5ee", border:"#a8d8bc" },
  { label:"MONITOR",  color:"#7a6a00", bg:"#fdf7e0", border:"#d4c060" },
  { label:"ELEVATED", color:"#8a3800", bg:"#fdf0e8", border:"#d4906a" },
  { label:"CRITICAL", color:"#8a0015", bg:"#fde8ea", border:"#d46070" },
];

const SITUATIONS = [
  {
    id:"COSMOS2543",
    title:"COSMOS-2543 Kill Vehicle Activity",
    classification:"SECRET//NOFORN",
    affiliation:"Russia — VKS (Aerospace Forces)",
    affColor:"#c0192c",
    started:"Mar 15 2026",
    dossier:"Russian ASAT Program — Spring 2026",
    summary:"COSMOS-2543 has executed a series of proximity maneuvers near GPS IIF-2 (USA-230) and multiple Iridium commercial assets in low Earth orbit. Sub-satellite ejection events consistent with co-orbital ASAT testing have been detected by Space Force sensors. The object demonstrates significant delta-V capability consistent with kinetic kill vehicle deployment.",
    intel:[
      { ts:"15 Mar 12:41Z", src:"NRO/SIGINT", cls:"S", text:"COSMOS-2543 executed burn sequence at perigee, raising apogee by ~82km. New orbital plane intersects GPS IIF-2 trajectory on Mar 17–18 window." },
      { ts:"14 Mar 09:18Z", src:"DIA", cls:"S//NF", text:"Sub-satellite object designated RUS-COSMOS-2543-B detected at separation distance 400m. Object maneuverable, tracking active." },
    ],
    pattern:{ name:"Co-Orbital ASAT Sequence", status:"ACTIVE",
      units:[
        { sym:"⬦", label:"COSMOS-2543",   role:"Primary Vehicle",  count:1, color:"#c0192c" },
        { sym:"◈", label:"COSMOS-2543-B", role:"Kill Sub-Vehicle", count:1, color:"#c0192c" },
        { sym:"⬦", label:"GPS IIF-2",     role:"Target",           count:1, color:"#2a7fc1" },
      ]
    }
  },
  {
    id:"YAOGAN30",
    title:"YAOGAN-30F PLA ISR Constellation",
    classification:"SECRET",
    affiliation:"China — PLA Strategic Support Force",
    affColor:"#c14b2a",
    started:"Mar 12 2026",
    dossier:"PLA SSF Satellite Operations — Q1 2026",
    summary:"YAOGAN-30F has completed its operational insertion into a 600km sun-synchronous orbit. The constellation now provides persistent optical and SAR coverage over key US Pacific assets including Guam, Okinawa, and the Second Island Chain. Pass frequency has increased 40% since Jan 2026.",
    intel:[
      { ts:"15 Mar 08:12Z", src:"NGA", cls:"S", text:"YAOGAN-30F acquired high-resolution imagery over NAS Guam during 14 Mar 22:34Z pass. Estimated resolution sub-0.5m." },
    ],
    pattern:{ name:"ISR Constellation Coverage", status:"PERSISTENT",
      units:[
        { sym:"⬦", label:"YAOGAN-30F", role:"Imaging Sat",   count:1, color:"#c14b2a" },
        { sym:"⬦", label:"YAOGAN-30E", role:"Imaging Sat",   count:1, color:"#c14b2a" },
        { sym:"□", label:"2nd Island Chain", role:"Coverage Zone", count:1, color:"#2a7fc1" },
      ]
    }
  },
  {
    id:"ISS",
    title:"ISS Station-Keeping Operations",
    classification:"UNCLASSIFIED//FOR OFFICIAL USE ONLY",
    affiliation:"NASA / Roscosmos",
    affColor:"#2a7fc1",
    started:"Mar 10 2026",
    dossier:"ISS Operations Daily Brief",
    summary:"International Space Station continues nominal operations at 408km altitude. Current crew of 7 conducting microgravity experiments. Station has completed 3 reboost maneuvers this quarter to maintain orbital altitude. No conjunction threats above threshold.",
    intel:[
      { ts:"15 Mar 06:00Z", src:"NASA JSC", cls:"U//FOUO", text:"ISS altitude: 408.2km. Crew nominal. Next EVA scheduled Mar 20. Power systems at 98% capacity." },
    ],
    pattern:{ name:"Station Operations", status:"ROUTINE",
      units:[
        { sym:"⬦", label:"ISS", role:"Space Station", count:1, color:"#2a7fc1" },
        { sym:"▲", label:"Crew-9", role:"Crew Transport", count:1, color:"#44ffaa" },
      ]
    }
  }
];

// ── Fallback TLEs ─────────────────────────────────────────────────────────────
const FALLBACK_TLES = {
  ISS:        { line1:"1 25544U 98067A   25074.50000000  .00006000  00000-0  11000-3 0  9991", line2:"2 25544  51.6400 110.8400 0003400  85.0000 275.1000 15.49560000498765" },
  TIANGONG:   { line1:"1 48274U 21035A   25074.50000000  .00002800  00000-0  32000-4 0  9993", line2:"2 48274  41.4700 253.1200 0006100 181.0000 179.0000 15.61200000215432" },
  NOAA19:     { line1:"1 33591U 09005A   25074.50000000  .00000300  00000-0  20000-3 0  9990", line2:"2 33591  99.1200  46.2300 0013400 258.0000 101.9000 14.12400000823456" },
  TERRA:      { line1:"1 25994U 99068A   25074.50000000  .00000100  00000-0  30000-4 0  9992", line2:"2 25994  98.2100 100.5400 0001200  90.0000 270.1000 14.57300000312345" },
  AQUA:       { line1:"1 27424U 02022A   25074.50000000  .00000100  00000-0  32000-4 0  9991", line2:"2 27424  98.2000 100.1200 0001100  85.0000 275.2000 14.57300000421234" },
  SENTINEL2B: { line1:"1 42063U 17013A   25074.50000000  .00000100  00000-0  28000-4 0  9993", line2:"2 42063  98.5700 106.7800 0001100  90.0000 270.1000 14.30900000512345" },
  STARLINK30: { line1:"1 44932U 19074B   25074.50000000  .00002000  00000-0  14000-3 0  9997", line2:"2 44932  53.0500  23.4500 0001400 102.0000 258.1000 15.05600000289012" },
  STARLINK31: { line1:"1 46045U 20073C   25074.50000000  .00002100  00000-0  15000-3 0  9994", line2:"2 46045  53.0500  18.2300 0001200  98.0000 262.1000 15.05500000301234" },
  IRIDIUM140: { line1:"1 43571U 18061E   25074.50000000  .00000200  00000-0  50000-4 0  9995", line2:"2 43571  86.3900 312.4500 0002100  90.0000 270.1000 14.34200000198765" },
  GPS001:     { line1:"1 37753U 11036A   25074.50000000 -.00000100  00000-0  00000+0 0  9993", line2:"2 37753  55.4500 160.2300 0103400 245.0000 114.1000  2.00560000102345" },
  GLONASS:    { line1:"1 39155U 13015A   25074.50000000  .00000000  00000-0  00000+0 0  9991", line2:"2 39155  64.8500 212.3400 0013400 280.0000  79.9000  2.13100000187654" },
  COSMOS2543: { line1:"1 44547U 19075A   25074.50000000  .00000200  00000-0  00000+0 0  9998", line2:"2 44547  97.7700 101.2300 0012100  95.0000 265.2000 14.77200000298765" },
  YAOGAN30:   { line1:"1 43163U 18010A   25074.50000000  .00000500  00000-0  50000-4 0  9992", line2:"2 43163  35.0200  85.6700 0005600 201.0000 158.9000 15.21100000412345" },
  LACROSSE5:  { line1:"1 28646U 05016A   25074.50000000  .00000300  00000-0  00000+0 0  9990", line2:"2 28646  57.0000  92.3400 0012300 180.0000 179.9000 15.02300000301234" },
};

// ── Metal ticker ──────────────────────────────────────────────────────────────
function useMetals() {
  const [p,setP]=useState({gold:2347.80,silver:27.924,gd:0.12,sd:-0.031});
  useEffect(()=>{
    const iv=setInterval(()=>setP(prev=>({
      gold:+(prev.gold+(Math.random()-.48)*1.6).toFixed(2),
      silver:+(prev.silver+(Math.random()-.48)*.07).toFixed(3),
      gd:+((Math.random()-.48)*1.6).toFixed(2),
      sd:+((Math.random()-.48)*.07).toFixed(3),
    })),2800);
    return()=>clearInterval(iv);
  },[]);
  return p;
}

// ── Backend helpers ───────────────────────────────────────────────────────────
async function apiAgent(url,sec,groq,tav,role,msg,snap){
  const r=await fetch(`${url}/agent`,{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":sec,"x-groq-key":groq,"x-tavily-key":tav},
    body:JSON.stringify({role,user_message:msg,satellite_snapshot:snap}),
  });
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const d=await r.json();
  return d.response||d.output||d.result||d.message||JSON.stringify(d);
}

async function apiQuery(url,sec,groq,tav,query,snap){
  const r=await fetch(`${url}/intel-query`,{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":sec,"x-groq-key":groq,"x-tavily-key":tav},
    body:JSON.stringify({query,satellite_snapshot:snap}),
  });
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const d=await r.json();
  return{response:d.response||d.output||d.result||JSON.stringify(d),relevant_ids:d.relevant_ids||[]};
}

// ── SGP4 helpers ──────────────────────────────────────────────────────────────
function propagate(satrec,t){
  try{
    const pv=window.satellite.propagate(satrec,t);
    if(!pv?.position)return null;
    const gmst=window.satellite.gstime(t);
    const geo=window.satellite.eciToGeodetic(pv.position,gmst);
    return{lat:window.satellite.degreesLat(geo.latitude),lon:window.satellite.degreesLong(geo.longitude),alt:geo.height};
  }catch{return null;}
}

// Convert lat/lon/alt to Cesium Cartesian3
function toCesium(Cesium,lat,lon,altKm){
  return Cesium.Cartesian3.fromDegrees(lon, lat, altKm * 1000);
}

// ── Entity highlighting ───────────────────────────────────────────────────────
const ENTITIES_RE = ["COSMOS-2543","GPS IIF-2","YAOGAN-30F","South China Sea","PLA","PLAAF","VKS","ISS","Tiangong","NRO","SpaceX","Iridium","Guam","Okinawa"];
function HighlightText({text}){
  if(!text)return null;
  let parts=[{t:text,k:"r0"}];
  ENTITIES_RE.forEach((ent,ei)=>{
    parts=parts.flatMap((p,pi)=>{
      if(typeof p.t!=="string")return[p];
      const segs=p.t.split(new RegExp(`(${ent.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi"));
      return segs.map((s,i)=>({
        t:i%2===1?<mark key={`e${ei}p${pi}s${i}`} style={{background:"#cce3f5",color:"#1a4a7a",borderRadius:1,padding:"0 2px",fontWeight:600}}>{s}</mark>:s,
        k:`e${ei}p${pi}s${i}`,
      }));
    });
  });
  return<>{parts.map((p,i)=><span key={p.k+i}>{p.t}</span>)}</>;
}

// ── Classification banner ─────────────────────────────────────────────────────
function ClassBanner({cls}){
  const isSecret=cls?.includes("SECRET");
  const isU=cls?.includes("UNCLASSIFIED");
  const c=isSecret?"#8a0015":isU?"#1a5c2a":"#444";
  const bg=isSecret?"#fde8ea":isU?"#e8f5ee":"#f0f0f0";
  return(
    <div style={{background:bg,padding:"2px 16px",fontSize:9,letterSpacing:2,color:c,fontWeight:700,fontFamily:"monospace",textAlign:"center",borderBottom:`1px solid ${c}33`}}>
      {cls}
    </div>
  );
}

// ── MilSymbol unit ────────────────────────────────────────────────────────────
function MilUnit({sym,label,role,count,color}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{width:40,height:40,border:`2px solid ${color}`,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",background:"white",position:"relative",boxShadow:`0 1px 4px ${color}22`}}>
        <span style={{fontSize:18,color}}>{sym}</span>
        {count>1&&<div style={{position:"absolute",top:-6,right:-6,width:16,height:16,borderRadius:"50%",background:"#2a7fc1",color:"white",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{count}x</div>}
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:8,fontWeight:700,color:"#2a3540",letterSpacing:0.5}}>{label}</div>
        <div style={{fontSize:7.5,color:"#6a7a88"}}>{role}</div>
      </div>
    </div>
  );
}

// ── Section head ──────────────────────────────────────────────────────────────
function PHead({icon,title,sub,right}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 12px",background:"rgba(255,255,255,0.025)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {icon&&<span style={{fontSize:9,color:"rgba(200,216,232,0.35)"}}>{icon}</span>}
        <span style={{fontSize:8,color:"#9ab8cc",letterSpacing:1.8,fontFamily:"monospace",fontWeight:700}}>{title}</span>
        {sub&&<span style={{fontSize:7.5,color:"rgba(200,216,232,0.25)",letterSpacing:1}}>/ {sub}</span>}
      </div>
      {right}
    </div>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({a}){
  const [open,setOpen]=useState(true);
  const sc={idle:"#1e3040",running:"#4dd9a0",done:"#4ab8f5",error:"#ff4455"};
  return(
    <div style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",cursor:"pointer",borderLeft:`2px solid ${sc[a.status]}`,background:a.status==="running"?"rgba(77,217,160,0.03)":"transparent"}}>
        <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:sc[a.status],boxShadow:a.status==="running"?`0 0 7px ${sc[a.status]}`:"none",animation:a.status==="running"?"dp 1s ease-in-out infinite":"none"}}/>
        <span style={{flex:1,fontSize:8,color:"rgba(200,216,232,0.5)",letterSpacing:1.5,fontFamily:"monospace"}}>{a.name}</span>
        {a.status==="running"&&<span style={{fontSize:7.5,color:"#4dd9a0",animation:"blt .8s step-end infinite"}}>●</span>}
        <span style={{fontSize:8,color:sc[a.status],letterSpacing:1,opacity:0.7}}>{a.status.toUpperCase()}</span>
        <span style={{fontSize:7.5,color:"rgba(200,216,232,0.15)"}}>{open?"▾":"▸"}</span>
      </div>
      {open&&(
        <div style={{margin:"0 10px 6px 18px",padding:"6px 10px",background:"rgba(0,0,0,0.22)",border:"1px solid rgba(255,255,255,0.05)",fontSize:9.5,lineHeight:1.72,fontFamily:"'Courier New',monospace",color:a.status==="error"?"#ff8888":a.output?"#7aaabb":"rgba(200,216,232,0.14)",whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:150,overflowY:"auto"}}>
          {a.output||(a.status==="idle"?"— awaiting activation —":a.status==="running"?"Querying backend...":"no output")}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function GothamOrbital(){
  const cesiumContainerRef = useRef(null);
  const viewerRef          = useRef(null);
  const satEntitiesRef     = useRef({});   // cesium entity per sat
  const orbitEntitiesRef   = useRef({});   // cesium orbit path per sat
  const satrecsRef         = useRef({});
  const posRef             = useRef({});
  const selRef             = useRef(null);
  const hlRef              = useRef([]);
  const agentTimer         = useRef(null);
  const updateTimer        = useRef(null);

  const metals = useMetals();

  const [ready,     setReady]     = useState(false);
  const [tleStatus, setTleStatus] = useState("loading");
  const [bUrl,      setBUrl]      = useState("http://16.16.251.215:8080");
  const [bSec,      setBSec]      = useState("");
  const [groq,      setGroq]      = useState("");
  const [tavily,    setTavily]    = useState("");
  const [selUI,     setSelUI]     = useState(null);
  const [selPos,    setSelPos]    = useState(null);
  const [running,   setRunning]   = useState(false);
  const [cycle,     setCycle]     = useState(0);
  const [nlQ,       setNlQ]       = useState("");
  const [nlR,       setNlR]       = useState(null);
  const [nlLoad,    setNlLoad]    = useState(false);
  const [alerts,    setAlerts]    = useState([]);
  const [showCfg,   setShowCfg]   = useState(true);
  const [tab,       setTab]       = useState("summary");
  const [activeSit, setActiveSit] = useState(SITUATIONS[0]);
  const [search,    setSearch]    = useState("");
  const [clock,     setClock]     = useState("");
  const [pingOk,    setPingOk]    = useState(null);
  const [agents, setAgents] = useState([
    {id:"orbital",name:"ORBITAL MONITOR",   status:"idle",output:""},
    {id:"news",   name:"GEOPOLITICAL FEED", status:"idle",output:""},
    {id:"analyst",name:"SYNTHESIS ENGINE",  status:"idle",output:""},
  ]);

  useEffect(()=>{const iv=setInterval(()=>setClock(new Date().toUTCString()),1000);return()=>clearInterval(iv);},[]);

  const pushAlert  = useCallback((msg,lvl=1)=>setAlerts(p=>[{msg,lvl,ts:new Date().toISOString().slice(11,19)},...p].slice(0,30)),[]);
  const patchAgent = useCallback((id,patch)=>setAgents(p=>p.map(a=>a.id===id?{...a,...patch}:a)),[]);
  const setSel     = useCallback((sat)=>{selRef.current=sat;setSelUI(sat);setSelPos(null);},[]);
  const setHl      = useCallback((ids)=>{hlRef.current=ids;},[]);

  const snapshot = useCallback(()=>SAT_CATALOG.map(m=>{
    const s=satrecsRef.current[m.id];if(!s)return null;
    const p=propagate(s,new Date());if(!p)return null;
    return`${m.id}(${m.owner},T${m.threat}): lat=${p.lat.toFixed(2)} lon=${p.lon.toFixed(2)} alt=${p.alt.toFixed(0)}km`;
  }).filter(Boolean).join("\n"),[]);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    let dead=false;
    const load=(src,global)=>new Promise((res,rej)=>{
      if(global&&window[global]){res();return;}
      if(document.querySelector(`script[src="${src}"]`)&&(!global||window[global])){res();return;}
      const s=document.createElement("script");s.src=src;
      s.onload=()=>res();s.onerror=()=>rej(new Error(`Failed: ${src}`));
      document.head.appendChild(s);
    });
    const loadCss=(href)=>{
      if(document.querySelector(`link[href="${href}"]`))return;
      const l=document.createElement("link");l.rel="stylesheet";l.href=href;
      document.head.appendChild(l);
    };

    (async()=>{
      try{
        // Load satellite.js
        await load("https://cdnjs.cloudflare.com/ajax/libs/satellite.js/4.0.0/satellite.min.js","satellite");
        // Load Cesium
        loadCss("https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Widgets/widgets.css");
        await load("https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Cesium.js","Cesium");
        if(dead)return;

        // Fetch TLEs
        let tles=FALLBACK_TLES, source="fallback";
        try{
          const ctrl=new AbortController();
          const timer=setTimeout(()=>ctrl.abort(),8000);
          const r=await fetch(`${bUrl}/tles`,{headers:{"x-api-key":bSec||""},signal:ctrl.signal,mode:"cors"});
          clearTimeout(timer);
          if(r.ok){const d=await r.json();tles=d.tles;source="live";}
          else pushAlert(`TLE endpoint returned ${r.status}`,2);
        }catch(e){pushAlert(`TLE fallback: ${e.message}`,1);}

        // Parse TLEs
        let n=0;
        SAT_CATALOG.forEach(({id})=>{
          const t=tles[id];if(!t)return;
          try{satrecsRef.current[id]=window.satellite.twoline2satrec(t.line1,t.line2);n++;}
          catch(e){console.warn(id,e);}
        });

        setTleStatus(source);
        if(dead)return;

        initCesium();
        setReady(true);
        pushAlert(source==="live"?`Live TLEs — ${n} sats`:`Fallback TLEs — ${n} sats`,source==="live"?0:1);
      }catch(e){setTleStatus("error");pushAlert(`Boot: ${e.message}`,3);}
    })();

    return()=>{
      dead=true;
      if(updateTimer.current)clearInterval(updateTimer.current);
      if(agentTimer.current)clearInterval(agentTimer.current);
      if(viewerRef.current&&!viewerRef.current.isDestroyed())viewerRef.current.destroy();
    };
  },[]); // eslint-disable-line

  // ── Cesium init ───────────────────────────────────────────────────────────
  function initCesium(){
    const Cesium = window.Cesium;
    if(!Cesium||!cesiumContainerRef.current)return;

    // Suppress Ion token warning with a placeholder (not used — offline imagery only)
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc4ZTEiLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk";

    const viewer = new Cesium.Viewer(cesiumContainerRef.current,{
      baseLayerPicker:      false,
      geocoder:             false,
      homeButton:           false,
      sceneModePicker:      false,
      navigationHelpButton: false,
      animation:            false,
      timeline:             false,
      fullscreenButton:     false,
      infoBox:              false,
      selectionIndicator:   false,
      creditContainer:      document.createElement("div"),
    });
    viewerRef.current = viewer;

    // ── Fix sharpness for high-DPI screens ──
    viewer.resolutionScale = window.devicePixelRatio || 1;

    // ── Replace default imagery with blue marble from Ion, fallback to OSM ──
    viewer.imageryLayers.removeAll();
    try {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 3845 }) // Blue Marble
      );
    } catch(e) {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })
      );
    }

    // ── Scene settings ──
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#000810");
    viewer.scene.globe.enableLighting = true;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 10.0;

    // Camera initial position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(15, 20, 22000000),
      orientation:{ heading:0, pitch:-Math.PI/2, roll:0 },
    });

    // ── Auto-rotation: slowly spin the globe when user isn't interacting ──
    let isUserInteracting = false;
    viewer.scene.canvas.addEventListener("mousedown", ()=>{ isUserInteracting = true; });
    viewer.scene.canvas.addEventListener("mouseup",   ()=>{ setTimeout(()=>{ isUserInteracting = false; }, 2000); });
    viewer.scene.canvas.addEventListener("wheel",     ()=>{ isUserInteracting = true; setTimeout(()=>{ isUserInteracting = false; }, 3000); });
    viewer.clock.onTick.addEventListener(()=>{
      if(!isUserInteracting && !viewerRef.current?.isDestroyed()){
        viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.00008);
      }
    });

    // ── Add satellite entities ──
    SAT_CATALOG.forEach(meta=>{
      const pos = propagate(satrecsRef.current[meta.id], new Date());
      if(!pos)return;

      // Satellite point + billboard label
      const entity = viewer.entities.add({
        id: meta.id,
        position: toCesium(Cesium, pos.lat, pos.lon, pos.alt),
        point:{
          pixelSize: meta.threat>=2 ? 10 : 7,
          color: Cesium.Color.fromCssColorString(meta.color),
          outlineColor: Cesium.Color.fromCssColorString(meta.color+"66"),
          outlineWidth: meta.threat>=2 ? 3 : 1,
          heightReference: Cesium.HeightReference.NONE,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 2.0, 5.0e8, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 5.0e8, 0.8),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label:{
          text: meta.id,
          font: "bold 11px 'Share Tech Mono', monospace",
          fillColor: Cesium.Color.fromCssColorString(meta.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(14, -4),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 3.0e8, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 4.0e8, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: meta.threat>=1,
        },
      });
      satEntitiesRef.current[meta.id] = entity;
    });

    // ── Draw orbit paths ──
    drawOrbitPaths(Cesium, viewer);

    // ── Click handler ──
    viewer.screenSpaceEventHandler.setInputAction(movement=>{
      const picked = viewer.scene.pick(movement.position);
      if(Cesium.defined(picked)&&picked.id){
        const id = picked.id.id || picked.id;
        const meta = SAT_CATALOG.find(m=>m.id===id);
        if(meta){
          setSel(meta.id===selRef.current?.id?null:meta);
          const sit = SITUATIONS.find(s=>s.id===meta.id);
          if(sit){setActiveSit(sit);setTab("summary");}
          highlightSat(Cesium, meta.id);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ── Start position update loop ──
    updateTimer.current = setInterval(()=>updatePositions(Cesium, viewer), 1000);
  }

  function drawOrbitPaths(Cesium, viewer){
    SAT_CATALOG.forEach(meta=>{
      const satrec = satrecsRef.current[meta.id];
      if(!satrec)return;

      // Generate one full orbit of positions
      const period = getPeriodMinutes(satrec);
      const steps  = 120;
      const nowMs  = Date.now();
      const positions = [];

      for(let i=0;i<=steps;i++){
        const t = new Date(nowMs + (i/steps)*period*60*1000);
        const p = propagate(satrec, t);
        if(p) positions.push(toCesium(Cesium, p.lat, p.lon, p.alt));
      }

      if(positions.length < 2)return;

      const isHighThreat = meta.threat>=2;
      orbitEntitiesRef.current[meta.id] = viewer.entities.add({
        id: `orbit_${meta.id}`,
        polyline:{
          positions,
          width: isHighThreat ? 1.5 : 0.8,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: isHighThreat ? 0.25 : 0.12,
            color: Cesium.Color.fromCssColorString(meta.orbitColor + (isHighThreat?"cc":"55")),
          }),
          arcType: Cesium.ArcType.NONE,
          clampToGround: false,
        },
      });
    });
  }

  function getPeriodMinutes(satrec){
    // Period from mean motion (revs/day)
    const n = satrec.no * (1440 / (2*Math.PI)); // rev/day
    return 1440 / n; // minutes
  }

  function updatePositions(Cesium, viewer){
    const now = new Date();
    SAT_CATALOG.forEach(meta=>{
      const satrec = satrecsRef.current[meta.id];
      if(!satrec)return;
      const p = propagate(satrec, now);
      if(!p)return;
      posRef.current[meta.id] = p;

      const entity = satEntitiesRef.current[meta.id];
      if(entity){
        entity.position = new Cesium.ConstantPositionProperty(toCesium(Cesium, p.lat, p.lon, p.alt));
      }

      // Update selected position
      if(selRef.current?.id===meta.id){
        setSelPos({...p});
      }
    });

    // Redraw orbit paths every 60s (they drift)
    if(Math.floor(Date.now()/1000)%60===0){
      // Remove old orbits
      Object.values(orbitEntitiesRef.current).forEach(e=>{
        if(e&&!e.isDestroyed)viewer.entities.remove(e);
      });
      orbitEntitiesRef.current={};
      drawOrbitPaths(Cesium, viewer);
    }
  }

  function highlightSat(Cesium, satId){
    // Reset all, highlight selected
    SAT_CATALOG.forEach(meta=>{
      const entity = satEntitiesRef.current[meta.id];
      if(!entity)return;
      const isSel  = meta.id===satId;
      const isHl   = hlRef.current.includes(meta.id);
      entity.point.pixelSize     = isSel?16:isHl?12:meta.threat>=2?10:7;
      entity.point.color         = isSel
        ? Cesium.Color.WHITE
        : Cesium.Color.fromCssColorString(meta.color);
      entity.label.show          = isSel||isHl||meta.threat>=1;
      entity.label.scale         = isSel?1.4:1;
      // Orbit line width
      const orb = orbitEntitiesRef.current[meta.id];
      if(orb&&orb.polyline) orb.polyline.width = isSel?2.5:isHl?1.5:meta.threat>=2?1.5:0.8;
    });
  }

  function flyToSat(satId){
    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    if(!Cesium||!viewer)return;
    const p = posRef.current[satId];
    if(!p)return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt*1000+3000000),
      orientation:{ heading:0, pitch:-Math.PI/3, roll:0 },
      duration: 2,
    });
  }

  function flyHome(){
    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    if(!Cesium||!viewer)return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(15,20,22000000),
      orientation:{ heading:0, pitch:-Math.PI/2, roll:0 },
      duration:2,
    });
  }

  // ── Retry TLE ─────────────────────────────────────────────────────────────
  const retryTle = useCallback(async()=>{
    setTleStatus("loading");
    try{
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),8000);
      const r=await fetch(`${bUrl}/tles`,{headers:{"x-api-key":bSec||""},signal:ctrl.signal,mode:"cors"});
      clearTimeout(timer);
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const{tles}=await r.json();
      let n=0;
      SAT_CATALOG.forEach(({id})=>{
        const t=tles[id];if(!t)return;
        try{satrecsRef.current[id]=window.satellite.twoline2satrec(t.line1,t.line2);n++;}
        catch(e){console.warn(id,e);}
      });
      setTleStatus("live");
      pushAlert(`Live TLEs reloaded — ${n} sats`,0);
    }catch(e){
      setTleStatus("fallback");
      pushAlert(`Retry failed: ${e.message}`,2);
    }
  },[bUrl,bSec,pushAlert]);

  // ── Agent monitor ─────────────────────────────────────────────────────────
  const startMonitor=useCallback(async()=>{
    if(running)return;
    setRunning(true);let c=cycle;
    const runCycle=async()=>{
      c++;setCycle(c);
      const snap=snapshot();
      fetch(`${bUrl}/ingest`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":bSec,"x-groq-key":groq},body:JSON.stringify({snapshot:snap,cycle:c})}).catch(()=>{});
      for(const role of["orbital","news","analyst"]){
        patchAgent(role,{status:"running",output:""});
        try{
          const out=await apiAgent(bUrl,bSec,groq,tavily,role,`Cycle ${c}`,snap);
          patchAgent(role,{status:"done",output:out});
          const m=out.match(/RELEVANT[_ ]OBJECTS?:?\s*([A-Z0-9,\s_\-]+)/i);
          if(m){
            const ids=m[1].split(/[,\s]+/).map(s=>s.trim()).filter(s=>s.length>2);
            setHl(ids);
            if(window.Cesium&&viewerRef.current) highlightSat(window.Cesium, selRef.current?.id||"");
          }
          pushAlert(`${role.toUpperCase()} cycle ${c} complete`,0);
        }catch(e){
          patchAgent(role,{status:"error",output:`Error: ${e.message}`});
          pushAlert(`${role} error: ${e.message}`,2);
        }
      }
    };
    await runCycle();
    agentTimer.current=setInterval(runCycle,90000);
  },[running,cycle,bUrl,bSec,groq,tavily,snapshot,patchAgent,setHl,pushAlert]);

  const stopMonitor=useCallback(()=>{
    setRunning(false);
    if(agentTimer.current)clearInterval(agentTimer.current);
    setHl([]);
    setAgents(p=>p.map(a=>({...a,status:"idle"})));
  },[setHl]);

  const handleNL=useCallback(async()=>{
    if(!nlQ.trim()||nlLoad)return;
    setNlLoad(true);setNlR(null);
    try{
      const{response,relevant_ids}=await apiQuery(bUrl,bSec,groq,tavily,nlQ,snapshot());
      setNlR(response);
      if(relevant_ids?.length){
        setHl(relevant_ids);
        if(window.Cesium&&viewerRef.current) highlightSat(window.Cesium,"");
      }
    }catch(e){setNlR(`Error: ${e.message}`);}
    setNlLoad(false);
  },[nlQ,nlLoad,bUrl,bSec,groq,tavily,snapshot,setHl]);

  const filteredSats=SAT_CATALOG.filter(m=>
    search===""||m.id.toLowerCase().includes(search.toLowerCase())||
    m.name.toLowerCase().includes(search.toLowerCase())||
    m.owner.toLowerCase().includes(search.toLowerCase())
  );

  // ── Position row ──────────────────────────────────────────────────────────
  function PosRow({m}){
    const [,setT]=useState(0);
    useEffect(()=>{const iv=setInterval(()=>setT(n=>n+1),1500);return()=>clearInterval(iv);},[]);
    const p=posRef.current[m.id];
    const sel=selUI?.id===m.id;
    return(
      <div onClick={()=>{
        setSel(sel?null:m);
        if(!sel){
          const sit=SITUATIONS.find(s=>s.id===m.id);
          if(sit){setActiveSit(sit);setTab("summary");}
          if(window.Cesium&&viewerRef.current) highlightSat(window.Cesium,m.id);
        }
      }} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",cursor:"pointer",background:sel?"rgba(42,127,193,0.07)":"transparent",borderBottom:"1px solid #e8ecf0",borderLeft:`3px solid ${sel?m.color:"transparent"}`,transition:"background 0.1s"}}>
        <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:m.color,boxShadow:`0 0 3px ${m.color}88`}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:sel?"#1a4a7a":"#1e2830",letterSpacing:0.3}}>{m.id}</div>
          <div style={{fontSize:9.5,color:"#6a7a88",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.owner}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          {p&&<div style={{fontSize:9,color:"#4a5a68",fontFamily:"monospace"}}>{p.alt.toFixed(0)}km</div>}
          <span style={{fontSize:7.5,letterSpacing:0.5,padding:"1px 5px",background:"#f0f4f8",border:"1px solid #d0d8e0",color:"#4a5a68",borderRadius:2,fontWeight:600,display:"inline-block",marginTop:1}}>{m.type.slice(0,4)}</span>
        </div>
      </div>
    );
  }

  const sit = activeSit;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0a0e14",color:"#c8d8e8",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes dp{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes blt{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
        *{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(77,180,220,.08) transparent}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(77,180,220,.1);border-radius:1px}
        ::-webkit-scrollbar-track{background:transparent}
        /* Hide Cesium credits */
        .cesium-widget-credits{display:none!important}
        .cesium-credit-logoContainer{display:none!important}
        .cesium-viewer-bottom{display:none!important}
        .tbtn{background:transparent;border:1px solid rgba(200,216,232,0.14);color:rgba(200,216,232,0.5);font-family:'Share Tech Mono',monospace;font-size:8.5px;letter-spacing:1.5px;padding:3px 10px;border-radius:1px;cursor:pointer;transition:all .15s}
        .tbtn:hover{border-color:rgba(77,217,160,0.45);color:#4dd9a0;background:rgba(77,217,160,0.06)}
        .tbtn.active{border-color:rgba(77,217,160,0.6);color:#4dd9a0;background:rgba(77,217,160,0.1)}
        .tbtn.danger{border-color:rgba(255,68,85,0.45);color:#ff5566}
        .tbtn.danger:hover{background:rgba(255,68,85,0.1);border-color:#ff5566}
        .tbtn:disabled{opacity:.18;cursor:not-allowed}
        .kin{background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);color:#9ab8cc;font-family:'Share Tech Mono',monospace;font-size:8.5px;padding:3px 8px;border-radius:1px;outline:none;transition:border-color .15s}
        .kin:focus{border-color:rgba(77,217,160,0.3)}
        .kin::placeholder{color:rgba(200,216,232,0.1)}
        .ltbtn{background:transparent;border:none;border-bottom:2px solid transparent;padding:7px 12px;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-size:10px;font-weight:500;color:rgba(200,216,232,0.3);transition:all .15s}
        .ltbtn:hover{color:rgba(200,216,232,0.65)}
        .ltbtn.on{color:#c8d8e8;border-bottom-color:#4dd9a0}
        .dtab{background:transparent;border:none;border-bottom:2px solid transparent;padding:7px 10px;cursor:pointer;font-size:10px;font-weight:500;color:#5a6a78;transition:all .14px;font-family:'Inter',system-ui,sans-serif}
        .dtab:hover{color:#1e2830}
        .dtab.on{color:#1a4a7a;border-bottom-color:#2a7fc1;font-weight:600}
        .qin{background:#fff;border:1px solid #d0d8e0;color:#1e2830;font-size:11px;padding:7px 10px;border-radius:3px;outline:none;flex:1;transition:border-color .15s;font-family:'Inter',system-ui,sans-serif}
        .qin:focus{border-color:#2a7fc1;box-shadow:0 0 0 2px rgba(42,127,193,0.12)}
        .qin::placeholder{color:#a0acb8}
        .wpbtn{background:#fff;border:1px solid #d0d8e0;color:#3a4a58;font-size:11px;font-weight:500;padding:4px 12px;border-radius:3px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;font-family:'Inter',system-ui,sans-serif}
        .wpbtn:hover{background:#f0f4f8;border-color:#aabccc;color:#1a2a38}
        .wpbtn.primary{background:#2a7fc1;border-color:#2a7fc1;color:#fff}
        .wpbtn.primary:hover{background:#1a6aaa}
        .wpbtn.danger{border-color:#c0192c;color:#c0192c}
        .wpbtn.danger:hover{background:#fde8ea}
        .wpbtn:disabled{opacity:.3;cursor:not-allowed}
        .zb{width:28px;height:28px;background:rgba(6,10,18,0.85);border:1px solid rgba(200,216,232,0.15);color:rgba(200,216,232,0.5);border-radius:2px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:monospace}
        .zb:hover{border-color:rgba(77,217,160,0.5);color:#4dd9a0;background:rgba(77,217,160,0.08)}
        .sin{background:#fff;border:1px solid #d0d8e0;border-radius:3px;padding:6px 10px 6px 28px;font-size:11px;color:#1e2830;outline:none;width:100%;transition:border-color .15s;font-family:'Inter',system-ui,sans-serif}
        .sin:focus{border-color:#2a7fc1;box-shadow:0 0 0 2px rgba(42,127,193,0.12)}
        .sin::placeholder{color:#a0acb8}
        /* Fix Cesium canvas */
        #cesium-container{width:100%;height:100%}
        #cesium-container canvas{width:100%!important;height:100%!important}
      `}</style>

      {/* ══ DARK TOPBAR ══════════════════════════════════════════════════════ */}
      <div style={{height:40,flexShrink:0,background:"linear-gradient(180deg,#1e2a38 0%,#141e2c 100%)",borderBottom:"1px solid #0a1218",display:"flex",alignItems:"center",gap:0,padding:"0 12px"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:9,paddingRight:14,borderRight:"1px solid rgba(255,255,255,0.07)",marginRight:12}}>
          <div style={{width:24,height:24,border:"1px solid rgba(77,217,160,0.32)",borderRadius:1,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(77,217,160,0.05)",flexShrink:0}}>
            <span style={{fontSize:11,color:"#4dd9a0"}}>◈</span>
          </div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,color:"#c8d8e8",letterSpacing:3.5,fontWeight:700,lineHeight:1}}>GOTHAM ORBITAL</div>
            <div style={{fontSize:6.5,color:"rgba(200,216,232,0.2)",letterSpacing:3,marginTop:1}}>INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:4,marginRight:12,paddingRight:12,borderRight:"1px solid rgba(255,255,255,0.07)"}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>ORBITAL SITUATIONS</span>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>›</span>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.65)",fontWeight:500}}>{sit?.title?.slice(0,30)||"—"}</span>
        </div>

        {/* Status dots */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:12,paddingRight:12,borderRight:"1px solid rgba(255,255,255,0.07)"}}>
          {[
            {l:"SGP4",  ok:ready},
            {l:"TLE",   ok:tleStatus==="live", warn:tleStatus==="fallback"},
            {l:"CESIUM",ok:ready},
            {l:"AGENTS",ok:running},
          ].map(s=>(
            <div key={s.l} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:4,height:4,borderRadius:"50%",background:s.ok?"#4dd9a0":s.warn?"#f0c040":"rgba(255,255,255,0.12)",boxShadow:s.ok?"0 0 5px #4dd9a055":s.warn?"0 0 5px #f0c04055":""}}/>
              <span style={{fontSize:7.5,color:s.ok?"rgba(77,217,160,0.8)":s.warn?"rgba(240,192,64,0.7)":"rgba(255,255,255,0.2)",letterSpacing:0.5,fontFamily:"monospace"}}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Metal prices */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginRight:12,paddingRight:12,borderRight:"1px solid rgba(255,255,255,0.07)"}}>
          {[{sym:"GOLD",val:metals.gold,d:metals.gd,c:"#f0c040",dp:2},{sym:"SILVER",val:metals.silver,d:metals.sd,c:"#aabccc",dp:3}].map(m=>(
            <div key={m.sym} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:4,height:4,borderRadius:"50%",background:m.c,boxShadow:`0 0 4px ${m.c}88`}}/>
              <span style={{fontSize:7,color:"rgba(200,216,232,0.28)",letterSpacing:1.5,fontFamily:"monospace"}}>{m.sym}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:13,color:m.c}}>
                ${m.val.toLocaleString("en",{minimumFractionDigits:m.dp,maximumFractionDigits:m.dp})}
              </span>
              <span style={{fontSize:8,color:m.d>=0?"#4dd9a0":"#ff6666",fontFamily:"monospace"}}>{m.d>=0?"▲":"▼"}{Math.abs(m.d).toFixed(m.dp)}</span>
            </div>
          ))}
        </div>

        {/* Keys + controls */}
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <input className="kin" type="password" placeholder="Groq key" value={groq} onChange={e=>setGroq(e.target.value)} style={{width:120}}/>
          <input className="kin" type="password" placeholder="Tavily key" value={tavily} onChange={e=>setTavily(e.target.value)} style={{width:110}}/>
          {!running
            ?<button className="tbtn active" onClick={startMonitor} disabled={!ready||!groq}>▶ INITIATE</button>
            :<button className="tbtn danger" onClick={stopMonitor}>■ HALT</button>
          }
          <button className="tbtn" onClick={()=>setShowCfg(s=>!s)} style={{padding:"3px 7px"}}>⚙</button>
        </div>

        <div style={{marginLeft:"auto",textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:7,color:"rgba(200,216,232,0.2)",letterSpacing:1,fontFamily:"monospace"}}>{clock}</div>
          <div style={{fontSize:7,color:running?"#4dd9a0":"rgba(200,216,232,0.14)",letterSpacing:2,fontFamily:"monospace"}}>
            CYCLE {String(cycle).padStart(4,"0")} {running?"● LIVE":"○ IDLE"}
          </div>
        </div>
      </div>

      {/* Config bar */}
      {showCfg&&(
        <div style={{padding:"7px 14px",background:"#0f1822",borderBottom:"1px solid rgba(240,192,64,0.12)",display:"flex",alignItems:"flex-end",gap:10,flexShrink:0,flexWrap:"wrap"}}>
          <span style={{fontSize:8,color:"rgba(240,192,64,0.5)",letterSpacing:2,alignSelf:"center"}}>⚙ CONFIG</span>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <label style={{fontSize:7,color:"rgba(200,216,232,0.22)",letterSpacing:1.5}}>BACKEND URL</label>
            <input className="kin" style={{width:280}} value={bUrl} onChange={e=>setBUrl(e.target.value)} placeholder=""/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <label style={{fontSize:7,color:"rgba(200,216,232,0.22)",letterSpacing:1.5}}>SECRET</label>
            <input className="kin" type="password" style={{width:150}} value={bSec} onChange={e=>setBSec(e.target.value)} placeholder="optional"/>
          </div>
          <button className="tbtn" onClick={async()=>{
            try{const r=await fetch(`${bUrl}/health`,{headers:{"x-api-key":bSec}});setPingOk(r.ok);pushAlert(r.ok?"Backend reachable":"non-200",r.ok?0:2);}
            catch(e){setPingOk(false);pushAlert(`Unreachable: ${e.message}`,3);}
          }}>PING</button>
          {pingOk!==null&&<span style={{fontSize:8,color:pingOk?"#4dd9a0":"#ff4455",letterSpacing:1}}>{pingOk?"● CONNECTED":"● UNREACHABLE"}</span>}
          <button className="tbtn" onClick={retryTle} style={{marginLeft:8}}>↻ RETRY TLEs</button>
          {tleStatus!=="live"&&<span style={{fontSize:8,color:"rgba(240,192,64,0.6)",letterSpacing:1}}>TLE: {tleStatus.toUpperCase()}</span>}
        </div>
      )}

      {/* ══ MAIN — sidebar + left panel + cesium ═══════════════════════════ */}
      <div style={{flex:1,display:"flex",minHeight:0}}>

        {/* Icon sidebar */}
        <div style={{width:44,flexShrink:0,background:"#111822",borderRight:"1px solid #0a1218",display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0",gap:2}}>
          {[{icon:"◉",title:"Globe",active:true},{icon:"▤",title:"Catalog"},{icon:"⚡",title:"Alerts"},{icon:"◈",title:"Objects"},{icon:"⬡",title:"Network"},{icon:"◎",title:"Analysis"}].map((item,i)=>(
            <button key={i} title={item.title} style={{width:32,height:32,background:item.active?"rgba(42,127,193,0.22)":"transparent",border:`1px solid ${item.active?"rgba(42,127,193,0.45)":"transparent"}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:item.active?"#7ec4f0":"rgba(255,255,255,0.2)",fontSize:13,transition:"all .15s"}}
              onMouseEnter={e=>{if(!item.active){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}}
              onMouseLeave={e=>{if(!item.active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.2)";}}}
            >{item.icon}</button>
          ))}
          <div style={{flex:1}}/>
          {[{icon:"⚙"},{icon:"?"}].map((item,i)=>(
            <button key={i} style={{width:32,height:32,background:"transparent",border:"1px solid transparent",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.18)",fontSize:13,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.45)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.18)";}}
            >{item.icon}</button>
          ))}
        </div>

        {/* Left panel */}
        <div style={{width:310,flexShrink:0,background:"#fff",borderRight:"1px solid #d8e0e8",display:"flex",flexDirection:"column",minHeight:0,boxShadow:"2px 0 8px rgba(0,0,0,0.12)"}}>

          {/* Situation header */}
          {sit&&(
            <div style={{flexShrink:0}}>
              <ClassBanner cls={sit.classification}/>
              <div style={{padding:"10px 14px 0"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,paddingBottom:8}}>
                  <div style={{width:44,height:44,background:"#f0f4f8",border:"1px solid #d0d8e0",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:20,color:"#4a6a88"}}>🛰</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:7.5,color:"#8a9aaa",letterSpacing:1.5,marginBottom:2}}>ORBITAL SITUATIONS</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e2830",lineHeight:1.2}}>{sit.title}</div>
                    <div style={{fontSize:10,color:"#6a7a88",marginTop:2}}>Situation</div>
                  </div>
                  <button className="wpbtn primary" style={{fontSize:10,padding:"4px 10px",flexShrink:0}}>Explore plans</button>
                </div>
                {/* Tabs */}
                <div style={{display:"flex",gap:0,borderTop:"1px solid #eef1f4"}}>
                  {["summary","intel","agents","query","properties"].map(t=>(
                    <button key={t} className={`dtab ${tab===t?"on":""}`} onClick={()=>setTab(t)} style={{fontSize:10,padding:"6px 9px",textTransform:"capitalize"}}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{padding:"7px 12px",borderBottom:"1px solid #eef1f4",flexShrink:0,position:"relative"}}>
            <span style={{position:"absolute",left:20,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#a0acb8",pointerEvents:"none"}}>🔍</span>
            <input className="sin" placeholder="Filter by satellite ID, owner..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* SUMMARY TAB */}
          {tab==="summary"&&sit&&(
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4"}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:3,height:10,background:"#2a7fc1",borderRadius:1,display:"inline-block"}}/>DETAILS
                </div>
                <div style={{display:"flex",gap:10,marginBottom:8}}>
                  <div style={{width:80,height:60,background:"linear-gradient(135deg,#0a1828 0%,#1a3048 50%,#0a2038 100%)",border:"1px solid #d0d8e0",borderRadius:2,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{textAlign:"center"}}><div style={{fontSize:20}}>🛰️</div><div style={{fontSize:7,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>{sit.id}</div></div>
                  </div>
                  <div style={{flex:1}}>
                    {[
                      ["Affiliation",<span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,background:sit.affColor,borderRadius:1,display:"inline-block"}}/>{sit.affiliation}</span>],
                      ["Expected start",sit.started],
                      ["Dossier",<span style={{color:"#2a7fc1",cursor:"pointer"}}>📄 {sit.dossier}</span>],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                        <div style={{fontSize:10,color:"#6a7a88",width:88,flexShrink:0}}>{k}</div>
                        <div style={{fontSize:10,color:"#1e2830",fontWeight:500,flex:1}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",padding:"8px 14px 5px",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:3,height:10,background:"#2a7fc1",borderRadius:1,display:"inline-block"}}/>TRACKED OBJECTS
                </div>
                {filteredSats.map(m=><PosRow key={m.id} m={m}/>)}
              </div>
            </div>
          )}

          {/* INTEL TAB */}
          {tab==="intel"&&sit&&(
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {sit.intel.map((item,i)=>(
                <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:30,height:30,background:"#f0f4f8",border:"1px solid #d0d8e0",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📋</div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:"#1e2830"}}>INTEL REPORT — {item.cls}</div>
                      <div style={{fontSize:9.5,color:"#6a7a88"}}>Source: {item.src}</div>
                    </div>
                    <div style={{marginLeft:"auto",fontSize:9,color:"#8a9aaa",fontFamily:"monospace"}}>{item.ts}</div>
                  </div>
                  <div style={{fontSize:10,lineHeight:1.78,color:"#2a3a48"}}><HighlightText text={item.text}/></div>
                </div>
              ))}
              <div style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4"}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8.5,color:"#4a5a68",letterSpacing:0.5,marginBottom:8,padding:"3px 6px",background:"#f8fafc",border:"1px solid #e8ecf0",borderRadius:2}}>(U) NOTIONAL DATA — ORBITAL INTELLIGENCE ANALYSIS</div>
                <div style={{fontSize:10,lineHeight:1.82,color:"#2a3a48"}}><HighlightText text={sit.summary}/></div>
              </div>
            </div>
          )}

          {/* AGENTS TAB */}
          {tab==="agents"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{flex:1,overflowY:"auto",minHeight:0,background:"#0b0f17"}}>
                <div style={{padding:"6px 10px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:7.5,color:"rgba(200,216,232,0.3)",letterSpacing:2,fontFamily:"monospace"}}>AGENT NETWORK</span>
                  {running&&<span style={{fontSize:7.5,color:"#4dd9a0",letterSpacing:1,animation:"dp 1.2s infinite",fontFamily:"monospace"}}>● LIVE</span>}
                </div>
                {agents.map(a=><AgentCard key={a.id} a={a}/>)}
              </div>
              <div style={{height:140,overflowY:"auto",flexShrink:0,background:"#0b0f17",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{padding:"5px 10px 4px",fontSize:7.5,color:"rgba(200,216,232,0.25)",letterSpacing:2,fontFamily:"monospace",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>ALERTS</div>
                {alerts.length===0?<div style={{padding:"8px 12px",fontSize:9,color:"rgba(200,216,232,0.12)",fontStyle:"italic"}}>no alerts</div>
                :alerts.slice(0,10).map((a,i)=>(
                  <div key={i} style={{padding:"3px 10px",fontSize:8.5,borderLeft:`2px solid ${THREAT_META[a.lvl].color}`,background:THREAT_META[a.lvl].bg,margin:"0 8px 2px",color:"#3a4a58"}}>
                    <span style={{color:THREAT_META[a.lvl].color,fontSize:7,display:"block",fontFamily:"monospace"}}>{a.ts}</span>
                    {a.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUERY TAB */}
          {tab==="query"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4",flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:8}}>⌕ INTEL QUERY</div>
                <div style={{display:"flex",gap:6,marginBottom:7}}>
                  <input className="qin" placeholder="Query satellite intelligence..." value={nlQ} onChange={e=>setNlQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleNL()}/>
                  <button className="wpbtn primary" style={{flexShrink:0,fontSize:10,padding:"5px 10px"}} onClick={handleNL} disabled={nlLoad||!nlQ.trim()}>
                    {nlLoad?"…":"⌕"}
                  </button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {["Where is the ISS?","Military sats over ME?","COSMOS-2543 status?","Proximity threats?"].map(q=>(
                    <button key={q} onClick={()=>setNlQ(q)} className="wpbtn" style={{fontSize:9,padding:"2px 7px"}}>{q}</button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"10px 14px",minHeight:0}}>
                {nlLoad?<div style={{display:"flex",gap:8,alignItems:"center",color:"#2a7fc1",fontSize:10}}><div style={{width:14,height:14,border:"2px solid #d0d8e0",borderTop:"2px solid #2a7fc1",borderRadius:"50%",animation:"spin .8s linear infinite",flexShrink:0}}/>Querying...</div>
                :nlR?<div style={{fontSize:10,lineHeight:1.82,color:"#1e2830",whiteSpace:"pre-wrap",wordBreak:"break-word"}}><HighlightText text={nlR}/></div>
                :<div style={{fontSize:9.5,color:"#a0acb8",fontStyle:"italic"}}>Enter a query to interrogate satellite intelligence...</div>}
              </div>
            </div>
          )}

          {/* PROPERTIES TAB */}
          {tab==="properties"&&sit&&(()=>{
            const m=SAT_CATALOG.find(s=>s.id===sit.id);
            const p=posRef.current[sit.id];
            return(
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px",minHeight:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:10}}>SATELLITE PROPERTIES</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {[["Object ID",m?.id||"—"],["Name",m?.name||"—"],["Owner",m?.owner||"—"],["Type",m?.type||"—"],["Latitude",p?`${p.lat.toFixed(4)}°`:"—"],["Longitude",p?`${p.lon.toFixed(4)}°`:"—"],["Altitude",p?`${p.alt.toFixed(1)} km`:"—"],["Period",m&&satrecsRef.current[m.id]?`${getPeriodMinutes(satrecsRef.current[m.id]).toFixed(1)} min`:"—"]].map(([k,v])=>(
                    <div key={k} style={{background:"#f8fafc",border:"1px solid #e8ecf0",borderRadius:2,padding:"7px 10px"}}>
                      <div style={{fontSize:8,color:"#8a9aaa",letterSpacing:1,marginBottom:2,textTransform:"uppercase"}}>{k}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#1e2830"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Cesium viewport + right panel ──────────────────────────── */}
        <div style={{flex:1,display:"flex",minHeight:0}}>

          {/* Cesium */}
          <div style={{flex:1,position:"relative",overflow:"hidden",background:"#000810"}}>
            <div id="cesium-container" ref={cesiumContainerRef} style={{width:"100%",height:"100%"}}/>

            {/* Loading overlay */}
            {!ready&&(
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(5,10,18,0.97)",zIndex:10}}>
                {tleStatus==="loading"
                  ?<div style={{width:44,height:44,border:"1px solid rgba(42,127,193,0.25)",borderTop:"1px solid #2a7fc1",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}}/>
                  :<div style={{fontSize:30,marginBottom:16,opacity:0.4}}>⚠</div>
                }
                <div style={{fontSize:11,color:"rgba(42,127,193,0.65)",letterSpacing:3,fontFamily:"'Share Tech Mono',monospace",marginBottom:8}}>
                  {tleStatus==="loading"?"INITIALIZING CESIUM...":`TLE STATUS: ${tleStatus.toUpperCase()}`}
                </div>
                {(tleStatus==="fallback"||tleStatus==="error")&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{fontSize:9,color:"rgba(200,216,232,0.35)",letterSpacing:1,fontFamily:"monospace"}}>{bUrl}/tles</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={retryTle} style={{background:"rgba(42,127,193,0.15)",border:"1px solid rgba(42,127,193,0.4)",color:"#7ec4f0",fontSize:10,padding:"5px 16px",cursor:"pointer",borderRadius:2,letterSpacing:1,fontFamily:"'Share Tech Mono',monospace"}}>↻ RETRY</button>
                      <button onClick={()=>setReady(true)} style={{background:"rgba(77,217,160,0.1)",border:"1px solid rgba(77,217,160,0.3)",color:"#4dd9a0",fontSize:10,padding:"5px 16px",cursor:"pointer",borderRadius:2,letterSpacing:1,fontFamily:"'Share Tech Mono',monospace"}}>▶ CONTINUE</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Camera controls */}
            <div style={{position:"absolute",right:12,top:12,display:"flex",flexDirection:"column",gap:4,zIndex:5}}>
              <button className="zb" onClick={flyHome} title="Home view">⌂</button>
              {selUI&&selPos&&<button className="zb" onClick={()=>flyToSat(selUI.id)} title="Fly to satellite">🎯</button>}
              <button className="zb" title="Tilt up" onClick={()=>{
                const v=viewerRef.current;if(!v)return;
                v.camera.rotateUp(0.3);
              }}>▲</button>
              <button className="zb" title="Tilt down" onClick={()=>{
                const v=viewerRef.current;if(!v)return;
                v.camera.rotateDown(0.3);
              }}>▼</button>
            </div>

            {/* Selected sat HUD */}
            {selUI&&selPos&&(
              <div style={{position:"absolute",top:12,left:12,zIndex:5,background:"rgba(5,10,18,0.94)",border:`1px solid ${selUI.color}28`,borderLeft:`2px solid ${selUI.color}`,borderRadius:2,padding:"10px 14px",minWidth:200,boxShadow:`0 0 30px ${selUI.color}10`,animation:"fadein .2s ease"}}>
                <div style={{fontSize:7,color:selUI.color+"88",letterSpacing:2.5,marginBottom:3,fontFamily:"monospace"}}>◈ LIVE TRACK // CESIUM+SGP4</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:selUI.color,letterSpacing:1,marginBottom:7}}>{selUI.name}</div>
                {[["LAT",`${selPos.lat.toFixed(4)}°`],["LON",`${selPos.lon.toFixed(4)}°`],["ALT",`${selPos.alt.toFixed(1)} km`],["TYPE",selUI.type],["OWNER",selUI.owner]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:2}}>
                    <span style={{fontSize:8,color:"rgba(200,216,232,0.28)",letterSpacing:1,fontFamily:"monospace"}}>{k}</span>
                    <span style={{fontSize:9,color:"#a8c8d8",fontFamily:"monospace"}}>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:5,marginTop:8}}>
                  <button className="tbtn" style={{flex:1,fontSize:8,padding:"3px 5px"}} onClick={()=>flyToSat(selUI.id)}>🎯 ZOOM</button>
                  <button className="tbtn" style={{flex:1,fontSize:8,padding:"3px 5px"}} onClick={()=>setSel(null)}>✕ CLEAR</button>
                </div>
              </div>
            )}

            {/* Sat quick-select strip */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(5,10,18,0.9)",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"4px 10px",display:"flex",flexWrap:"wrap",gap:3,zIndex:5}}>
              {SAT_CATALOG.map(m=>(
                <span key={m.id} onClick={()=>{
                  const sel=selUI?.id===m.id;
                  setSel(sel?null:m);
                  if(!sel){
                    const sit2=SITUATIONS.find(s=>s.id===m.id);
                    if(sit2){setActiveSit(sit2);setTab("summary");}
                    if(window.Cesium&&viewerRef.current) highlightSat(window.Cesium,m.id);
                  }
                }} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 7px",borderRadius:2,fontSize:8,letterSpacing:1,cursor:"pointer",border:`1px solid ${selUI?.id===m.id?m.color+"77":m.color+"22"}`,color:selUI?.id===m.id?m.color:m.color+"66",background:selUI?.id===m.id?m.color+"10":"transparent",transition:"all .1s",fontFamily:"monospace"}}>
                  <span style={{width:4,height:4,borderRadius:"50%",background:"currentColor",display:"inline-block",flexShrink:0}}/>
                  {m.id}
                </span>
              ))}
              <span style={{marginLeft:"auto",fontSize:7,color:"rgba(200,216,232,0.15)",alignSelf:"center",letterSpacing:1}}>DRAG · SCROLL · CLICK SAT</span>
            </div>
          </div>

          {/* Right panel */}
          <div style={{width:280,flexShrink:0,background:"#fff",borderLeft:"1px solid #d8e0e8",display:"flex",flexDirection:"column",minHeight:0,boxShadow:"-2px 0 8px rgba(0,0,0,0.08)"}}>
            {sit&&(<>
              {/* Doctrinal pattern */}
              <div style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4",flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:3,height:10,background:"#8a3800",borderRadius:1,display:"inline-block"}}/>DOCTRINAL PATTERN</span>
                  <button className="wpbtn" style={{fontSize:9,padding:"2px 8px",color:"#2a7fc1",borderColor:"rgba(42,127,193,0.3)"}}>Explore</button>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#1e2830"}}>{sit.pattern.name}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10}}>
                  <span style={{fontSize:9,color:"#6a7a88"}}>Status:</span>
                  <span style={{fontSize:8.5,fontWeight:700,letterSpacing:1,padding:"1px 7px",borderRadius:2,background:sit.pattern.status==="ACTIVE"?"#fde8ea":sit.pattern.status==="PERSISTENT"?"#fdf0e8":"#e8f5ee",border:`1px solid ${sit.pattern.status==="ACTIVE"?"#d46070":sit.pattern.status==="PERSISTENT"?"#d4906a":"#a8d8bc"}`,color:sit.pattern.status==="ACTIVE"?"#8a0015":sit.pattern.status==="PERSISTENT"?"#8a3800":"#1a7a4a"}}>{sit.pattern.status}</span>
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #e8ecf0",borderRadius:3,padding:"14px 10px",display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
                  {sit.pattern.units.map((u,i)=><MilUnit key={i} {...u}/>)}
                </div>
              </div>

              {/* Object summary */}
              <div style={{padding:"10px 14px",borderBottom:"1px solid #eef1f4",flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:3,height:10,background:"#2a7fc1",borderRadius:1,display:"inline-block"}}/>OBJECT SUMMARY
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:4}}>
                  {[{label:"MILITARY",color:"#c0192c",bg:"#fde8ea",border:"#d46070"},{label:"CIVILIAN",color:"#1a5c9a",bg:"#e8f0f8",border:"#90b8d8"},{label:"COMMERCIAL",color:"#4a5a68",bg:"#f0f4f8",border:"#b0bcc8"},{label:"INTEL",color:"#6a3800",bg:"#fdf0e0",border:"#c09060"}].map(t=>(
                    <div key={t.label} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:2,padding:"5px 7px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:7.5,color:t.color,letterSpacing:1,fontWeight:700}}>{t.label}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:t.color}}>
                        {SAT_CATALOG.filter(s=>s.type===t.label||s.type.startsWith(t.label.slice(0,4))).length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intel overview */}
              <div style={{flex:1,overflowY:"auto",padding:"10px 14px",minHeight:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:3,height:10,background:"#8a3800",borderRadius:1,display:"inline-block"}}/>INTEL OVERVIEW
                </div>
                <div style={{fontSize:10,lineHeight:1.88,color:"#2a3a48"}}>
                  <HighlightText text={sit.summary.slice(0,280)+"…"}/>
                </div>
                <button className="wpbtn" style={{marginTop:10,width:"100%",justifyContent:"center",fontSize:10,color:"#2a7fc1",borderColor:"rgba(42,127,193,0.3)"}} onClick={()=>setTab("intel")}>
                  View full report →
                </button>

                {/* Alerts */}
                {alerts.length>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#5a6a78",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:3,height:10,background:"#c0192c",borderRadius:1,display:"inline-block"}}/>RECENT ALERTS
                    </div>
                    {alerts.slice(0,4).map((a,i)=>(
                      <div key={i} style={{padding:"4px 8px",marginBottom:3,fontSize:9,borderLeft:`2px solid ${THREAT_META[a.lvl].color}`,background:THREAT_META[a.lvl].bg,borderRadius:"0 2px 2px 0",color:"#3a4a58"}}>
                        <span style={{color:THREAT_META[a.lvl].color,fontSize:7.5,display:"block",fontFamily:"monospace"}}>{a.ts}</span>
                        {a.msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}
          </div>
        </div>
      </div>

      {/* ══ STATUS BAR ══════════════════════════════════════════════════════ */}
      <div style={{height:24,flexShrink:0,background:"#0f1822",borderTop:"1px solid #0a1218",display:"flex",alignItems:"center",padding:"0 12px",fontSize:8,fontFamily:"'Share Tech Mono',monospace",color:"rgba(200,216,232,0.2)",letterSpacing:0.5,gap:0}}>
        <span style={{marginRight:14,letterSpacing:2}}>GOTHAM ORBITAL v9 — CESIUM</span>
        <span style={{marginRight:12}}>SGP4 REALTIME</span>
        <span style={{marginRight:12,color:tleStatus==="live"?"rgba(77,217,160,0.4)":"rgba(240,192,64,0.4)"}}>TLE: {tleStatus.toUpperCase()}</span>
        <span style={{marginRight:12}}>OBJECTS: {SAT_CATALOG.length}</span>
        <span style={{flex:1}}/>
        <span style={{color:running?"rgba(77,217,160,0.4)":"rgba(200,216,232,0.15)"}}>{running?`● CYCLE ${cycle} ACTIVE`:"○ STANDBY"}</span>
        <span style={{marginLeft:14,color:"rgba(200,216,232,0.12)"}}>{clock}</span>
      </div>
    </div>
  );
}