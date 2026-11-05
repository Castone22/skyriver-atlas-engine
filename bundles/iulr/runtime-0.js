
const DATA = __ATLAS__.data;
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={'Ferryman’s Rest':"Ferryman's Rest",'Circa’s Triad':"Circa's Triad",'Ysh Kha’lah':"Ysh Kha'lah",'Da’zha':"Da'zha"};
const canonicalTitle=name=>articleTitles.get(normalizedName(name))||name;
const referenceTargets=new Map([...(DATA.stations||[]),...(DATA.satellites||[])].filter(r=>r.referencePage).map(r=>[r.name,r]));
/* @atlas-function url-28eb0c70ab46 */
const link=(name,label=name,cls='')=>`<a class="${cls}" href="${url(name)}" target="_blank" rel="noopener">${esc(DATA.worlds[name]&&label===name?planetName(name):label)}</a>`;
/* @atlas-function systemNameTitle */
/* @atlas-function hasOrbitChart */
/* @atlas-function systemArticleTitle-d0f52db05ad1 */
/* @atlas-function systemLink */
/* @atlas-function systemArticleRecord */
const TIER_NAMES={1:'Quarantined',2:'Suppressed',3:'Active Threat',4:'High Contamination',5:'Critical Infestation'};
const TIER_COLORS={1:'#c7bb86',2:'#c9a375',3:'#da8b7c',4:'#df6c87',5:'#ec5391'};
const color=s=>s.tier?TIER_COLORS[s.tier]:s.kind==='hazard'||s.kind==='uncertain'?'#e58088':s.affiliation==='United Federation of Kadaym'?'#dfbd78':s.kind==='context'||s.kind==='neutral'?'#a9afc5':DATA.regions[s.region]?.color||'#8ac9ee';
const allRecords=[...DATA.systems,...DATA.unplaced];
const EXOTIC_TYPES={'pulsar':'Pulsar','magnetar':'Magnetar','cataclysmic-variable':'Cataclysmic variable'};
let highlightedRegion='avendonraik';
let view='avendonraik',scope='region',selected=null,selectedWorld=null,vb={x:0,y:0,w:1000,h:1000},baseWidth=1000,drag=null,moved=false,pointers=new Map(),pinch=null,searchTimer;
const flags={federation:true,context:true,hazard:true};
/* @atlas-function atlasParams */
let widgetRegion=null;
const widgetMode=atlasParams().get('view')==='widget';
const embedMode=widgetMode||atlasParams().get('embed')==='1';
let routeReady=false,routeChanging=0,restoringRoute=false,regionalCamera=null,markerDossierTimer=0;
const MARKER_DOSSIER_DELAY=600;
/* @atlas-function cancelMarkerDossier */
/* @atlas-function setDetailOpen */
/* @atlas-function deferMarkerDossier */

const normalizedName=value=>String(value||'').replace(/[ħĦ]/g,'h').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const articleTitles=new Map();
for(const record of [...allRecords,...Object.values(DATA.worlds),...DATA.stations,...DATA.satellites,...DATA.entities,...Object.values(DATA.regions),...DATA.historicalSites]){
 for(const label of [record.name,...(record.aliases||[])])articleTitles.set(normalizedName(label),record.articleTitle||record.name);
}
// Single-star systems share their star's name. System links use the full article title.
for(const system of DATA.systems){
 for(const star of system.stars){
  for(const label of [star.designation,...(star.aliases||[])])articleTitles.set(normalizedName(label),star.articleTitle);
 }
}

// Planet article title sync: atlas names are stable IDs, Codex titles are live presentation labels.
// A MediaWiki move normally creates a redirect; an existing page ID also survives a move
// with no redirect. Previously discovered page IDs are cached per browser for that case.
const PLANET_TITLE_CACHE_KEY='skyriver-iulr-planet-articles-v1';
const PLANET_TITLE_REFRESH_MS=180000;
let planetTitleCache={ids:{},names:{}};
try{
 const stored=JSON.parse(localStorage.getItem(PLANET_TITLE_CACHE_KEY)||'null');
 if(stored&&typeof stored==='object')planetTitleCache={ids:stored.ids||{},names:stored.names||{}};
}catch{}
const planetArticleIDs=new Map(),planetResolvedTitles=new Map();
for(const name of Object.keys(DATA.worlds)){
 const id=Number(planetTitleCache.ids[name]);
 if(Number.isSafeInteger(id)&&id>0)planetArticleIDs.set(name,id);
 const title=planetTitleCache.names[name];
 if(typeof title==='string'&&title.trim())planetResolvedTitles.set(name,title);
}
/* @atlas-function planetName-27a93d2d3c84 */
/* @atlas-function planetArticleName */
/* @atlas-function wikiTitleKey */
/* @atlas-function persistPlanetTitleCache */
let planetTitleSyncInFlight=null,planetTitleLastChecked=0;
/* @atlas-function planetWikiQuery */
/* @atlas-function planetQueryChunks */
/* @atlas-function planetNamesFromQuery */
/* @atlas-function syncPlanetArticleTitles */
/* @atlas-function triggerPlanetTitleCheck */

