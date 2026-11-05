function draw(){
 const scene=$('scene');scene.innerHTML='';
 svg('rect',{x:-15000,y:-15000,width:30000,height:30000,fill:'#090f17'},scene);
 svg('rect',{x:-15000,y:-15000,width:30000,height:30000,fill:'url(#grid)'},scene);
 [[700,900,700,950],[2100,950,450,800],[3250,2100,650,730]].forEach(a=>svg('ellipse',{cx:a[0],cy:a[1],rx:a[2],ry:a[3],fill:'url(#cloud)',transform:`rotate(-30 ${a[0]} ${a[1]})`},scene));
 let seed=1935;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
 const backdrop=svg('g',{'pointer-events':'none'},scene);for(let i=0;i<950;i++)svg('circle',{cx:rand()*6500-1000,cy:rand()*4800-900,r:.35+rand()*1.1,fill:rand()>.75?'#9bb6c5':'#b4bcc9',opacity:.1+rand()*.3},backdrop);
 const regions=svg('g',{id:'regionLayer'},scene);
 Object.entries(DATA.regions).forEach(([key,r])=>{
  const shell=svg('g',{'data-region-shell':key},regions);
  const path='M'+r.outline.map(p=>p.join(' ')).join('L')+'Z';
  const area=svg('path',{d:path,fill:r.color,stroke:r.color,class:'region-outline','data-region-outline':key,'vector-effect':'non-scaling-stroke'},shell);
  if(!widgetMode){area.setAttribute('role','button');area.setAttribute('tabindex','0');area.setAttribute('aria-label','Highlight '+r.name+' without moving the chart');area.addEventListener('click',()=>{if(!moved)setView(key,false,true)});area.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();setView(key,false,true)}})}
  if(r.silentPresence)svg('path',{d:path,fill:'url(#hatch)','pointer-events':'none'},shell);
  svgLink(r.name,r.name.toUpperCase(),{x:r.labelAnchor[0],y:r.labelAnchor[1],class:'region-title','text-anchor':'middle'},shell);
  textSVG(r.subtitle.toUpperCase(),{x:r.labelAnchor[0],y:r.labelAnchor[1]+35,class:'region-subtitle','text-anchor':'middle'},shell);
  svgLink(r.name,r.name.toUpperCase(),{x:r.labelAnchor[0],y:r.labelAnchor[1],class:'region-ink',fill:r.color,'text-anchor':'middle','data-region-ink':key},shell);
 });
 const n=svg('g',{id:'neighborLabel','pointer-events':'none'},regions);
 const hexLayer=svg('g',{id:'hexLayer',display:'none','pointer-events':'none'},scene);
 const nodes=svg('g',{id:'nodes'},scene);
 DATA.systems.forEach(s=>{
  const c=color(s),points=Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180;return[s.x+94*Math.cos(a),s.y+94*Math.sin(a)].join(',')}).join(' ');
  svg('polygon',{points,fill:c,stroke:c,class:'chart-cell'},hexLayer);
  const g=svg('g',{id:'node-'+s.id,class:s.major?'major':'', 'data-region':s.region},nodes);
  const hit=objectTarget(systemArticleTitle(s),{class:'star-hit',tabindex:'0',role:'button','aria-label':`Inspect ${s.name}${s.tier?', Tier '+s.tier+' '+TIER_NAMES[s.tier]:''}${s.centralBodyType==='silent-darkened'?', Silent-darkened dead star':''}${s.centralBodyType==='black-hole'?', black-hole system':''}${s.worlds.length?', '+s.worlds.join(', '):''}`},g);
  svg('title',{},hit).textContent=s.name+' · '+(s.centralBodyType==='black-hole'?'Black hole + stellar companion':s.primaries.length===3?'Triple system':s.primaries.length===2?'Binary system':'Single star')+' · '+s.worlds.length+' planets';
  svg('circle',{cx:s.x,cy:s.y,r:25,fill:'transparent'},hit);
  svg('circle',{cx:s.x,cy:s.y,r:22,fill:'none',stroke:c,'stroke-width':1,class:'focus-ring'},hit);
  if(s.major&&s.centralBodyType!=='black-hole'){svg('circle',{cx:s.x,cy:s.y,r:12,fill:c,opacity:.35,filter:'url(#glow)'},hit);svg('circle',{cx:s.x,cy:s.y,r:16,fill:'none',stroke:c,opacity:.25,'stroke-width':1},hit)}
  if(s.centralBodyType==='silent-darkened'){deadStarGlyph(hit,s.x,s.y,1)}
  else if(s.centralBodyType==='black-hole'){blackHoleGlyph(hit,s.x,s.y,1)}
  else if(EXOTIC_TYPES[s.centralBodyType]){exoticGlyph(hit,s.centralBodyType,s.x,s.y,.65)}
  else if(s.kind==='hazard'||s.kind==='uncertain'){svg('path',{d:`M${s.x} ${s.y-8}l8 15h-16Z`,fill:'#341c27',stroke:c,'stroke-width':1.6},hit);textSVG('!',{x:s.x,y:s.y+4,'text-anchor':'middle',fill:c,'font-size':10},hit)}
  else if(s.name==='Sol'){svg('path',{d:`M${s.x} ${s.y-9}l2.5 6.5 7 .5-5.5 4.5 1.8 7-5.8-4-5.8 4 1.8-7-5.5-4.5 7-.5Z`,fill:'#ffde94'},hit)}
  else{svg('circle',{cx:s.x,cy:s.y,r:s.major?5.5:3.6,fill:c},hit);if(s.kind==='neutral')svg('circle',{cx:s.x,cy:s.y,r:9,fill:'none',stroke:c,'stroke-width':1},hit)}
  const label=svg('g',{class:'node-label '+(!s.major?'minor-label':''),'data-x':s.x,'data-y':s.y,'data-id':s.id},g);
  const y=s.y+34,tierOffset=s.tier?19:0;
  if(s.tier)textSVG('TIER '+s.tier+(s.centralBodyType==='silent-darkened'?' · DEAD STAR':' · '+TIER_NAMES[s.tier].toUpperCase()),{x:s.x,y:y+18,'text-anchor':'middle',class:'tier-label',fill:TIER_COLORS[s.tier],'data-tier-label':s.tier},label);
  svgLink(systemArticleTitle(s),s.name.toUpperCase(),{x:s.x,y,'text-anchor':'middle',class:'system-label'},label);
  if(s.worlds.length){const worlds=svg('g',{class:'world-names'},label);(s.mapWorlds||s.worlds).slice(0,2).forEach((world,i)=>svgLink(world,world,{x:s.x,y:y+20+16*i+tierOffset,'text-anchor':'middle',class:'world-label'},worlds))}
  if(widgetMode)return;
  hit.addEventListener('pointerdown',e=>{e.stopPropagation();moved=false});hit.addEventListener('click',e=>{e.stopPropagation();if(!moved&&e.detail<2){select(s.id,null,false,false);deferMarkerDossier(s.id)}});hit.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();select(s.id);setSystemFocus(true)});hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(s.id)}});
 });
 svg('g',{id:'selectionLayer','pointer-events':'none'},scene);updateSelection();updateVisibility();
}
