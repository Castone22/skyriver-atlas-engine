
const TEXTURE=__ATLAS__.constants["texture"];
const $=id=>document.getElementById(id),wiki=n=>'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent((places.find(p=>p.name===n)?.articleTitle||n).replaceAll(' ','_'));
// Positions are in the original 2048 × 1078 reference image.
const places=__ATLAS__.data.places;
let p=0,target=0,auto=false,W=0,H=0,dpr=1,last=0,frame=0,scale=1,panX=0,panY=0,fitScale=1,selected=null,drag=null,moved=0,pinch=null;const pointers=new Map();let lastWheelTime=-Infinity,wheelEntryGuard=false;let pendingFocus=null,category="all",rotation=.34,rotating=true,rotationAim=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;rotating=!reduced;
const planet=new Image();planet.src=TEXTURE;

const globe=document.createElement('canvas');globe.width=globe.height=1024;const gl=globe.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});let globeReady=false;
/* @atlas-function nearestRotation-58617e8657ed */
/* @atlas-function rotationUI-9c3f9726f0b6 */
let drawGlobe=()=>{};
if(gl){const vs=`attribute vec2 pos;varying vec2 uv;void main(){uv=pos;gl_Position=vec4(pos,0.,1.);}`;const fs=`precision highp float;
varying vec2 uv;
uniform sampler2D tex;
uniform float turn;
const float PI=3.14159265359;
vec3 lightDirection=normalize(vec3(-.68,.36,.64));
vec2 sphereUV(vec3 n){float tilt=-.10;vec3 local=vec3(n.x*cos(tilt)-n.y*sin(tilt),n.x*sin(tilt)+n.y*cos(tilt),n.z);return vec2(fract(atan(local.x,local.z)/(2.*PI)+turn),.5-asin(clamp(local.y,-1.,1.))/PI);}
float cloudDensity(vec3 c){return smoothstep(.17,.56,dot(c,vec3(.22,.56,.22)));}
void main(){
 vec2 q=uv*1.035;float rr=dot(q,q);
 if(rr>1.){float radius=sqrt(rr);float edge=exp(-(radius-1.)*120.)*(1.-smoothstep(1.02,1.035,radius));vec3 rimN=normalize(vec3(q,.02));float sun=max(0.,dot(rimN,lightDirection));float alpha=edge*(.065+.50*pow(sun,.7));gl_FragColor=vec4(.22,.43,.60,alpha);return;}
 // Ray/sphere intersection for a perspective camera 3.5 planetary radii out.
 vec3 eye=vec3(0.,0.,3.5),ray=normalize(vec3(q/sqrt(3.5*3.5-1.),-1.));float b=dot(eye,ray);float h=b*b-dot(eye,eye)+1.;
 if(h<0.){gl_FragColor=vec4(0.);return;}
 vec3 n=normalize(eye+ray*(-b-sqrt(h)));vec2 st=sphereUV(n);vec3 albedo=texture2D(tex,st).rgb;
 float density=cloudDensity(albedo),du=1./1774.,dv=1./887.;
 float east=cloudDensity(texture2D(tex,vec2(fract(st.x+du),st.y)).rgb),north=cloudDensity(texture2D(tex,st+vec2(0.,-dv)).rgb);
 vec3 tangent=normalize(vec3(n.z,0.,-n.x));vec3 vertical=normalize(cross(n,tangent));
 vec3 cloudNormal=normalize(n+tangent*(density-east)*5.+vertical*(density-north)*5.);
 float sun=dot(n,lightDirection),cloudSun=max(0.,dot(cloudNormal,lightDirection));
 float daylight=smoothstep(-.055,.075,sun);float diffuse=max(0.,sun);
 float shadow=cloudDensity(texture2D(tex,vec2(fract(st.x-.0014),st.y+.0008)).rgb);
 vec3 linear=pow(albedo,vec3(2.2));float cloudLight=mix(diffuse,cloudSun,density*.65);
 linear*=.016+daylight*(.95*cloudLight+.07);linear*=1.-shadow*(1.-density)*.18*daylight;
 // Restrained glint on dark ocean-like areas; no invented surface lights.
 float water=(1.-smoothstep(.10,.24,dot(albedo,vec3(.3,.5,.2))))*(1.-density);
 vec3 halfVector=normalize(lightDirection+normalize(eye-n));float glint=pow(max(0.,dot(n,halfVector)),110.)*water*.035*daylight;
 linear+=vec3(.65,.77,.88)*glint;
 float rim=pow(1.-max(0.,dot(n,normalize(eye-n))),3.6);float scatter=rim*(.018+.12*max(0.,sun));linear+=vec3(.16,.36,.56)*scatter;
 vec3 color=pow(max(linear,vec3(0.)),vec3(1./2.2));gl_FragColor=vec4(color,1.);
}`;
function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh}const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);gl.useProgram(program);const buff=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buff);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);const turn=gl.getUniformLocation(program,'turn');function upload(){gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,planet);globeReady=true}planet.addEventListener('load',upload);if(planet.complete&&planet.naturalWidth)upload();let lastGlobeAngle=NaN,lastGlobeFrame=0;drawGlobe=angle=>{if(!globeReady)return;let now=performance.now();if(angle===lastGlobeAngle||now-lastGlobeFrame<30)return;lastGlobeAngle=angle;lastGlobeFrame=now;gl.uniform1f(turn,angle);gl.viewport(0,0,1024,1024);gl.drawArrays(gl.TRIANGLES,0,6)}}else{const gx=globe.getContext('2d');globe.width=globe.height=320;const source=document.createElement('canvas');source.width=1024;source.height=512;let pixels=null;const sx=source.getContext('2d',{willReadFrequently:true});function upload(){sx.drawImage(planet,0,0,1024,512);pixels=sx.getImageData(0,0,1024,512).data}planet.addEventListener('load',upload);if(planet.complete&&planet.naturalWidth)upload();let prior=-99;drawGlobe=angle=>{if(!pixels||Math.abs(angle-prior)<.002)return;prior=angle;let output=gx.createImageData(320,320);for(let y=0;y<320;y++)for(let x=0;x<320;x++){let nx=(x-160)/160,ny=(160-y)/160,rr=nx*nx+ny*ny;if(rr>1)continue;let nz=Math.sqrt(1-rr),u=((Math.atan2(nx,nz)/(2*Math.PI)+angle)%1+1)%1,v=.5-Math.asin(ny)/Math.PI,si=(Math.min(511,Math.floor(v*512))*1024+Math.floor(u*1024))*4,di=(y*320+x)*4,light=clamp(nx*-.56+ny*.39+nz*.73),shade=.16+light;for(let k=0;k<3;k++)output.data[di+k]=pixels[si+k]*shade;output.data[di+3]=255}gx.putImageData(output,0,0)}}