/* @atlas-function resolveRegion */
/* @atlas-function matchesRecord-769ca58b58d3 */
/* @atlas-function resolveSystem */
/* @atlas-function resolveObjectName */
/* @atlas-function matchesSearch-6e5b90f05584 */
// Fragment links accept the friend's human-readable names, IDs and aliases.
/* @atlas-function resolveNamedRoute */
/* @atlas-function resolveHashRoute */
/* @atlas-function resolvePlanetRoute */
let lastRestoredURL='';
/* @atlas-function routeSnapshot-32e4b784df70 */
/* @atlas-function routeURL-7c04f49ba3ff */
/* @atlas-function persistRoute */
/* @atlas-function beginNavigation */
/* @atlas-function endNavigation */
/* @atlas-function restoreRoute-415cec56bec0 */
addEventListener('popstate',event=>restoreRoute(event.state));
addEventListener('hashchange',()=>{if(location.href!==lastRestoredURL)restoreRoute(null,true)});

/* @atlas-function svg */
/* @atlas-function textSVG-4271b37f08ac */
/* @atlas-function objectTarget */
/* @atlas-function svgLink-b772889af571 */

const ATLAS_BOUNDS=[40,60,2790,2490];
/* @atlas-function regionPath */
/* @atlas-function updateRegionDisplay */
/* @atlas-function highlightRegion */
/* @atlas-function draw-ab708dae8498 */
/* @atlas-function updateSelection */
/* @atlas-function updateVisibility-3bdaa5a55abc */
/* @atlas-function zoomPercent */
// At least these displayed percentages. Short or narrow charts need more zoom
// to give each label the same readable space as a full-size chart.
const LABEL_ZOOM={overview:{active:[120,150],neighbor:[150,220]},regional:{active:[70,90],neighbor:[90,135]}};
/* @atlas-function labelThresholds-e09969274c09 */
/* @atlas-function scaleLabels-5982cc7d7bb0 */
/* @atlas-function applyView */
/* @atlas-function fitBounds */
/* @atlas-function setView-b3d7ffb7defe */
/* @atlas-function fitChart */
/* @atlas-function zoom-63c95ce3e23e */
/* @atlas-function select-ea9ed057f437 */
/* @atlas-function tierMarkup */
/* @atlas-function renderMapLegend-e99aba52b66e */
/* @atlas-function affiliationMarkup */
/* @atlas-function searchRecords */
/* @atlas-function classificationTerms-549b06cadb0d */
/* @atlas-function searchTerms-e3ac9dcacf41 */
/* @atlas-function searchObject */
/* @atlas-function renderIndex-0db203929943 */
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let orbitPaused=reducedMotion.matches,orbitFrame=0,orbitClock=0,orbitLastTime=null;
const worldColors={'Mahanzk':'#90bcd2','Zelenzk':'#c4a5d9','Helkana':'#91c4a1','Vardis Prime':'#c9a08b','Rakazk':'#c78e74','Zekozha':'#9bcdda','Qerzhek':'#b7c9e2','Prathia':'#9ec2a7'};
const STATION_TYPES={
 'TORA':{color:'#62d9ff',symbol:'◌'},
 'Civil Engineering':{color:'#83c9de',symbol:'⊞',path:'M-5-5H5V5H-5Z M0-7V7 M-7 0H7'},
 'Habitation':{color:'#9bcca3',symbol:'◎',path:'M-6 0A6 6 0 1 0 6 0A6 6 0 1 0-6 0 M-6 0H6 M0-6V6'},
 'Military':{color:'#b8a8e8',symbol:'▽',path:'M-6-5H6V0Q5 5 0 8Q-5 5-6 0Z M-3-1H3'},
 'Weaponry':{color:'#e69b91',symbol:'◇',path:'M0-7L7 0 0 7-7 0Z M-3 0H3 M0-3V3'},
 'Industry':{color:'#dab879',symbol:'▥',path:'M-6 6V-3L-2 0V-3L2 0V-6H6V6Z M-3 3H3'},
 'Other':{color:'#9bb6c8',symbol:'✧',path:'M0-7L6-3V3L0 7-6 3V-3Z M-3 0H3 M0-3V3'}
};
let stationOverview=false;
let systemFocused=false,systemZoom=1,planetFocus=null,showBelts=true;
const stationFilters=new Set(Object.keys(STATION_TYPES));
const siteType=name=>/station|triad|jumpgate/i.test(name)?'Station / structure':/colony/i.test(name)?'Colony':'World';
/* @atlas-function stationRecords-f53b5a9f2345 */
/* @atlas-function entityRecords */
/* @atlas-function starRecords-edf881d7ebd2 */
/* @atlas-function focusableWorld-de83f9794db3 */
/* @atlas-function localChartParent */
/* @atlas-function localBodies */
/* @atlas-function moonRecords */
/* @atlas-function systemBodies */
// Size and colour keep illustrative bodies subordinate to named Codex worlds.
const illustrativeTypes={
 cinder:[2.5,'#c38970'],rocky:[2.8,'#a29b91'],desert:[3.3,'#cfaa76'],
 icy:[2.6,'#a6c1cd'],gas:[4.9,'#c7aa83'],ringed:[4.6,'#baab89'],'ice-giant':[4.2,'#76adbb']
};
/* @atlas-function illustrativePlanet */
/* @atlas-function solarLayout-9246e73b7291 */
/* @atlas-function ordinal */
/* @atlas-function orbitalFact-99b199ca0c90 */
/* @atlas-function worldRecord */
/* @atlas-function bodyKey-76d2ce6780e1 */
const TORA_CLASS='Terranos Omnidirectional Reflector Array';
const toraParts=[
 {title:'Axial mast',label:'MAST',x:329,y:95,lx:420,ly:70,note:'The upper tower narrows to a bright axial tip. Its internal equipment is unspecified in the class record.'},
 {title:'Annular disc',label:'ANNULUS',x:372,y:190,lx:435,ly:129,note:'The disc encircles the narrow neck between the axial mast and the hub. Its wide rim is visible edge-on in the class illustration.'},
 {title:'Reflector panels',label:'PANELS',x:195,y:174,lx:96,ly:159,note:'Three pairs of broad, segmented panels extend from the central structure. The array network screens Union systems from distant observation.'},
 {title:'Equatorial hub',label:'HUB',x:295,y:258,lx:121,ly:356,note:'The panel trusses meet at the cyan-banded hub. The class carries approximately 2,500 crew. The deck plan is undisclosed.'},
 {title:'Ventral spindle',label:'SPINDLE',x:342,y:377,lx:445,ly:408,note:'A stepped lower hull tapers to a second axial tip. The class power plant is classified and its position is unknown.'}
];

