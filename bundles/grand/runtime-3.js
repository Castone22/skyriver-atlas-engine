'use strict';
const $=id=>document.getElementById(id),C=GrandAtlasCore;
const WIKI='https://skyrivercodex.lzridgecodes.net/',API=WIKI+'api.php';
const seeds=JSON.parse($('seed').textContent),snapshots=JSON.parse($('snapshots').textContent);
let records=new Map(seeds.map(x=>[x.id,{...x}])),active='galaxy',generation=0,discoverTask=null,lastDiscovery=0,discoveryOK=false,frame=null,loadTimer=null,noticeTimer=null,view={x:0,y:0,k:1},savedView={...view},anim=0;
const S=GrandAtlasSearch,locationIndexes=new Map(Object.entries(JSON.parse($('searchSeed').textContent)).map(([id,entries])=>[id,{entries,live:false,signature:'',checked:0}])),sourceTasks=new Map();
const P=GrandAtlasPriority,priorityBaseline=JSON.parse($('prioritySeed').textContent),sharedSources=Object.fromEntries(Object.entries(priorityBaseline).map(([id,data])=>[id,{data,live:false,stamp:0}]));
let sharedPolicy=P.policy(sharedSources,priorityBaseline);
/* @atlas-function preferredEntry */
let indexTask=null,indexBusy=0,resultLimit=100,currentRoute=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sourceURL=slug=>WIKI+'index.php?title='+encodeURIComponent('Special:AtlasEmbed/'+slug);
const articleURL=name=>WIKI+'index.php?title='+encodeURIComponent(name.replace(/ /g,'_'));
const safeJSON=o=>JSON.stringify(o).replace(/</g,'\\u003c');
/* @atlas-function status */
/* @atlas-function notify */
/* @atlas-function node */
/* @atlas-function sorted */
/* @atlas-function rebuild */
/* @atlas-function renderIndex-21d0753ef74d */
/* @atlas-function indexSource */
/* @atlas-function refreshSearch */
/* @atlas-function drawMarkers */
/* @atlas-function fetchText */
/* @atlas-function api */
/* @atlas-function discover */
/* @atlas-function unpack */
/* @atlas-function validateHTML */
/* @atlas-function loadSource */
/* @atlas-function readSource */
/* @atlas-function adaptHTML */
/* @atlas-function setIndex */
/* @atlas-function overlay */
/* @atlas-function openAtlas */
window.addEventListener('message',e=>{
 const d=e.data;if(!frame||e.source!==frame.contentWindow||!d||d.token!==frame.dataset.token)return;
 if(d.channel==='grand-atlas-navigate'){if(!P.ids.includes(active)||!P.ids.includes(d.id)||!d.route||typeof d.route!=='object')return;const route=Object.fromEntries(Object.entries(d.route).filter(([k,v])=>['region','system','object','planet','focus','schematic'].includes(k)&&typeof v==='string'));const target=P.resolve(sharedPolicy,active,route);if(target.id===d.id&&target.id!==active)openAtlas(target.id,false,target.route);return}
 if(d.channel!=='grand-atlas-ready')return;
 clearTimeout(loadTimer);if(finishWarp){finishWarp();finishWarp=null}$('loading').hidden=true;$('galaxy').setAttribute('hidden','');
 const live=frame.dataset.live==='true',r=records.get(active);
 status(frame.dataset.name+' · '+(live?'Live from Codex':'Bundled preview · '+frame.dataset.reason),live);
 if(!live)notify(frame.dataset.name+' is showing the bundled preview. '+(r?.live?'Its live source could not be reached.':'It will use the live atlas when that source is available.'));
});
/* @atlas-function galaxy */
/* @atlas-function paint */
/* @atlas-function flyTo */
/* @atlas-function zoomBy */
/* @atlas-function point */
let pointers=new Map(),dragged=false,pinch=null;
$('galaxy').addEventListener('pointerdown',e=>{if(active!=='galaxy')return;cancelAnimationFrame(anim);const p=point(e);pointers.set(e.pointerId,p);dragged=false;if(!e.target.closest('.marker'))$('galaxy').setPointerCapture(e.pointerId);$('galaxy').classList.add('dragging');if(pointers.size===2){const a=[...pointers.values()];pinch={dist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}}});
$('galaxy').addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||active!=='galaxy')return;const old=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch?.dist)zoomBy(d/pinch.dist,{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});pinch={dist:d};dragged=true}else if(Math.hypot(p.x-old.x,p.y-old.y)>1){view.x+=p.x-old.x;view.y+=p.y-old.y;dragged=true;paint()}});
/* @atlas-function release */
$('galaxy').addEventListener('pointerup',release);$('galaxy').addEventListener('pointercancel',release);
$('galaxy').addEventListener('wheel',e=>{if(active!=='galaxy')return;e.preventDefault();zoomBy(Math.exp(-e.deltaY*.0012),point(e))},{passive:false});
$('galaxy').addEventListener('keydown',e=>{if(e.target.closest('.marker'))return;const delta=40;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','0','+','-','='].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')view.x+=delta;if(e.key==='ArrowRight')view.x-=delta;if(e.key==='ArrowUp')view.y+=delta;if(e.key==='ArrowDown')view.y-=delta;if(e.key==='0')view={x:0,y:0,k:1};if(['+','='].includes(e.key))zoomBy(1.2);if(e.key==='-')zoomBy(1/1.2);paint()});
$('zoomIn').onclick=()=>zoomBy(1.25);$('zoomOut').onclick=()=>zoomBy(.8);$('fit').onclick=()=>{view={x:0,y:0,k:1};paint()};
$('indexToggle').onclick=()=>setIndex($('index').hidden);$('closeIndex').onclick=()=>setIndex(false);$('search').oninput=()=>{resultLimit=100;renderIndex()};
$('atlasSelect').onchange=e=>e.target.value==='galaxy'?galaxy():openAtlas(e.target.value,true);
$('back').onclick=galaxy;$('errorBack').onclick=galaxy;$('brand').onclick=e=>{e.preventDefault();galaxy()};$('retry').onclick=()=>openAtlas(active,false,currentRoute);
$('help').onclick=()=>$('about').showModal();$('closeHelp').onclick=()=>$('about').close();
$('refresh').onclick=async()=>{const id=active,route=currentRoute;$('refresh').disabled=true;const ok=await discover();$('refresh').disabled=false;if(id!=='galaxy'&&active===id&&records.has(id))openAtlas(id,false,route);else if(!ok)notify('Could not reach the Codex directory. Known atlases remain available.')};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('about').open){if(!$('index').hidden)setIndex(false);else if(active!=='galaxy')galaxy()}});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#atlas=(.+)/);if(m&&records.has(decodeURIComponent(m[1])))openAtlas(decodeURIComponent(m[1]));else if(location.hash==='#galaxy')galaxy()});
setInterval(()=>{if(!document.hidden)discover()},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastDiscovery>300000)discover()});
/* @atlas-function layout */
// One cancellable overlay owns the pixels until the destination acknowledges readiness.
const transit=(()=>{
 const screen=$('transit'),ctx=screen.getContext('2d');
 let frameId=0,serial=0;
 function stop(){serial++;cancelAnimationFrame(frameId);screen.hidden=true;$('workspace').classList.remove('warping')}
 function begin(){
  stop();screen.width=Math.max(1,$('workspace').clientWidth);screen.height=Math.max(1,$('workspace').clientHeight);
  screen.hidden=false;return serial;
 }
 function warp(id){
  const key=begin(),picture=orbitSplash.snapshot(false),[nx,ny]=orbitSplash.destination(id);
  const w=screen.width,h=screen.height,started=performance.now();
  let arrival=null;
  const dust=Array.from({length:220},()=>({a:Math.random()*Math.PI*2,r:.16+Math.random()*.84,z:Math.random(),speed:.65+Math.random()*.55}));
  $('workspace').classList.add('warping');
  function paint(now){
   if(key!==serial)return;
   const sec=(now-started)/1000,accel=Math.min(1,sec/.83),exit=arrival===null?0:Math.max(0,(now-arrival)/240);
   if(exit>=1){stop();return}
   const cx=w*(nx+(.5-nx)*accel),cy=h*(ny+(.5-ny)*accel),scale=1+accel**3*3.4;
   ctx.clearRect(0,0,w,h);ctx.globalAlpha=1-exit;ctx.fillStyle='#071020';ctx.fillRect(0,0,w,h);
   ctx.globalAlpha=(1-exit)*Math.max(0,1-accel**2);
   ctx.drawImage(picture,cx-w*nx*scale,cy-h*ny*scale,w*scale,h*scale);
   ctx.globalCompositeOperation='lighter';
   for(const star of dust){
    const z=1-((star.z+sec*(.12+.72*accel)*star.speed)%1);
    const radius=star.r*Math.min(w,h)*.13/Math.max(.035,z),tail=radius*(1-.04-.68*accel**2);
    const dx=Math.cos(star.a),dy=Math.sin(star.a)*.76;
    ctx.globalAlpha=(1-exit)*(.2+.65*accel)*(1-z*.7);ctx.lineWidth=.5+1.5*(1-z)**3;
    ctx.strokeStyle=star.speed>.99?'#cb9de7':star.speed<.8?'#7aebe4':'#9fc8ff';
    ctx.beginPath();ctx.moveTo(cx+dx*tail,cy+dy*tail);ctx.lineTo(cx+dx*radius,cy+dy*radius);ctx.stroke();
   }
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';frameId=requestAnimationFrame(paint);
  }
  paint(started);
  return ()=>{if(key===serial)arrival=Math.max(started+820,performance.now())};
 }
 function rift(fromDark,toDark,onMid,onEnd){
  const key=begin(),prime=orbitSplash.snapshot(true),voidImage=orbitSplash.snapshot(false);
  const shaded=document.createElement('canvas');shaded.width=voidImage.width;shaded.height=voidImage.height;
  const brush=shaded.getContext('2d');brush.filter='grayscale(1) sepia(.8) hue-rotate(248deg) saturate(1.9) brightness(.30)';brush.drawImage(voidImage,0,0);
  const w=screen.width,h=screen.height,start=performance.now();let switched=false,nextCut=0;
  function paint(now){
   if(key!==serial)return;
   const elapsed=now-start;
   if(elapsed>=260&&!switched){switched=true;onMid()}
   if(elapsed>=580){stop();onEnd();return}
   if(elapsed>=nextCut){
    nextCut=elapsed+14+Math.random()*19;
    const pic=(switched?toDark:fromDark)?shaded:prime;
    ctx.fillStyle='#080e17';ctx.fillRect(0,0,w,h);ctx.drawImage(pic,0,0,w,h);
    let y=0;
    while(y<h){
     const band=Math.min(h-y,2+Math.random()**2*h*.13);
     const dx=(Math.random()-.5)*w*(Math.random()<.2?.62:.14);
     const sy=y/h*pic.height,sh=band/h*pic.height;
     ctx.drawImage(pic,0,sy,pic.width,sh,dx,y,w,band);
     if(Math.random()<.3){ctx.fillStyle=Math.random()<.5?'#a23ef232':'#4ae49527';ctx.fillRect(0,y,w,Math.min(band,3+Math.random()*8))}
     y+=band;
    }
   }
   frameId=requestAnimationFrame(paint);
  }
  paint(start);
 }
 return {warp,rift,stop};
})();
let finishWarp=null;
/* @atlas-function cancelTransit */

