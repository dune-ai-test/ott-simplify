// Crouton Alpha — split catalogs: PC landscape (img-l ×6) / mobile portrait (img-p ×5)
const PC_MOVIES = [
  { title:"GAME OF THRONES", tagline:"Winter is coming. The throne remembers.", synopsis:"Noble houses wage war for the Iron Throne while an ancient enemy returns beyond the Wall. Epic fantasy drama.", platform:"MAX", date:"2026-11-27", dateLabel:"27 NOV 2026", accent:"#c8a96a", img:"./img-l/121361-77.jpg" },
  { title:"SPIDER-MAN: NO WAY HOME", tagline:"The multiverse broke. So did he.", synopsis:"Doctor Strange's spell fractures the multiverse, forcing Peter Parker to face villains from every reality.", platform:"NETFLIX", date:"2027-02-05", dateLabel:"05 FEB 2027", accent:"#e62429", img:"./img-l/6228dc6e91741.jpg" },
  { title:"IRON MAN", tagline:"Proof that Tony Stark has a heart.", synopsis:"Billionaire inventor Tony Stark builds an armored suit to escape captivity — and becomes Iron Man.", platform:"DISNEY+", date:"2027-02-19", dateLabel:"19 FEB 2027", accent:"#f59e0b", img:"./img-l/654018fba1b98.jpg" },
  { title:"SPIDER-MAN: BRAND NEW DAY", tagline:"A brand new day. A new Spider-Man.", synopsis:"A new chapter for Peter Parker — new suit, new city, new enemies. The street-level era begins.", platform:"DISNEY+", date:"2027-03-05", dateLabel:"05 MAR 2027", accent:"#ef4444", img:"./img-l/695cb8d8b9b1b.jpg" },
  { title:"HOW I MET YOUR MOTHER", tagline:"Legendary. Every episode, every time.", synopsis:"Ted Mosby narrates the long, legendary story of how he met the mother of his kids — in New York.", platform:"MAX", date:"2027-03-19", dateLabel:"19 MAR 2027", accent:"#38bdf8", img:"./img-l/75760-26.jpg" },
  { title:"FRINGE", tagline:"The pattern is everywhere. Believe it.", synopsis:"FBI agent Olivia Dunham and mad scientist Walter Bishop investigate fringe science and parallel worlds.", platform:"PRIME VIDEO", date:"2027-01-22", dateLabel:"22 JAN 2027", accent:"#94a3b8", img:"./img-l/82066-70.jpg" }
];
const MOBILE_MOVIES = [
  { title:"GAME OF THRONES", tagline:"Winter is coming. The throne remembers.", synopsis:"Noble houses wage war for the Iron Throne while an ancient enemy returns beyond the Wall.", platform:"MAX", date:"2026-11-27", dateLabel:"27 NOV 2026", accent:"#c8a96a", img:"./img-p/121361-4.jpg" },
  { title:"THE WITCHER", tagline:"A new saga begins. Destiny has a price.", synopsis:"Geralt of Rivia, monster hunter for hire, is swept into a destiny that binds him to Ciri.", platform:"NETFLIX", date:"2026-12-05", dateLabel:"05 DEC 2026", accent:"#e50914", img:"./img-p/6319a87a3553a.jpg" },
  { title:"THE SIMPSONS", tagline:"D'oh. The family is back in Springfield.", synopsis:"The Simpson family navigates suburban life in Springfield — animated satire since 1989.", platform:"DISNEY+", date:"2026-12-19", dateLabel:"19 DEC 2026", accent:"#ffd90f", img:"./img-p/71663-15.jpg" },
  { title:"THE BIG BANG THEORY", tagline:"Geeks. Heroes. Exactly what you need.", synopsis:"Physicists Leonard and Sheldon share an apartment — and orbit Penny, Raj, and Howard.", platform:"MAX", date:"2027-01-08", dateLabel:"08 JAN 2027", accent:"#2f6bff", img:"./img-p/80379-18.jpg" },
  { title:"FRINGE", tagline:"The pattern is everywhere. Believe it.", synopsis:"FBI agent Olivia Dunham and mad scientist Walter Bishop investigate fringe science and parallel worlds.", platform:"PRIME VIDEO", date:"2027-01-22", dateLabel:"22 JAN 2027", accent:"#94a3b8", img:"./img-p/82066-1.jpg" }
];
const $ = s => document.querySelector(s);
const carousel=$("#carousel"), info=$("#info");
const DURATION = 5200;
let MOVIES = [], idx = 0, prog = 0, timer=null, paused=false, bgFlip=false;
let dragging=false, dragX=0, dragOffsetPx=0, hoverTilt={x:0,y:0};
let wasDesktop = null;
const isDesktop = () => window.innerWidth > 768;

function wrap(i){ const N=MOVIES.length; return ((i%N)+N)%N; }
function delta(a,b){ const N=MOVIES.length; let d=(a-b); d=((d%N)+N)%N; if(d>N/2) d-=N; return d; }
function daysUntil(dstr){ const n=new Date(); n.setHours(0,0,0,0); const t=new Date(dstr+"T00:00:00"); t.setHours(0,0,0,0); return Math.max(0, Math.round((t-n)/86400000)); }
function countLabel(dstr){ const x=daysUntil(dstr); return x===0?"TODAY":`IN ${x} DAY${x>1?"S":""}`; }