/* @atlas-function hardware */
/* @atlas-function toraHubDetail */
/* @atlas-function toraElevation */
/* @atlas-function stationScreen-9033d810843c */
/* @atlas-function highlightPart-3b673ff30d38 */
/* @atlas-function openStation-8874c87f6a8d */
/* @atlas-function closeStation */
/* @atlas-function bindToraName */
/* @atlas-function bindToraControl */

/* @atlas-function cloakDecoration */
/* @atlas-function cloakBadge */
/* @atlas-function silentDecoration */
/* @atlas-function notableSitesMarkup */
/* @atlas-function systemView-11dd718e88f5 */
/* @atlas-function planetView-cf20bf164e17 */
/* @atlas-function mountPlanet-0bd1b42f8c6a */
/* @atlas-function setPlanetFocus */

/* @atlas-function stopOrbit */
/* @atlas-function blackHoleGlyph */
/* @atlas-function exoticGlyph */
/* @atlas-function deadStarGlyph */
/* @atlas-function nefandumGlyph */
const STATION_SILHOUETTES={
 'Civil Engineering':{hull:'M-9-7H-5V5H5V-7H9V9H-9Z',detail:'M-2-5H2V5H-2Z M-9-3H-5 M5-3H9 M-9 3H-5 M5 3H9'},
 'Habitation':{hull:'M-7 0A7 7 0 1 0 7 0A7 7 0 1 0-7 0 M-3 0A3 3 0 1 1 3 0A3 3 0 1 1-3 0 M-13-4H-9V4H-13Z M9-4H13V4H9Z',detail:'M-9 0H9 M0-7V7'},
 'Military':{hull:'M0-10L6-4H10V4H6L0 10-6 4H-10V-4H-6Z',detail:'M-3-4H3V4H-3Z M-8-2V2 M8-2V2'},
 'Weaponry':{hull:'M-4-5H4V6H-4Z M-9-2H-5V4H-9Z M5-2H9V4H5Z M-2-12H2V-5H-2Z',detail:'M-6 1H6 M0 6V10 M-4 10H4'},
 'Industry':{hull:'M-10-5Q-7-8-4-5V5Q-7 8-10 5Z M-3-7Q0-10 3-7V7Q0 10-3 7Z M4-5Q7-8 10-5V5Q7 8 4 5Z',detail:'M-10 0H10 M-7-5V5 M7-5V5 M0-7V7'},
 'Other':{hull:'M-8-8Q0 2 8-8Q6 3 0 4Q-6 3-8-8Z M-3 6H3V10H-3Z',detail:'M0-8V6 M-10 10H10 M-4-3L0-8 4-3'}
};
/* @atlas-function stationGlyph */
let planetClickTimer;
/* @atlas-function bindOrbitalSelection */
/* @atlas-function drawBelt */
/* @atlas-function mountSystem-368a20b29dd5 */
/* @atlas-function setSystemFocus-b1b2fd2900d0 */