// The Great Blink study splits a single image into eight opposing strips.
// Reuse the live camera so the transition includes the map labels and current zoom.
const darkGate=$('darkGate'), darkSignal=$('darkSignal');
let darkverse=false, crossingTimer;
/* @atlas-function showRealm */
/* @atlas-function endCrossing */
/* @atlas-function resetRealm */
/* @atlas-function crossRealm */
darkGate.onclick=crossRealm;

const orbitSplash=(()=>{
'use strict';
const empires=seeds,source=__ATLAS__.constants["galaxyImage"];
const root=$('orbitRoot').attachShadow({mode:'open'});
root.innerHTML="\u003cstyle>\n:root{color-scheme:dark;--gold:#dbbb80;--line:#26323e;--ink:#e4e7e8;--muted:#95a3b0;--mono:ui-monospace,Consolas,monospace}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:#080e17;font:14px system-ui,sans-serif}header{height:48px;background:#101923;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 20px;gap:12px}header div{display:flex;align-items:center;gap:13px}header svg{width:25px;color:var(--gold)}header strong{font-size:14px;font-weight:480;letter-spacing:.18em}header small,.tag,button,.instructions,footer,output{font-family:var(--mono)}header small{color:var(--muted);font-size:10px}.tag{font-size:10px;letter-spacing:.12em;color:var(--gold)}\nmain{position:relative;height:calc(100dvh - 77px);min-height:310px;overflow:hidden;isolation:isolate;background:radial-gradient(ellipse at 49% 46%,#111d29 0,#0b131d 42%,#070d15 78%)}canvas,#overlay{position:absolute;inset:0;width:100%;height:100%}canvas{touch-action:none;cursor:grab;outline-offset:-3px}canvas.drag{cursor:grabbing}#overlay{pointer-events:none}.marker{pointer-events:auto;cursor:pointer;outline:0}.marker:focus-visible .ring,.marker:hover .ring{stroke:white;stroke-width:2}.marker text{font:12px var(--mono);letter-spacing:.08em;paint-order:stroke;stroke:#090f18;stroke-width:3px;stroke-linejoin:round}.marker path{fill:none;stroke-width:1;opacity:.75}\n.intro{position:absolute;inset:22px auto auto 24px;pointer-events:none}h1{font-weight:350;letter-spacing:.04em;font-size:clamp(25px,3.2vw,44px);margin:6px 0}.instructions{font-size:10px;line-height:1.65;color:var(--muted);margin:0}.tools{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:5px;border:1px solid #354552;border-radius:5px;background:#0b141fe8;align-items:center}button{border:1px solid transparent;background:transparent;color:#c0cdd5;font-size:11px;padding:8px 10px;cursor:pointer;border-radius:3px;white-space:nowrap}button:hover,button:focus-visible{color:white;background:#25313e}button[aria-pressed=true]{color:#f0d49d;background:#302b22;border-color:#63523a}.divide{height:16px;width:1px;background:var(--line);margin:0 2px}output{font-size:10px;color:#b2bfc8;text-align:center;min-width:36px}\nfooter{height:29px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding:0 18px;font-size:9px;letter-spacing:.05em;color:#8d9daa}#panel{position:absolute;right:18px;top:18px;background:#101a25f5;border:1px solid #3d505c;border-top:2px solid var(--accent);padding:15px;width:min(290px,calc(100% - 28px));box-shadow:0 10px 35px #0005}.close{float:right;padding:0 5px;font-size:18px}#panel h2{font-size:21px;font-weight:440;margin:8px 0 14px}#panel a{color:#cee2ee;font-size:12px;text-underline-offset:4px;display:inline-block;margin:3px 15px 4px 0}a:focus-visible,button:focus-visible,canvas:focus-visible{outline:2px solid var(--gold)}[hidden]{display:none!important}@media(max-width:600px){header{padding:0 12px}header small{display:none}.intro{left:14px;top:14px}.tools{gap:0;bottom:12px;padding:3px}button{padding:8px}.marker text{font-size:10px;letter-spacing:.02em}#panel{top:auto;bottom:63px;right:14px}footer{padding:0 9px;font-size:8px}.tag{font-size:9px}}\n.marker text{font-weight:600;stroke:#080e18;stroke-width:4px}.marker.selected text{fill:#fff5dd;font-weight:700}.marker.selected .ring{stroke-width:2px}\n:host{display:block;height:100%;color:#e4e7e8;--gold:#dbbb80;--muted:#95a3b0;--line:#26323e;--mono:ui-monospace,Consolas,monospace;font:14px system-ui,sans-serif}\nmain{height:100%;min-height:0}\n.intro h1{font-size:clamp(23px,2.7vw,36px)}\n#pirateSwitch{position:absolute;bottom:18px;left:16px;background:#20151b;border:1px solid #75404b;color:#dda5ae;padding:9px 11px}\n.marker.pirate text{fill:#ce5361;opacity:.43;letter-spacing:.08em;transition:opacity .15s}\n.marker.pirate path.leader{stroke:#ff526a;stroke-width:1.7;stroke-dasharray:6 3;opacity:.96}\n.marker.pirate:is(:hover,:focus-visible,.selected) text{fill:#ef6372;opacity:1}\n.marker.pirate.selected .ring{stroke:#ffc5cd}\n#panel .tag{color:#e5969f}#panel p{color:#c1a8ae;font-size:12px}\n:host([dark]) canvas{filter:grayscale(1) sepia(.8) hue-rotate(248deg) saturate(1.9) brightness(.30)}\n:host([dark]) main{background:#06070b}\n:host([dark]) :is(.intro,.tools,#pirateSwitch,#overlay,#panel){display:none!important}\n@media(max-width:760px){.tools{bottom:56px}.intro .instructions{font-size:9px}#pirateSwitch{left:10px;bottom:13px}#panel{bottom:105px}}\n\u003c/style>\u003cmain id=\"scene\">\u003ccanvas id=\"sky\" tabindex=\"0\" aria-label=\"Three-dimensional galaxy. Drag or use arrow keys to rotate, scroll or pinch to zoom.\">\u003c/canvas>\u003csvg id=\"overlay\" aria-label=\"Empire markers\">\u003c/svg>\n\u003cdiv class=\"intro\">\u003cspan class=\"tag\">THE GALACTIC CHART\u003c/span>\u003ch1>Skyriver\u003c/h1>\u003cp class=\"instructions\">Drag to orbit \u00b7 Scroll or pinch to zoom\u003cbr>Choose an empire to open its stellar atlas\u003c/p>\u003c/div>\n\u003caside id=\"panel\" hidden aria-live=\"polite\">\u003cbutton class=\"close\" id=\"dismiss\" aria-label=\"Close zone details\">\u00d7\u003c/button>\u003cspan class=\"tag\">ZERO SECURITY \u00b7 PIRATE SPACE\u003c/span>\u003ch2 id=\"name\">\u003c/h2>\u003ca id=\"article\" target=\"_blank\" rel=\"noopener\">Codex article \u2197\u003c/a>\u003cp>Pirate-controlled space \u00b7 No stellar chart assigned\u003c/p>\u003c/aside>\n\u003cbutton id=\"pirateSwitch\" aria-pressed=\"true\">Hide Pirate Space\u003c/button>\u003cnav class=\"tools\" aria-label=\"Galaxy controls\">\u003cbutton id=\"spin\" aria-pressed=\"true\">Spin\u003c/button>\u003cbutton id=\"labels\" aria-pressed=\"true\">Labels\u003c/button>\u003ci class=\"divide\">\u003c/i>\u003cbutton id=\"minus\" aria-label=\"Zoom out\">\u2212\u003c/button>\u003coutput id=\"zoom\">100%\u003c/output>\u003cbutton id=\"plus\" aria-label=\"Zoom in\">+\u003c/button>\u003ci class=\"divide\">\u003c/i>\u003cbutton id=\"reset\">Reset\u003c/button>\u003c/nav>\n\u003c/main>";
const get=id=>root.getElementById(id),canvas=get('sky'),ctx=canvas.getContext('2d'),overlay=get('overlay');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let angle=3.40,tilt=2.71,zoom=1,spin=!motion.matches,labels=true,focus=null,velocity=[0,0],dirty=true,width=0,height=0,scale=0;
let seed=18355; function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function normal(){return Math.sqrt(-2*Math.log(Math.max(1e-8,rand())))*Math.cos(6.283*rand())}
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const stars = [], clouds = [];
const field = Array.from({length: 260}, () => [rand(), rand(), rand()]);
const elevations = {
 'elysian-stellar-atlas': .067, 'uacs-stellar-atlas': -.068,
 'calidor-stellar-atlas': .012, 'kadaym-stellar-atlas': .095,
 'iulr-stellar-atlas': -.031
};
let formation = motion.matches ? 1 : 0, birthTime = null, ready = false;
function settle(){formation = 1; dirty = true}
for(const event of ['pointerdown','wheel','keydown']) {
 document.addEventListener(event, settle, {capture:true,passive:true});
}
function smooth(value){const t=clamp(value,0,1);return t*t*(3-2*t)}
function mistSprite(color){
 const sprite=surface(64,64),brush=sprite.getContext('2d');
 const glow=brush.createRadialGradient(32,32,0,32,32,32);
 for(const [position,alpha] of [[0,1],[.22,.76],[.50,.34],[.77,.075],[1,0]]){
  glow.addColorStop(position,'rgba('+color+','+alpha+')');
 }
 brush.fillStyle=glow;brush.fillRect(0,0,64,64);return sprite;
}
const mist = ['116,151,193','125,166,195','138,159,176','201,172,137','230,197,151','238,218,184'].map(mistSprite);
function buildVolume(image){
 const n=256, sample=surface(n,n).getContext('2d');
 sample.drawImage(image,0,0,n,n);
 const pixels=sample.getImageData(0,0,n,n).data,weights=new Float32Array(n*n);
 let total=0;
 for(let i=0;i<weights.length;i++){
  const x=(i%n+.5)/n*2-1,y=(Math.floor(i/n)+.5)/n*2-1,r=Math.hypot(x,y);
  const light=(pixels[4*i]*.25+pixels[4*i+1]*.55+pixels[4*i+2]*.20)/255;
  const signal=Math.max(0,light-.065);
  // Fade the source sky continuously before distributing light into space.
  total+=signal**1.65*(1-smooth((r-.66)/.40));
  weights[i]=total;
 }
 function sampleArm(){
  const pick=rand()*total;let low=0,high=weights.length-1;
  while(low<high){const mid=(low+high)>>>1;if(weights[mid]<pick)low=mid+1;else high=mid}
  const x=((low%n+rand())/n-.5)*2,y=((Math.floor(low/n)+rand())/n-.5)*2,r=Math.hypot(x,y);
  const thickness=.018+.095*Math.exp(-r*r/.055)+.022*r;
  return {x,y,r,z:normal()*thickness+.025*r*Math.sin(2*Math.atan2(y,x)+4*r),warm:pixels[4*low]>pixels[4*low+2]+3};
 }
 // Each patch is a luminous 3D cloud with a soft radial footprint from every angle.
 for(let i=0;i<4400;i++){
  const c=sampleArm(),outer=smooth((c.r-.45)/.55);
  c.radius=.027+rand()**1.3*.062+outer*.042;
  c.alpha=(.052+rand()*.075)*(.19+.32*smooth(c.r/.48))*(1-.35*outer);
  c.sprite=mist[(c.warm?3:0)+Math.floor(rand()*3)];
  clouds.push(c);
 }
 const colors=__ATLAS__.constants["palette"];
 for(let i=0;i<6800;i++){
  const s=sampleArm();
  if(i%14===0){s.z+=normal()*.105;s.x+=normal()*.065;s.y+=normal()*.065}
  s.size=.32+rand()**5*1.2;s.alpha=.14+rand()*.58;
  s.color=colors[s.warm?(rand()<.55?2:3):Math.floor(rand()*colors.length)];stars.push(s);
 }
 ready=true;dirty=true;
}
// buildVolume reads the image's pixels, so an image served from another origin (the wiki loader runs in a
// sandbox, where every image is cross-origin) must be requested with CORS or the canvas is tainted.
const image=new Image();image.crossOrigin='anonymous';image.onload=()=>buildVolume(image);image.src=source;
let basis;
function setBasis(){const a=Math.cos(angle),b=Math.sin(angle),t=Math.cos(tilt),h=Math.sin(tilt);
 basis={a,b,t,h};scale=Math.min(width*.51,height*.53)*zoom}
function project(x,y,z){const {a,b,t,h}=basis;return [width*.5+scale*(a*x-b*y),height*.51+scale*((b*x+a*y)*t-z*h)]}
function draw(){
 if(!width||!height)return;setBasis();ctx.clearRect(0,0,width,height);
 for(const [x,y,q] of field){ctx.fillStyle='rgba(159,181,207,'+(.12+q*.31)+')';ctx.fillRect(x*width,y*height,q>.93?1.4:.8,q>.93?1.4:.8)}
 const {a,b,t,h}=basis;ctx.save();ctx.globalCompositeOperation='lighter';
 const cx=width*.5,cy=height*.51;
 function locate(p){
  let x=p.x,y=p.y,z=p.z,visibility=1;
  if(formation<1){
   const delay=Math.min(.34,p.r*.31),growth=smooth((formation-delay)/(1-delay));
   const spread=.025+.975*growth,twist=(1-growth)*(2.4+p.r);
   const cos=Math.cos(twist),sin=Math.sin(twist);
   x=(p.x*cos-p.y*sin)*spread;y=(p.x*sin+p.y*cos)*spread;
   z*=.12+.88*growth;visibility=growth;
  }
  return [cx+scale*(a*x-b*y),cy+scale*((b*x+a*y)*t-z*h),visibility];
 }
 for(const cloud of clouds){
  const [x,y,v]=locate(cloud);if(v<=0)continue;
  const radius=scale*cloud.radius*(.55+.45*v);
  ctx.globalAlpha=cloud.alpha*v*(1-.83*Math.abs(h)**6);
  ctx.drawImage(cloud.sprite,x-radius,y-radius,2*radius,2*radius);
 }
 for(const star of stars){
  const [x,y,v]=locate(star),size=star.size*clamp(scale/400,.7,2.3);
  ctx.globalAlpha=star.alpha*v;ctx.fillStyle=star.color;ctx.fillRect(x,y,size,size);
 }
 ctx.restore();placeLabels();
}
function svg(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const key in attrs)el.setAttribute(key,attrs[key]);return el}
const pirateZones=__ATLAS__.constants["zones"];
let piratesVisible=true;
const markers=[...empires,...pirateZones].map(e=>{
 const pirate=e.security==='zero';
 const group=svg('g',{class:pirate?'marker pirate':'marker',role:'button',tabindex:0,'aria-label':'Explore '+e.name});
 const leader=svg('path',{class:'leader',stroke:e.color}),dot=svg('circle',{r:4,fill:e.color}),ring=pirate?svg('polygon',{points:'0,-9 8,0 0,9 -8,0',fill:'#180c14',stroke:'#ff4f67','stroke-width':2,class:'ring'}):svg('circle',{r:8,fill:'#081018',stroke:e.color,class:'ring'});
 const text=svg('text',{fill:'color-mix(in srgb, '+e.color+' 55%, white)'}),hit=svg('rect',{fill:'transparent',rx:2});group.append(leader,ring);if(pirate){const gem=svg('polygon',{class:'gem',points:'0,-4.6 4,0 0,4.6 -4,0',fill:'#d33048'});group.append(gem)}else group.append(dot);group.append(hit,text);overlay.append(group);
 group.onclick=()=>select(e);group.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();select(e)}};
 return {e,group,leader,dot,ring,text,hit};
});
function placeLabels(){
 if(!labels)return;
 const small=width<640;
 overlay.style.opacity=String(smooth((formation-.73)/.27));
 const placed=markers.filter(m=>piratesVisible||m.e.security!=='zero').map(m=>{const [x,y]=project(2*m.e.position[0]-1,2*m.e.position[1]-1,elevations[m.e.id]??0);
  const font=(small?11:14)+(focus===m.e?2:0);m.text.style.fontSize=font+'px';
  const sign=x<width/2?-1:1;let words=(m.e.security==='zero'?m.e.name:m.e.name.toUpperCase()).split(' '),lines=[words.join(' ')];
  if(small){const cut=Math.ceil(words.length/2);lines=[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]}
  const textWidth=Math.max(...lines.map(l=>l.length))*(font*.64+(small?0:.6));
  return {...m,x,y,font,sign,lines,textWidth,ly:y-12};});
 // Reserve every marker before placing any name. Prefer the previous slot
 // when costs are similar so a rotating chart does not shuffle its labels.
 const occupied=[];
 const dots=placed.map(({x,y})=>({left:x-12,right:x+12,top:y-12,bottom:y+12}));
 const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 placed.sort((a,b)=>Number(b.e===focus)-Number(a.e===focus)||Number(a.e.security==='zero')-Number(b.e.security==='zero'));
 for(const m of placed){
  const {x,y,lines,textWidth,font}=m;
  const labelHeight=font*(1.15*lines.length)+8;
  let best=null;
  for(const sign of [m.sign,-m.sign]){
   const tx=sign<0?clamp(x-(small?24:48),10+textWidth,width-10):clamp(x+(small?24:48),10,width-10-textWidth);
   for(const slot of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6]){
    const ly=clamp(y-12+slot*(labelHeight+5),labelHeight+6,Math.max(labelHeight+6,height-63));
    const left=Math.min(tx,tx+sign*textWidth)-5;
    const rect={left,right:left+textWidth+10,top:ly-labelHeight+2,bottom:ly+7};
    let cost=Math.abs(ly-y+12)+Math.abs(tx-x)*.16+(sign===m.sign?0:18);
    if(m.group.dataset.slot===sign+','+slot)cost-=12;
    for(const dot of dots)cost+=overlap(rect,dot)*22;
    for(const other of occupied)cost+=overlap(rect,other)*12;
    if(!best||cost<best.cost)best={sign,slot,tx,ly,rect,cost};
   }
  }
  const {sign,slot,tx,ly,rect}=best;
  occupied.push(rect);m.group.dataset.slot=sign+','+slot;
  const anchor=sign<0?'end':'start',lineEnd=tx+sign*textWidth,baseline=ly+4;
  m.leader.setAttribute('d','M'+x+','+y+' L'+tx+','+baseline+' H'+lineEnd);
  if(m.e.security==='zero'){for(const diamond of [m.ring,m.group.querySelector('.gem')])diamond.setAttribute('transform','translate('+x+' '+y+')')}
  for(const d of [m.dot,m.ring]){d.setAttribute('cx',x);d.setAttribute('cy',y)}
  const lineKey=lines.join('|');if(m.text.dataset.lines!==lineKey){m.text.replaceChildren();for(let i=0;i<lines.length;i++){const t=svg('tspan',{dy:i?'1.15em':'0'});t.textContent=lines[i];m.text.append(t)}m.text.dataset.lines=lineKey}
  m.text.setAttribute('text-anchor',anchor);m.text.setAttribute('y',ly-(lines.length-1)*font*1.15);for(const span of m.text.children)span.setAttribute('x',tx);
  m.hit.setAttribute('x',Math.min(tx,lineEnd)-4);m.hit.setAttribute('y',ly-font*lines.length-3);m.hit.setAttribute('width',textWidth+8);m.hit.setAttribute('height',font*lines.length+10);
  m.ring.setAttribute('r',focus===m.e?11:7);m.group.classList.toggle('selected',focus===m.e);
 }
}
function setSpin(value){spin=value;get('spin').setAttribute('aria-pressed',String(value))}
function select(e){
 if(active!=='galaxy'||darkverse)return;
 if(e.security!=='zero'||(e.atlasId&&records.has(e.atlasId))){openAtlas(e.atlasId||e.id,true);return}
 focus=e;setSpin(false);velocity=[0,0];const panel=get('panel');panel.hidden=false;
 panel.style.setProperty('--accent',e.color);get('name').textContent=e.name;
 get('article').href=articleURL(e.article);dirty=true;
}
get('pirateSwitch').onclick=()=>{
 piratesVisible=!piratesVisible;
 for(const m of markers.filter(m=>m.e.security==='zero')){
  m.group.style.display=piratesVisible?'':'none';
 }
 if(!piratesVisible&&focus?.security==='zero')dismiss();
 get('pirateSwitch').textContent=piratesVisible?'Hide Pirate Space':'Show Pirate Space';
 get('pirateSwitch').setAttribute('aria-pressed',String(piratesVisible));dirty=true;
};
function dismiss(){get('panel').hidden=true;focus=null;dirty=true}
get('dismiss').onclick=dismiss;get('spin').onclick=()=>{velocity=[0,0];setSpin(!spin)};
get('labels').onclick=()=>{labels=!labels;overlay.style.display=labels?'':'none';get('labels').setAttribute('aria-pressed',String(labels));dirty=true};
function magnify(factor){zoom=clamp(zoom*factor,.55,2.8);get('zoom').textContent=Math.round(zoom*100)+'%';dirty=true}
get('plus').onclick=()=>magnify(1.2);get('minus').onclick=()=>magnify(1/1.2);
get('reset').onclick=()=>{angle=3.40;tilt=2.71;zoom=1;velocity=[0,0];magnify(1);setSpin(!motion.matches);dismiss()};
const pointers=new Map();let stamp=0;
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.classList.add('drag');setSpin(false);velocity=[0,0];stamp=performance.now()};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;
 const old=pointers.get(e.pointerId),now=[e.clientX,e.clientY],other=[...pointers].find(([id])=>id!==e.pointerId);
 if(other){const q=other[1],dist=p=>Math.hypot(p[0]-q[0],p[1]-q[1]);if(dist(old)>2)magnify(dist(now)/dist(old));velocity=[0,0]}
 else{const dx=(now[0]-old[0])*.008,dy=(now[1]-old[1])*.008,dt=Math.max(12,performance.now()-stamp);angle+=dx;tilt+=dy;velocity=[clamp(dx/dt,-.006,.006),clamp(dy/dt,-.006,.006)]}
 pointers.set(e.pointerId,now);stamp=performance.now();dirty=true};
