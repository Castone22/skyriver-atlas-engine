
const DATA = __ATLAS__.data;
// Labels can change; catalogue keys and satellite relationships never do.

const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const referenceTargets=new Map([...(DATA.stations||[]),...(DATA.satellites||[])].filter(r=>r.referencePage).map(r=>[r.name,r]));
/* @atlas-function planetKey */
/* @atlas-function planetName */
/* @atlas-function planetArticle */
/* @atlas-function planetAliases */
/* @atlas-function planetNameMarkup */
/* @atlas-function canonicalTitle */
/* @atlas-function link */
/* @atlas-function rememberPlanetArticle */
/* @atlas-function restorePlanetArticles */
/* @atlas-function savePlanetArticles */
/* @atlas-function acceptPlanetTitleBatch */
/* @atlas-function syncPlanetTitles */
/* @atlas-function startPlanetTitleSync */
/* @atlas-function refreshPlanetTitleUI */
/* @atlas-function widgetQuery */
/* @atlas-function copyWidgetQuery */
/* @atlas-function bindWidgetQuery */
/* @atlas-function url */
/* @atlas-function systemNameTitle */
/* @atlas-function hasOrbitChart */
/* @atlas-function systemArticleTitle */
/* @atlas-function systemLink */
/* @atlas-function systemArticleRecord */
const TIER_NAMES={1:'Quarantined',2:'Suppressed',3:'Active Threat',4:'High Contamination',5:'Critical Infestation'};
const TIER_COLORS={1:'#c7bb86',2:'#c9a375',3:'#da8b7c',4:'#df6c87',5:'#ec5391'};
const color=s=>s.starColor|| (s.tier?TIER_COLORS[s.tier]:s.kind==='hazard'||s.kind==='uncertain'?'#e58088':s.affiliation==='United Federation of Kadaym'?'#dfbd78':s.kind==='context'||s.kind==='neutral'?'#a9afc5':DATA.regions[s.region]?.color||'#8ac9ee');
const allRecords=[...DATA.systems,...DATA.unplaced];
const EXOTIC_TYPES={'pulsar':'Pulsar','magnetar':'Magnetar','cataclysmic-variable':'Cataclysmic variable'};
let overviewMode=true;
let view='all',scope='region',selected=null,selectedWorld=null,vb={x:0,y:0,w:1000,h:1000},baseWidth=1000,drag=null,moved=false,pointers=new Map(),pinch=null,searchTimer;
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

const normalizedName=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
/* @atlas-function resolveRegion */
/* @atlas-function matchesRecord */
/* @atlas-function resolveSystem */
/* @atlas-function resolveObjectName */
/* @atlas-function matchesSearch */
// Fragment links accept the friend's human-readable names, IDs and aliases.
/* @atlas-function resolveNamedRoute */
/* @atlas-function resolveHashRoute */
/* @atlas-function resolvePlanetRoute */
let lastRestoredURL='';
/* @atlas-function routeSnapshot */
/* @atlas-function routeURL */
/* @atlas-function persistRoute */
/* @atlas-function beginNavigation */
/* @atlas-function endNavigation */
/* @atlas-function restoreRoute */
addEventListener('popstate',event=>restoreRoute(event.state));
addEventListener('hashchange',()=>{if(location.href!==lastRestoredURL)restoreRoute(null,true)});

/* @atlas-function svg */
/* @atlas-function textSVG */
/* @atlas-function objectTarget */
/* @atlas-function svgLink */

/* @atlas-function draw */
/* @atlas-function updateSelection */
/* @atlas-function updateVisibility */
/* @atlas-function zoomPercent */
/* @atlas-function labelThresholds */
/* @atlas-function scaleLabels */
/* @atlas-function applyView */
/* @atlas-function fitBounds */
/* @atlas-function setView */
/* @atlas-function zoom */
/* @atlas-function select */
/* @atlas-function tierMarkup */
/* @atlas-function renderMapLegend */


/* @atlas-function affiliationMarkup */
/* @atlas-function searchRecords */
/* @atlas-function classificationTerms */
/* @atlas-function searchTerms */
/* @atlas-function searchObject */
/* @atlas-function noteworthyBodies */
/* @atlas-function renderIndex */
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
let stationOverview=false,stationPart=0;
let systemFocused=false,systemZoom=1,planetFocus=null,showBelts=true;
const stationFilters=new Set(Object.keys(STATION_TYPES));
const siteType=name=>/station|triad|jumpgate/i.test(name)?'Station / structure':/colony/i.test(name)?'Colony':'World';
/* @atlas-function stationRecords */
/* @atlas-function entityRecords */
/* @atlas-function starRecords */
/* @atlas-function focusableWorld */
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
/* @atlas-function solarLayout */
/* @atlas-function ordinal */
/* @atlas-function orbitalFact */
/* @atlas-function worldRecord */
/* @atlas-function bodyKey */