/* @atlas-function syncSystemFocus-83b192ca5f37 */
/* @atlas-function applySystemZoom */
/* @atlas-function bindSystemControls-da72bdbb7f06 */
/* @atlas-function chooseSystemWorld */
/* @atlas-function toggleAtlasMotion */
reducedMotion.addEventListener('change',e=>{if(e.matches){orbitPaused=true;renderDetail()}});
/* @atlas-function imageRecord */
// Read the current own-article infobox; embedded images remain the offline fallback.
const liveImages=new Map(),liveImageRequests=new Map(),IMAGE_REFRESH_MS=60000;
let liveImageTimer=0;
/* @atlas-function splitWiki */
/* @atlas-function infoboxFile */
/* @atlas-function legacyInfobox */
/* @atlas-function leadInfobox */
/* @atlas-function fileFromInfobox */
const dossierFields=[
 ['Population','population'],['Capital','planetary capital','capital','capital city','system capital'],
 ['Type','object type','type','classification','class','structure type'],['Region','region'],['System','star system','system'],
 ['Central body','central body','central body(s)','suns'],['Parent body','parent body'],['Orbital position','orbital position'],
 ['Natural satellites','natural satellites'],['Sovereignty','current sovereignty','controlling faction','sovereignty'],
 ['Status','status'],['Location','location'],['Role','role','role in logistics'],['Mass','mass'],['Radius','radius'],['Rotation period','rotation period'],['QERA production','qera production'],['Access restrictions','access restrictions']
];
/* @atlas-function dossierFacts */
/* @atlas-function factValue */
/* @atlas-function factGrid */
/* @atlas-function bodyFacts-5cdfe803c5e8 */
/* @atlas-function safeImageURL */
/* @atlas-function imageAPI */
/* @atlas-function currentImageTitle-dba1dd671d78 */
/* @atlas-function loadLiveImage-3ce892422fb7 */
/* @atlas-function embeddedImageMarkup */
/* @atlas-function imageMarkup */
/* @atlas-function referenceImage */
/* @atlas-function stopImageRefresh */
/* @atlas-function refreshVisibleImage */
addEventListener('focus',()=>refreshVisibleImage(true));addEventListener('online',()=>refreshVisibleImage(true));document.addEventListener('visibilitychange',()=>document.hidden?stopImageRefresh():refreshVisibleImage(true));

/* @atlas-function renderDetail-04e12e93caa8 */
/* @atlas-function bindDetail */
/* @atlas-function drawMinimap-a0c41a19f64d */
/* @atlas-function buildNotes */