const c=$('space'),ctx=c.getContext('2d'),cloud=$('clouds'),cc=cloud.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,v)=>{let t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
let seed=71;/* @atlas-function rand-990344079c5a */const stars=Array.from({length:230},()=>[rand(),rand(),rand()*1.2+.25,rand()*.55+.12]);
// A reusable volumetric-looking noise layer, generated locally without network assets.
const fog=document.createElement('canvas');fog.width=fog.height=384;const fx=fog.getContext('2d'),im=fx.createImageData(384,384),grid=Array.from({length:65*65},()=>rand());
/* @atlas-function noise-148ea094fd92 */
for(let y=0;y<384;y++)for(let x=0;x<384;x++){let n=0,amp=.55,f=3;for(let j=0;j<5;j++){n+=noise(x/384*f,y/384*f)*amp;amp*=.52;f*=2}let i=(y*384+x)*4;im.data[i]=135+n*75;im.data[i+1]=156+n*66;im.data[i+2]=171+n*60;im.data[i+3]=clamp((n-.27)*1.8)*255*(1-smooth(.55,1,Math.hypot((x-192)/192,(y-192)/192)))}fx.putImageData(im,0,0);
/* @atlas-function resize-aec8d96ecc4f */
/* @atlas-function fitMap-f865b10d5b3b */
/* @atlas-function constrain-717e3b0220a5 */
/* @atlas-function updateMap-de691a63702e */
/* @atlas-function zoom-06a8e0e21ab3 */
/* @atlas-function go-b79478f253f0 */
/* @atlas-function choose-d6d508233ab1 */
/* @atlas-function focusPlace-0f490c824840 */
/* @atlas-function toggleIndex-9a72808f9c1c */


const geometry=__ATLAS__.constants["boundaries"],NS='http://www.w3.org/2000/svg',svg=$('vectorMap');
/* @atlas-function el-9145f60d5f3a */
svg.innerHTML=`<defs><pattern id="grid" width="128" height="128" patternUnits="userSpaceOnUse"><path d="M128 0H0V128" fill="none" stroke="#7893a8" stroke-width=".65" opacity=".13"/></pattern><pattern id="subgrid" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#7595ac" opacity=".14"/></pattern><pattern id="hazard" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V12" stroke="#bb626b" stroke-width="2" opacity=".18"/></pattern><linearGradient id="water" x2="0" y2="1"><stop stop-color="#0d1825"/><stop offset="1" stop-color="#080e18"/></linearGradient></defs>`;
el('rect',{width:2048,height:1078,fill:'url(#water)'});el('rect',{width:2048,height:1078,fill:'url(#grid)'});el('rect',{width:2048,height:1078,fill:'url(#subgrid)'});
const colors=__ATLAS__.constants["palette"];
/* @atlas-function placeLink-bf0a6bd282b7 */
for(const[name,path]of Object.entries(geometry)){if(name==='lakes')continue;el('path',{d:path,class:'coast'});const place=places.find(p=>p.name===name),a=placeLink(place);el('path',{d:path,class:'region',fill:name==='Makal Bound'?'#261d2a':colors[name]},a);if(name==='Makal Bound'){el('path',{d:path,fill:'url(#hazard)',stroke:'#ae616d','stroke-width':2,'stroke-dasharray':'7 4','pointer-events':'none'},a)}}
el('path',{d:geometry.lakes,fill:'#143248',stroke:'#506b91','stroke-width':1.2});

// Top-down shaded elevation: connected fold belts, foothills and rift shoulders.
const landClip=el('clipPath',{id:'landClip'},svg.querySelector('defs'));
for(const [name,path] of Object.entries(geometry))if(!['Makal Bound','lakes'].includes(name))el('path',{d:path},landClip);
el('image',{x:0,y:0,width:2048,height:1078,href:'atlas-asset:25312c7baeb1973438b01213bee39cb962d7b02fbdbf0bf416e99c24557cdc66','pointer-events':'none','clip-path':'url(#landClip)',class:'shaded-relief'});
const contours=__ATLAS__.constants["contours"];const reliefContours=el('g',{'clip-path':'url(#landClip)',class:'relief-contours','pointer-events':'none'});for(const c of contours)el('path',{d:c.d,fill:'none',stroke:'#aabbb6','stroke-width':.65,'vector-effect':'non-scaling-stroke'},reliefContours);
const rivers=el('g',{'clip-path':'url(#landClip)','pointer-events':'none',class:'drainage'});
// Drainage follows the foreland and the interior basin; tributaries join downstream.
for(const d of [
'M1393 490C1401 510 1381 527 1394 547S1430 584 1420 605S1410 657 1427 675L1407 699',
'M1471 492Q1456 523 1441 539T1409 569',
'M1352 474Q1345 501 1365 515T1390 539',
'M1319 421Q1346 393 1354 360T1346 301L1340 278',
'M1420 424Q1426 386 1398 369T1354 352',
'M1341 228Q1330 195 1297 182T1215 159L1191 132',
'M1799 419Q1774 439 1766 465T1717 490Q1690 497 1666 483',
'M1791 600Q1759 615 1733 605T1670 591Q1641 597 1619 626',
'M726 325Q697 346 692 367T668 401',
'M283 774Q316 785 329 808T350 846'
])el('path',{d,fill:'none',stroke:'#648a99','stroke-width':1.2,'vector-effect':'non-scaling-stroke','stroke-linecap':'round',opacity:.58},rivers);
// The named mountain belt and summit retain their Codex destinations.
const ozurzk=places.find(p=>p.name==='Ozurzk Mountains'),mountKadaym=places.find(p=>p.name==='Mount Kadaym');
const terrain=placeLink(ozurzk);terrain.classList.add('terrain-link');
el('path',{d:'M1218 447Q1302 397 1384 433T1538 425L1548 468Q1451 535 1370 497T1218 475Z',fill:'transparent',class:'range-hit'},terrain);
const summit=placeLink(mountKadaym);summit.classList.add('terrain-link');
el('circle',{cx:1412,cy:477,r:14,fill:'transparent'},summit);
el('circle',{cx:1412,cy:477,r:3,class:'summit-marker',fill:'#d4d7c0',stroke:'#132633','stroke-width':1.5},summit);
el('path',{d:'M1417 481L1504 493L1535 493',fill:'none',stroke:'#a9b8b9','stroke-width':.7,'pointer-events':'none'},summit);

const labelAdjust=__ATLAS__.constants["labelOffsets"];
for(const place of places.filter(p=>!['City','Lost settlement'].includes(p.kind))){let[x,y]=labelAdjust[place.name]||[place.x,place.y];if(place.name==='Ozmani Ocean'&&place.x>1000){x=1880;y=905}const a=placeLink(place);let cls=place.kind==='Region'?'region-label':place.kind==='Ocean'?'ocean-label':place.kind==='Storm region'?'storm-name':place.kind==='Makal boundary'?'hazard-label':'minor-label';let rotation=place.name==='Wezmiach Ocean'?76:place.name==='Ozmani Ocean'?(place.x>1000?-42:-78):place.name==='Western Makal Wall'?-58:place.name==='Eastern Makal Wall'?72:0;const text=el('text',{x,y,class:cls+' map-label','text-anchor':'middle',transform:`rotate(${rotation} ${x} ${y})`},a);text.textContent=place.kind==='Region'||place.kind==='Storm region'?place.name.toUpperCase():place.name;}
for(const place of places.filter(p=>['City','Lost settlement'].includes(p.kind))){const a=placeLink(place),x=place.x,y=place.y+6;el('circle',{cx:x,cy:y,r:18,fill:'transparent'},a);el('circle',{cx:x,cy:y,r:10,class:'city-ring'},a);if(place.name==='Kurzk'){el('path',{d:`M${x} ${y-7}L${x+7} ${y}L${x} ${y+7}L${x-7} ${y}Z`,class:'city-marker'},a)}else el('circle',{cx:x,cy:y,r:4.5,class:'city-marker'},a);let tx=x+17,ty=y+5,anchor='start';if(x>1700){tx=x-17;anchor='end'}if(place.name==='Vendamazkin'){tx=x;ty=y+27;anchor='middle'}if(place.name==='Ixnamar'){tx=x-18;ty=y-7;anchor='end'}const txt=el('text',{x:tx,y:ty,class:'city-label map-label','text-anchor':anchor},a);txt.textContent=place.name;if(place.kind==='Lost settlement'){txt.setAttribute('fill','#c58389');el('path',{d:`M${x-6} ${y-6}L${x+6} ${y+6}M${x+6} ${y-6}L${x-6} ${y+6}`,stroke:'#bb7884','stroke-width':1.5},a)}}
// Chart frame and restrained reference marks.
el('rect',{x:14,y:14,width:2020,height:1050,fill:'none',stroke:'#688299','stroke-width':1,opacity:.25});for(let x=128;x<2048;x+=128){el('path',{d:`M${x} 14v8 M${x} 1064v-8`,stroke:'#8096a8','stroke-width':1,opacity:.5})}const legend=el('g',{'pointer-events':'none'});el('text',{x:42,y:1030,fill:'#8ca3b3',style:'font:12px ui-monospace,monospace;letter-spacing:2px'},legend).textContent='MAHANZK / GEOGRAPHIC CHART';el('text',{x:42,y:1050,fill:'#637c8f',style:'font:10px ui-monospace,monospace;letter-spacing:1px'},legend).textContent='◇ CAPITAL     ○ SETTLEMENT     × LOST SETTLEMENT';


/* @atlas-function list-83d511a7dd7f */
/* @atlas-function render-88a93eaa378f */
$('enter').onclick=()=>go(1);$('orbitButton').onclick=()=>go(0);$('stepOrbit').onclick=()=>go(0);$('stepSurface').onclick=()=>go(1);$('stepCloud').onclick=()=>go(.53);$('plus').onclick=()=>adjustCamera(.13);$('minus').onclick=()=>adjustCamera(-.13);$('fit').onclick=()=>{if(target>=1)fitMap();else go(0)};$('indexToggle').onclick=()=>toggleIndex($('index').hidden);$('closeIndex').onclick=()=>toggleIndex(false);$('search').oninput=list;$('closeDetail').onclick=()=>{$('detail').hidden=true};$('aboutButton').onclick=()=>$('about').showModal();$('closeAbout').onclick=()=>$('about').close();
/* @atlas-function adjustCamera-79269f6b188e */
$('stage').addEventListener('wheel',e=>{
 if(e.target.closest('aside,dialog'))return;
 e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?H:1),now=performance.now(),gap=now-lastWheelTime;lastWheelTime=now;
 const r=$('stage').getBoundingClientRect();adjustCamera(clamp(-pixels*.0014,-.28,.28),e.clientX-r.left,e.clientY-r.top,'wheel',gap);
},{passive:false});
$('stage').addEventListener('selectstart',e=>{if(!e.target.closest('input,textarea,[contenteditable="true"]'))e.preventDefault()});
$('stage').addEventListener('dragstart',e=>e.preventDefault());
$('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('input,textarea,[contenteditable="true"]'))window.getSelection()?.removeAllRanges()});
$('stage').addEventListener('dblclick',e=>{if(e.target.closest('aside,button,a'))return;if(p<.9999)go(1);else zoom(1.6)});
$('stage').addEventListener('keydown',e=>{
 if(e.target.matches('input,button,a'))return;
 if(!['+','=','-','0','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.key))return;
 e.preventDefault();
 if(e.key==='Escape')go(0);
 else if(e.key==='0'){if(target>=1)fitMap();else go(0)}
 else if(e.key==='+'||e.key==='=')adjustCamera(.13);
 else if(e.key==='-')adjustCamera(-.13);
 else if(e.key==='Enter')go(1);
 else if(p<.9999){if(e.key==='ArrowUp')adjustCamera(.13);else if(e.key==='ArrowDown')adjustCamera(-.13);else{rotation+=(e.key==='ArrowLeft'?-.025:.025);rotating=false;rotationAim=null;rotationUI()}}
 else{panX+=e.key==='ArrowLeft'?65:e.key==='ArrowRight'?-65:0;panY+=e.key==='ArrowUp'?65:e.key==='ArrowDown'?-65:0;updateMap()}
});
// Direct globe manipulation, with pinch feeding the same continuous zoom controller.
const orbitTouches=new Map();let orbitPinch=0;
$('stage').addEventListener('pointerdown',e=>{
 if(p>=.9999||e.target.closest('aside,button,a,dialog'))return;
 orbitTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});$('stage').setPointerCapture(e.pointerId);$('stage').focus();
 if(orbitTouches.size===2){const[a,b]=[...orbitTouches.values()];orbitPinch=Math.hypot(a.x-b.x,a.y-b.y)}
});
$('stage').addEventListener('pointermove',e=>{
 const previous=orbitTouches.get(e.pointerId);if(!previous)return;
 orbitTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(orbitTouches.size===2){const[a,b]=[...orbitTouches.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(orbitPinch)adjustCamera(Math.log(distance/orbitPinch)*.8);orbitPinch=distance}
 else{rotation-=(e.clientX-previous.x)/Math.max(500,W);rotationAim=null;rotating=false;rotationUI()}
});
for(const event of ['pointerup','pointercancel'])$('stage').addEventListener(event,e=>{orbitTouches.delete(e.pointerId);orbitPinch=0});
const vp=$('mapViewport');vp.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:panX,py:panY};if(!e.target.closest('a'))vp.setPointerCapture(e.pointerId);vp.classList.add('dragging');if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale}}});window.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const[a,b]=[...pointers.values()],r=vp.getBoundingClientRect();zoom(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance/scale,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);moved=20}else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=Math.max(moved,Math.hypot(dx,dy));panX=drag.px+dx;panY=drag.py+dy;updateMap()}});/* @atlas-function end-9ad662e1b2eb */window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
$('download').onclick=()=>{const html='<!doctype html>\n'+document.documentElement.outerHTML;const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='Mahanzk-Geographic-Atlas.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('rotateToggle').onclick=()=>{rotating=!rotating;rotationAim=null;rotationUI()};$('stormSide').onclick=()=>{rotationAim=nearestRotation(.34);rotating=false;rotationUI()};$('clearSide').onclick=()=>{rotationAim=nearestRotation(.84);rotating=false;rotationUI()};$('layerButton').onclick=()=>{let v=$('vectorMap').classList.toggle('hide-labels');$('layerButton').setAttribute('aria-pressed',String(!v))};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));list()});rotationUI();list();resize();new ResizeObserver(resize).observe($('stage'));if(new URLSearchParams(location.search).get('view')==='surface'){p=target=1}requestAnimationFrame(render);