// PC — landscape geometry (center 1000px / side 360px 16:9) — side half-covered (x = center edge)
const GEO_L = {
  "0": { w:1000, x:0, s:1, r:0 },
  "-1":{ w:360, x:-500, s:.94, r:-2 },
  "1": { w:360, x:500, s:.94, r:2 },
  "-2":{ w:260, x:-600, s:.90, r:-3 },
  "2": { w:260, x:600, s:.90, r:3 },
  "-3":{ w:200, x:-700, s:.86, r:-4 },
  "3": { w:200, x:700, s:.86, r:4 }
};
// Mobile — portrait geometry (center 330 / side 220, 2:3) — sides tucked INSIDE center
const GEO_P = {
  "0": { w:330, x:0, s:1, r:0 },
  "-1":{ w:220, x:-110, s:.92, r:-4 },
  "1": { w:220, x:110, s:.92, r:4 },
  "-2":{ w:160, x:-180, s:.88, r:-6 },
  "2": { w:160, x:180, s:.88, r:6 },
  "-3":{ w:110, x:-250, s:.85, r:-8 },
  "3": { w:110, x:250, s:.85, r:8 }
};
const GEO = () => isDesktop() ? GEO_L : GEO_P;
function transformFor(off, dragPx=0){
  const g = (GEO())[String(off)] || (GEO())["3"];
  const x = g.x + dragPx;
  const rx = off===0 ? hoverTilt.x : hoverTilt.x*.25;
  const ry = off===0 ? hoverTilt.y : hoverTilt.y*.25;
  return `translate(-50%,-50%) translateX(${x}px) scale(${g.s}) rotate(${g.r}deg) rotateX(${ry}deg) rotateY(${rx}deg)`;
}
function widthFor(off){
  const w = ((GEO())[String(off)]||(GEO())["3"]).w;
  const frac = isDesktop() ? (String(off)==="0" ? .94 : .38) : (String(off)==="0" ? .86 : .62);
  const maxW = Math.round(window.innerWidth * frac);
  return Math.min(w, Math.max(maxW, String(off)==="0"?240:140)) + "px";
}

function build(reset){
  MOVIES = isDesktop() ? PC_MOVIES : MOBILE_MOVIES;
  if(reset) idx = 0;
  $("#totIdx").textContent = String(MOVIES.length).padStart(2,"0");
  MOVIES.forEach(m=>{ const a=new Image(); a.src=m.img; });
  carousel.innerHTML = "";
  MOVIES.forEach((m,i)=>{
    const c=document.createElement("div");
    c.className="card"; c.dataset.i=i; c.dataset.offset="3";
    c.innerHTML=`<img src="${m.img}" alt="${m.title}"/><div class="sheen"></div><span class="prog"><i></i></span>`;
    c.querySelector("img").onerror=e=>e.target.src=`https://picsum.photos/seed/crouton-${i}/1200/750`;
    c.addEventListener("click", ()=>{
      if(dragging) return;
      const d=delta(wrap(i), idx);
      if(d===0){ $("#stage").classList.toggle("spotlight"); return; }
      $("#stage").classList.remove("spotlight");
      goTo(i, Math.sign(d)||1);
    });
    carousel.appendChild(c);
  });
  const dots=$("#dots"); dots.innerHTML="";
  MOVIES.forEach((m,i)=>{
    const b=document.createElement("button");
    b.setAttribute("aria-label", m.title);
    b.addEventListener("click", ()=> goTo(i, delta(i,idx)>=0?1:-1));
    dots.appendChild(b);
  });
}

function layout(dragPx=0){
  [...carousel.children].forEach(c=>{
    const i=+c.dataset.i;
    const off=delta(wrap(i), idx);
    c.dataset.offset=String(off);
    c.style.width=widthFor(off);
    c.style.transform=transformFor(off, dragPx);
  });
}

function renderInfo(){
  const m=MOVIES[idx];
  document.documentElement.style.setProperty("--accent", m.accent);
  bgFlip=!bgFlip;
  const show=bgFlip?$("#bgA"):$("#bgB"), hide=bgFlip?$("#bgB"):$("#bgA");
  show.onerror=()=>show.src=`https://picsum.photos/seed/crouton-bg-${idx}/1600/900`;
  show.src=m.img; show.classList.add("on"); hide.classList.remove("on");
  const apply=()=>{
    $("#platform").textContent=m.platform;
    $("#dateLabel").textContent=m.dateLabel;
    $("#countLabel").textContent=countLabel(m.date);
    $("#curIdx").textContent=String(idx+1).padStart(2,"0");
    // staggered title
    const t=$("#title");
    t.innerHTML=m.title.split(" ").map((w,i)=>`<span class="w"><i style="transition-delay:${i*60}ms">${w}</i></span>`).join(" ");
    [...$("#dots").children].forEach((d,j)=>d.classList.toggle("active",j===idx));
    info.classList.remove("leaving","entering");
  };
  info.classList.add("leaving");
  setTimeout(()=>{ info.classList.add("entering"); apply(); requestAnimationFrame(()=>requestAnimationFrame(()=>info.classList.remove("entering"))); },300);
}