/* @atlas-function downloadHTML */
$('regionSelect').onchange=()=>setView($('regionSelect').value);document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;document.querySelectorAll('[data-scope]').forEach(n=>n.classList.toggle('active',n===b));renderIndex()});$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderIndex,90)};
$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);$('fit').onclick=fitChart;$('minimap').onclick=()=>setView('all');$('minimap').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setView('all')}};
['labels','borders','hexes','majorOnly'].forEach(id=>$(id).onchange=updateVisibility);document.querySelectorAll('[data-filter]').forEach(c=>c.onchange=()=>{flags[c.dataset.filter]=c.checked;updateVisibility()});
$('filterBtn').onclick=()=>{const open=$('filters').classList.toggle('hidden');$('filterBtn').setAttribute('aria-expanded',String(!open))};
$('embedDetails').onclick=()=>setDetailOpen(!$('detail').classList.contains('open'),true);
for(const [id,collapsed] of [['toggleIndexPanel','index-collapsed'],['toggleDetailPanel','dossier-collapsed']]){
 const button=$(id);
 button.onclick=()=>{
  const hidden=$('atlasLayout').classList.toggle(collapsed);
  button.setAttribute('aria-expanded',String(!hidden));
  if(id==='toggleIndexPanel')$('indexToggle').setAttribute('aria-expanded',String(!hidden));
  resizeChart();
 };
}
$('indexToggle').onclick=()=>$('toggleIndexPanel').click();$('mobileInspect').onclick=()=>setDetailOpen(true,true);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Fullscreen is unavailable in this view.')}};
['sourcesBtn','footerNotes'].forEach(id=>$(id).onclick=()=>$('notes').showModal());$('closeNotes').onclick=()=>$('notes').close();$('notes').onclick=e=>{if(e.target===$('notes')){const b=$('notes').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('notes').close()}};$('download').onclick=downloadHTML;
const map=$('map');map.addEventListener('dragstart',event=>event.preventDefault());map.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Math.max(-100,Math.min(100,e.deltaY))*.002),e.clientX,e.clientY)},{passive:false});
map.addEventListener('pointerdown',e=>{if(e.target.closest('a'))return;e.preventDefault();moved=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});map.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,v:{...vb},id:e.pointerId,region:e.target.closest('[data-region-outline]')?.dataset.regionOutline};if(pointers.size===2){const p=[...pointers.values()];pinch={d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}});
map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);zoom(pinch.d/d,(p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);pinch.d=d;moved=true;return}if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(!moved)return;const b=map.getBoundingClientRect();vb.x=drag.v.x-dx*vb.w/b.width;vb.y=drag.v.y-dy*vb.h/b.height;applyView()});
/* @atlas-function endPointer */map.addEventListener('pointerup',endPointer);map.addEventListener('pointercancel',endPointer);
map.addEventListener('keydown',e=>{if(e.target!==map)return;const f=.12;if(['+','=','-','0','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();switch(e.key){case '+':case '=':zoom(.8);break;case '-':zoom(1.25);break;case '0':fitChart();break;case 'ArrowUp':vb.y-=vb.h*f;applyView();break;case 'ArrowDown':vb.y+=vb.h*f;applyView();break;case 'ArrowLeft':vb.x-=vb.w*f;applyView();break;case 'ArrowRight':vb.x+=vb.w*f;applyView();break}});
document.addEventListener('keydown',e=>{if(!widgetMode&&e.key==='Escape'&&!$('notes').open){if(stationOverview){closeStation()}else if(planetFocus){setPlanetFocus(null)}else if(systemFocused){setSystemFocus(false)}$('filters').classList.add('hidden');$('filterBtn').setAttribute('aria-expanded','false');$('sidebar').classList.remove('open');setDetailOpen(false)}});
let resizeTimer;/* @atlas-function resizeChart */
addEventListener('resize',resizeChart);
$('atlasLayout').classList.add('index-collapsed');$('toggleIndexPanel').setAttribute('aria-expanded','false');$('indexToggle').setAttribute('aria-expanded','false');
$('systemFocus').innerHTML='';$('systemFocus').classList.add('hidden');$('mapArea').classList.remove('system-focused');$('flag').src=DATA.assets.flag;$('flagLink').href=$('federationLink').href=url('{{brand|jsstr}}');$('filters').classList.add('hidden');$('toast').classList.add('hidden');$('filterBtn').setAttribute('aria-expanded','false');document.querySelectorAll('[data-scope]').forEach(b=>b.classList.toggle('active',b.dataset.scope==='region'));document.body.classList.toggle('embed',embedMode);document.body.classList.toggle('widget',widgetMode);buildNotes();draw();restoreRoute();routeReady=true;persistRoute();

// Planet titles refresh independently of the existing image/infobox refresh.
addEventListener('focus',triggerPlanetTitleCheck);
addEventListener('online',triggerPlanetTitleCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)triggerPlanetTitleCheck()});
setInterval(()=>{if(!document.hidden)syncPlanetArticleTitles()},PLANET_TITLE_REFRESH_MS);
syncPlanetArticleTitles();