/* @atlas-function stationScreen */
/* @atlas-function highlightPart */
/* @atlas-function currentStationParts */
/* @atlas-function openStation */
/* @atlas-function schematicOf */
/* @atlas-function hasStationSchematic */
/* @atlas-function closeStation */
/* @atlas-function bindSchematicName */
/* @atlas-function bindSchematicControl */

/* @atlas-function cloakDecoration */
/* @atlas-function cloakBadge */
/* @atlas-function silentDecoration */
/* @atlas-function notableSitesMarkup */
/* @atlas-function systemView */
/* @atlas-function planetView */
/* @atlas-function greatBlinkFrame */
// Solar-system analogues. Diameters and distances are compressed for readability.
let solarGlyphSequence=0;
/* @atlas-function solarPlanetGlyph */

/* @atlas-function mountPlanet */
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
/* @atlas-function mountSystem */
/* @atlas-function setSystemFocus */

/* @atlas-function syncSystemFocus */
/* @atlas-function applySystemZoom */
/* @atlas-function bindSystemControls */
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
/* @atlas-function bodyFacts */
/* @atlas-function safeImageURL */
/* @atlas-function imageAPI */
/* @atlas-function currentImageTitle */
/* @atlas-function loadLiveImage */
/* @atlas-function embeddedImageMarkup */
/* @atlas-function imageMarkup */
/* @atlas-function referenceImage */
/* @atlas-function stopImageRefresh */
/* @atlas-function refreshVisibleImage */
addEventListener('focus',()=>refreshVisibleImage(true));addEventListener('online',()=>refreshVisibleImage(true));document.addEventListener('visibilitychange',()=>document.hidden?stopImageRefresh():refreshVisibleImage(true));

/* @atlas-function regionSystemSummary-entry */
// The panel shown when no system is selected.
function regionOverview(){const r=DATA.regions[view];$('detail').innerHTML=`<div class="detail-top"><span class="eyebrow">Alliance chart dossier</span><button class="detail-close" aria-label="Close dossier">×</button></div><div class="empty-detail"><div class="eyebrow">FOEDERE STAMUS</div><h2>${link(r?r.name:'{{brand|jsstr}}',r?r.name:'The Alliance')}</h2><p>${r?esc(r.description):'A union of sovereign member worlds, centered on Eden in Sol. This first-pass atlas charts 24 supplied systems and 18 proposed additions within a nation of 253 controlled systems and 42 member worlds.'}</p><div class="region-stat"><b>${view==='all'?DATA.systems.length:DATA.systems.filter(s=>s.region===view).length}</b><span>charted systems</span></div><div class="fact-grid"><div><small>Capital</small><strong>${link('Visegrad')} · ${link('Eden')}</strong></div><div><small>Population · 131 CE</small><strong>198.2 billion</strong></div></div><h3>Explore the Alliance</h3><button class="focus-world" data-feature="sol">Sol · Eden & Karic →</button><button class="focus-world" data-feature="heimdall">Heimdall · Jotunheim & 78 moons →</button><button class="focus-world" data-feature="dsc-346">DSC 346 · black-hole binary →</button><p class="tiny">Click a marker for its dossier. Double-click to enter a system. Double-click a planet for all its moons and stations. Every location name links to the Codex.</p><div class="note">First pass · regional boundaries and undocumented orbital details are proposed. The source chart’s relative system positions are preserved.</div>${link('{{brand|jsstr}}','Open Alliance article ↗','region-link')}</div>`;bindDetail();document.querySelectorAll('[data-feature]').forEach(b=>b.onclick=()=>{select(b.dataset.feature);setSystemFocus(true)});return}
/* @atlas-function renderDetail */
/* @atlas-function bindDetail */
/* @atlas-function drawMinimap */
/* @atlas-function buildNotes */

/* @atlas-function toast */
/* @atlas-function downloadHTML */