function release(e){if(!pointers.delete(e.pointerId))return;if(!pointers.size)canvas.classList.remove('drag');if(performance.now()-stamp>90||motion.matches||e.type==='pointercancel')velocity=[0,0]}
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=release;
canvas.addEventListener('wheel',e=>{e.preventDefault();magnify(Math.exp(-clamp(e.deltaY,-100,100)*.002))},{passive:false});
canvas.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','=','-','0',' '].includes(e.key))return;e.preventDefault();if(e.key===' ')return get('spin').click();if(e.key==='0')return get('reset').click();if(['+','=','-'].includes(e.key))return magnify(e.key==='-'?1/1.15:1.15);setSpin(false);velocity=[0,0];if(e.key==='ArrowLeft')angle-=.1;if(e.key==='ArrowRight')angle+=.1;if(e.key==='ArrowUp')tilt-=.12;if(e.key==='ArrowDown')tilt+=.12;dirty=true};
document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss()});motion.addEventListener('change',()=>{if(motion.matches){setSpin(false);velocity=[0,0]}});
new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);overlay.setAttribute('viewBox','0 0 '+width+' '+height);dirty=true}).observe(get('scene'));
let last=0;function tick(ts){const dt=Math.min(50,ts-last);last=ts;
 if(!document.hidden&&!$('orbitRoot').hidden&&!darkverse){if(ready && formation<1){
  if(birthTime===null)birthTime=ts;
  formation=motion.matches?1:clamp((ts-birthTime)/2600,0,1);dirty=true;
 }if(spin){angle+=dt*.000095;dirty=true}else if(!pointers.size&&Math.abs(velocity[0])+Math.abs(velocity[1])>.000015){angle+=velocity[0]*dt;tilt+=velocity[1]*dt;const decay=Math.exp(-dt/330);velocity=velocity.map(v=>v*decay);dirty=true}
 if(dirty){draw();dirty=false}}
 requestAnimationFrame(tick)}
