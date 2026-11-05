function mountPlanet(s){
 const chart=$('orbitDiagram'),root=systemBodies(s).find(b=>b.name===planetFocus);if(!chart||!root)return;
 const {moons,stations}=localBodies(s,planetFocus),cx=380,cy=265;
 const extended=Boolean(DATA.worlds[planetFocus]?.extendedSatelliteChart);
 for(let i=0;i<86;i++)svg('circle',{cx:(i*97+13)%760,cy:(i*53+7)%580,r:i%4===0?.8:.45,fill:'#acbfd8',opacity:.14+i%3*.07},chart);
 svg('path',{d:`M22 ${cy}H738M${cx} 24V548`,stroke:'#64758b','stroke-width':.5,opacity:.12},chart);
 const center=objectTarget(root.name,{class:'orbit-body'+(selectedWorld===root.name?' selected':''),transform:`translate(${cx} ${cy})`,tabindex:0,role:'button','data-local-center':root.name,'aria-label':'Inspect '+root.name},chart);
 svg('circle',{r:52,fill:'transparent'},center);svg('circle',{r:49,fill:'none',stroke:root.tint,'stroke-width':1,class:'body-focus'},center);
 svg('circle',{r:39,fill:root.tint,opacity:.08},center);svg('circle',{r:32,fill:root.tint},center);
 svg('ellipse',{cx:-8,cy:-6,rx:13,ry:22,fill:'#edf6fa',opacity:.08,transform:'rotate(-28)'},center);
 svg('path',{d:'M0-32A32 32 0 0 1 0 32A19 32 0 0 0 0-32',fill:'#08111c',opacity:.62},center);
 if(root.appearance==='storm-bands'){
  const globe=svg('g',{transform:'scale(1.32)', 'aria-hidden':'true','pointer-events':'none'},center);
  svg('circle',{r:32,fill:'#99b3c4'},globe);
  const clip=svg('clipPath',{id:'ice-giant-limb'},globe);svg('circle',{r:32},clip);
  const clouds=svg('g',{'clip-path':'url(#ice-giant-limb)',transform:'rotate(-9)'},globe);
  [-21,-13,-4,5,15,22].forEach((y,i)=>svg('path',{d:`M-34 ${y} Q-8 ${y+6} 8 ${y+2} T34 ${y+3}`,fill:'none',stroke:i%2?'#c5d9e1':'#678398','stroke-width':i%2?2:4},clouds));
  svg('ellipse',{cx:11,cy:8,rx:6,ry:2,fill:'#d3dedc'},clouds);
  svg('path',{d:'M0-32A32 32 0 0 1 0 32A19 32 0 0 0 0-32',fill:'#101d2b',opacity:.56},globe);
 }
 if(root.appearance==='ringed')svg('ellipse',{rx:56,ry:15,fill:'none',stroke:root.tint,'stroke-width':3,opacity:.7,transform:'rotate(-24)'},center);
 svgLink(root.name,root.name,{x:0,y:extended?286:68,class:'local-center-label'},center);bindOrbitalSelection(center,root.name);
 const movers=[];
 moons.forEach((b,i)=>{const rx=extended?166+i*178/Math.max(1,moons.length-1):180+i*85/Math.max(1,moons.length-1),ry=rx*.7,track=svg('ellipse',{cx,cy,rx,ry,fill:'none',class:'orbit-track'+(selectedWorld===b.name?' active':''),'data-local-moon-track':b.name},chart);movers.push({...b,rx,ry,phase:1.3+i*(extended?2.39996:2.1),duration:38+i*17,track:null})});
 const direct=stations.filter(b=>b.parent===root.name);
 stations.filter(b=>stationFilters.has(b.category)).forEach(b=>{
  const parent=b.parent===root.name?null:movers.find(m=>m.name===b.parent);if(b.parent!==root.name&&!parent)return;
  const i=stations.findIndex(x=>x.name===b.name),n=direct.findIndex(x=>x.name===b.name),siblings=stations.filter(x=>x.parent===b.parent),j=siblings.findIndex(x=>x.name===b.name);
  const rx=parent?22+j*8:extended?80+(n%3)*25:76+Math.max(0,n)*Math.min(23,78/Math.max(1,direct.length-1)),ry=rx*(parent?.8:.7);
  const track=svg('ellipse',{cx:parent?0:cx,cy:parent?0:cy,rx,ry,class:'orbit-track station-track'+(selectedWorld===b.name?' active':''),'data-local-station-track':b.name},chart);
  movers.push({...b,rx,ry,phase:extended?2+n*Math.PI*2/direct.length:2+i*2.4,duration:parent?13+j*5:extended?66:28+i*7,parent:parent?.name||null,track:parent?track:null});
 });
 movers.forEach(b=>{
  const station=b.type==='Station',g=objectTarget(b.name,{class:'orbit-body'+(selectedWorld===b.name?' selected':''),tabindex:0,role:'button','data-orbit-name':b.name,'data-local-orbit':b.name,'aria-label':'Inspect '+b.name+(station?', '+b.category+' station':', moon')},chart);
  svg('title',{},g).textContent=b.name;svg('circle',{r:extended?10:18,fill:'transparent'},g);svg('circle',{r:extended?9:15,fill:'none',stroke:b.tint,'stroke-width':1,class:'body-focus'},g);
  if(station)stationGlyph(g,b.tint,b.category,extended?.68:1,b.ruined);else {svg('circle',{r:extended?5:9,fill:b.tint},g);svg('path',{d:'M0-9A9 9 0 0 1 0 9A5 9 0 0 0 0-9',transform:extended?'scale(.55)':'',fill:'#101925',opacity:.55},g)}
  if(station)textSVG(b.code,{x:14,y:-11,class:'body-number'},g);else svgLink(b.name,b.shortLabel||b.name,{x:0,y:extended?15:26,class:'focus-body-label','text-anchor':'middle'},g);
  bindOrbitalSelection(g,b.name);b.element=g;
 });
 function paint(){movers.forEach(b=>{const parent=b.parent?movers.find(m=>m.name===b.parent):null,x=parent?parent.px:cx,y=parent?parent.py:cy,a=b.phase+orbitClock*Math.PI*2/b.duration;b.px=x+b.rx*Math.cos(a);b.py=y+b.ry*Math.sin(a);b.element.setAttribute('transform',`translate(${b.px} ${b.py})`);if(b.track)b.track.setAttribute('transform',`translate(${x} ${y})`)})}
 function frame(now){if(orbitLastTime!==null&&!document.hidden)orbitClock+=Math.min((now-orbitLastTime)/1000,.1);orbitLastTime=now;paint();orbitFrame=requestAnimationFrame(frame)}
 paint();if(!orbitPaused&&movers.length)orbitFrame=requestAnimationFrame(frame);
 if($('orbitToggle'))$('orbitToggle').onclick=()=>toggleAtlasMotion('orbitToggle');
}