$('regionPicker').onchange=()=>setView($('regionPicker').value);
$('regionPicker').addEventListener('keydown',e=>e.stopPropagation());document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;document.querySelectorAll('[data-scope]').forEach(n=>n.classList.toggle('active',n===b));renderIndex()});$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderIndex,90)};
$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);$('fit').onclick=()=>setView(view,true,false,overviewMode);$('minimap').onclick=()=>setView('all');$('minimap').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setView('all')}};
['labels','borders','hexes','majorOnly'].forEach(id=>$(id).onchange=updateVisibility);document.querySelectorAll('[data-filter]').forEach(c=>c.onchange=()=>{flags[c.dataset.filter]=c.checked;updateVisibility()});
$('filterBtn').onclick=()=>{const open=$('filters').classList.toggle('hidden');$('filterBtn').setAttribute('aria-expanded',String(!open))};
$('embedDetails').onclick=()=>setDetailOpen(!$('detail').classList.contains('open'),true);
let indexOpen=false;
/* @atlas-function setIndexOpen */
for(const id of ['toggleIndexPanel','indexToggle','embedIndex'])$(id).onclick=()=>setIndexOpen(!indexOpen);
$('toggleDetailPanel').onclick=()=>{if(embedMode){setDetailOpen(!$('detail').classList.contains('open'),true);return}const hidden=$('atlasLayout').classList.toggle('dossier-collapsed');$('toggleDetailPanel').setAttribute('aria-expanded',String(!hidden));resizeChart()};
$('mobileInspect').onclick=()=>setDetailOpen(true,true);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Fullscreen is unavailable in this view.')}};
['sourcesBtn','footerNotes'].forEach(id=>$(id).onclick=()=>$('notes').showModal());$('closeNotes').onclick=()=>$('notes').close();$('notes').onclick=e=>{if(e.target===$('notes')){const b=$('notes').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('notes').close()}};$('download').onclick=downloadHTML;
const map=$('map');map.addEventListener('dragstart',event=>event.preventDefault());map.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Math.max(-100,Math.min(100,e.deltaY))*.002),e.clientX,e.clientY)},{passive:false});
map.addEventListener('pointerdown',e=>{if(e.target.closest('a'))return;e.preventDefault();moved=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});(e.target.closest('[data-region-outline]')||map).setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,v:{...vb},id:e.pointerId};if(pointers.size===2){const p=[...pointers.values()];pinch={d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}});
map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);zoom(pinch.d/d,(p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);pinch.d=d;moved=true;return}if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!moved&&Math.abs(dx)+Math.abs(dy)<=4)return;moved=true;const b=map.getBoundingClientRect();vb.x=drag.v.x-dx*vb.w/b.width;vb.y=drag.v.y-dy*vb.h/b.height;applyView()});
/* @atlas-function endPointer */map.addEventListener('pointerup',endPointer);map.addEventListener('pointercancel',endPointer);
map.addEventListener('keydown',e=>{if(e.target!==map)return;const f=.12;if(['+','=','-','0','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();switch(e.key){case '+':case '=':zoom(.8);break;case '-':zoom(1.25);break;case '0':setView(view,true,false,overviewMode);break;case 'ArrowUp':vb.y-=vb.h*f;applyView();break;case 'ArrowDown':vb.y+=vb.h*f;applyView();break;case 'ArrowLeft':vb.x-=vb.w*f;applyView();break;case 'ArrowRight':vb.x+=vb.w*f;applyView();break}});
document.addEventListener('keydown',e=>{if(!widgetMode&&e.key==='Escape'&&!$('notes').open){const returning=stationOverview||planetFocus||systemFocused;if(stationOverview){closeStation()}else if(planetFocus){setPlanetFocus(null)}else if(systemFocused){setSystemFocus(false)}$('filters').classList.add('hidden');$('filterBtn').setAttribute('aria-expanded','false');if(!returning)setIndexOpen(false);setDetailOpen(false)}});
let resizeTimer;/* @atlas-function resizeChart */
addEventListener('resize',resizeChart);
$('systemFocus').innerHTML='';$('systemFocus').classList.add('hidden');$('mapArea').classList.remove('system-focused');$('flag').src=DATA.assets.flag;$('flagLink').href=$('federationLink').href=url('{{brand|jsstr}}');$('filters').classList.add('hidden');$('toast').classList.add('hidden');$('filterBtn').setAttribute('aria-expanded','false');document.querySelectorAll('[data-scope]').forEach(b=>b.classList.toggle('active',b.dataset.scope==='region'));document.body.classList.toggle('embed',embedMode);document.body.classList.toggle('widget',widgetMode);setIndexOpen(false);startPlanetTitleSync();bindWidgetQuery();buildNotes();draw();restoreRoute();routeReady=true;persistRoute();