function startLoop(){
  clearInterval(timer); prog=0;
  timer=setInterval(()=>{
    if(paused||dragging) return;
    prog+=100/(DURATION/100);
    if(prog>=100){ goTo(idx+1,1); return; }
    const bar=carousel.querySelector('.card[data-offset="0"] .prog i');
    if(bar) bar.style.width=prog+"%";
  },100);
}
function goTo(i,dir=1){ idx=wrap(i); $("#stage").classList.remove("spotlight"); layout(0); renderInfo(); startLoop(); }

$("#prevBtn").addEventListener("click", ()=>goTo(idx-1,-1));
$("#nextBtn").addEventListener("click", ()=>goTo(idx+1,1));
$("#pauseBtn").addEventListener("click", e=>{ paused=!paused; e.currentTarget.textContent=paused?"▶ PLAY":"❚❚"; });
$("#stage").addEventListener("mouseenter", ()=>paused=true);
$("#stage").addEventListener("mouseleave", ()=>{ if($("#pauseBtn").textContent!=="▶ PLAY") paused=false; });

let vel=0, lastX=0, lastT=0;
const startDrag=(x)=>{ dragX=x; dragging=true; dragOffsetPx=0; vel=0; lastX=x; lastT=performance.now(); carousel.classList.add("dragging"); paused=true; };
const moveDrag=(x)=>{
  if(!dragging)return;
  const now=performance.now(), dt=Math.max(1,now-lastT);
  vel=(x-lastX)/dt*1000; // px/s
  lastX=x; lastT=now;
  // rubber-band past the halfway point so long drags feel elastic
  const raw=x-dragX, th=isDesktop()?110:80;
  dragOffsetPx = Math.abs(raw)>th ? th + (raw-Math.sign(raw)*th)*0.45 : raw;
  layout(dragOffsetPx);
};
const endDrag=()=>{
  if(!dragging)return;
  dragging=false; carousel.classList.remove("dragging");
  const th=isDesktop()?110:80;
  const steps = Math.abs(vel)>1400 ? 2 : 1; // hard throw skips two
  if(dragOffsetPx<-th || vel<-700) goTo(idx+steps,1);
  else if(dragOffsetPx>th || vel>700) goTo(idx-steps,-1);
  else layout(0);
  if($("#pauseBtn").textContent!=="▶ PLAY") paused=false;
  vel=0; dragOffsetPx=0;
};
carousel.addEventListener("pointerdown", e=>{ startDrag(e.clientX); try{carousel.setPointerCapture(e.pointerId)}catch(_){} });
carousel.addEventListener("pointermove", e=>moveDrag(e.clientX));
carousel.addEventListener("pointerup", endDrag);
carousel.addEventListener("pointercancel", endDrag);
carousel.addEventListener("touchstart", e=>startDrag(e.touches[0].clientX), {passive:true});
carousel.addEventListener("touchmove", e=>moveDrag(e.touches[0].clientX), {passive:true});
carousel.addEventListener("touchend", endDrag);

// proximity glow + cursor grow handled in mousemove below
let wheelLock=null;
$("#stage").addEventListener("wheel", e=>{
  if(!isDesktop()) return;
  if(wheelLock) return;
  const d = Math.abs(e.deltaY)>Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if(d>28){ goTo(idx+1,1); wheelLock=setTimeout(()=>wheelLock=null,950); }
  else if(d<-28){ goTo(idx-1,-1); wheelLock=setTimeout(()=>wheelLock=null,950); }
},{passive:true});

$("#stage").addEventListener("mousemove", e=>{
  const r=$("#stage").getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
  hoverTilt={x:x*6, y:-y*5};
  if(!dragging) layout(0);
});
$("#stage").addEventListener("mouseleave", ()=>{ hoverTilt={x:0,y:0}; if(!dragging) layout(0); });
document.addEventListener("keydown", e=>{
  if(e.key==="ArrowRight") goTo(idx+1,1);
  if(e.key==="ArrowLeft") goTo(idx-1,-1);
  if(e.key===" "){ e.preventDefault(); $("#pauseBtn").click(); }
  if(e.key==="Enter" || e.key==="Escape") $("#stage").classList.remove("spotlight");
  const n=parseInt(e.key,10);
  if(n>=1 && n<=MOVIES.length && n-1!==idx) goTo(n-1, n-1>idx?1:-1);
});

let rT; window.addEventListener("resize", ()=>{
  clearTimeout(rT); rT=setTimeout(()=>{
    const nowDesktop = isDesktop();
    if(wasDesktop === null){ wasDesktop = nowDesktop; layout(0); return; }
    if(nowDesktop !== wasDesktop){
      wasDesktop = nowDesktop;
      build(true); layout(0); renderInfo(); startLoop();
    } else {
      layout(0);
    }
  },120);
});

wasDesktop = isDesktop();
build(false); layout(0); renderInfo(); startLoop();