setSpin(spin);requestAnimationFrame(tick);

return {
 reveal(){dirty=true;dismiss()},
 destination(id){
  const m=markers.find(m=>m.e.id===id);
  if(!m)return [.5,.5];
  const point=project(2*m.e.position[0]-1,2*m.e.position[1]-1,elevations[id]||0);
  return [point[0]/width,point[1]/height];
 },
 snapshot(includeLabels=true){
  // Take pixels from the active 3D camera, including its exact inclination,
  // rotation and zoom. The legacy SVG never participates in transitions.
  const shot=surface(canvas.width,canvas.height),brush=shot.getContext('2d');
  brush.fillStyle='#09121c';brush.fillRect(0,0,shot.width,shot.height);
  brush.drawImage(canvas,0,0);
  if(includeLabels&&labels&&width&&height){
   brush.scale(shot.width/width,shot.height/height);
   for(const m of markers){
    if(!piratesVisible&&m.e.security==='zero')continue;
    const zero=m.e.security==='zero',x=Number(m.dot.getAttribute('cx')),y=Number(m.dot.getAttribute('cy'));
    brush.strokeStyle=zero?'#ff526a':m.e.color;brush.lineWidth=1.4;
    brush.setLineDash(zero?[6,3]:[]);brush.stroke(new Path2D(m.leader.getAttribute('d')||''));brush.setLineDash([]);
    brush.beginPath();if(zero){brush.moveTo(x,y-8);brush.lineTo(x+7,y);brush.lineTo(x,y+8);brush.lineTo(x-7,y);brush.closePath()}else brush.arc(x,y,7,0,Math.PI*2);
    brush.fillStyle='#101624';brush.fill();brush.stroke();brush.fillStyle=m.e.color;brush.fillRect(x-2,y-2,4,4);
    const css=getComputedStyle(m.text),size=parseFloat(css.fontSize);
    brush.font='600 '+size+'px monospace';brush.textAlign=m.text.getAttribute('text-anchor')==='end'?'right':'left';brush.globalAlpha=Number(css.opacity);
    let base=Number(m.text.getAttribute('y'));
    for(const line of m.text.children){const lx=Number(line.getAttribute('x'));brush.lineWidth=3;brush.strokeStyle='#090f18';brush.strokeText(line.textContent,lx,base);brush.fillStyle=css.fill;brush.fillText(line.textContent,lx,base);base+=1.15*size}
    brush.globalAlpha=1;
   }
  }
  return shot;
 }
};
})();

new ResizeObserver(layout).observe($('workspace'));drawMarkers();rebuild();paint();layout();
const initial=location.hash.match(/^#atlas=(.+)/);discover().then(()=>{if(initial&&active==='galaxy'&&records.has(decodeURIComponent(initial[1])))openAtlas(decodeURIComponent(initial[1]))});
