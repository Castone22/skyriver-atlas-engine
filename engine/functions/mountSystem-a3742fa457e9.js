function mountSystem(s){if(planetFocus&&systemFocused){mountPlanet(s);return}const chart=$('orbitDiagram');if(!chart)return;const expanded=systemFocused,{orbits,moons,total,seed,stations,sites,entities}=solarLayout(s),cx=expanded?380:160,cy=expanded?265:122,width=expanded?760:320,height=expanded?580:258,scale=expanded?1.5:1;
 const defs=svg('defs',{},chart),star=svg('radialGradient',{id:'systemSun'},defs);svg('stop',{offset:'0%','stop-color':'#fff2c5'},star);svg('stop',{offset:'50%','stop-color':'#e9b86d'},star);svg('stop',{offset:'100%','stop-color':'#a75e38'},star);
 const halo=svg('radialGradient',{id:'systemHalo'},defs);svg('stop',{offset:'0%','stop-color':s.starColor,'stop-opacity':'.28'},halo);svg('stop',{offset:'100%','stop-color':s.starColor,'stop-opacity':'0'},halo);
 for(let i=0;i<(expanded?110:43);i++)svg('circle',{cx:(i*97+13)%width,cy:(i*53+7)%height,r:i%4===0?.8:.45,fill:'#acbfd8',opacity:.16+i%3*.08},chart);
 svg('path',{d:`M12 ${cy}H${width-12}M${cx} 14V${height-19}`,stroke:'#64758b','stroke-width':'.5',opacity:'.14'},chart);
 const triple=s.primaries?.length===3;
 const baseRadius=slot=>(s.centralBodyType==='black-hole'?(expanded?130:65):(triple?(expanded?99:68):(expanded?65:32)))+(slot-1)*((s.centralBodyType==='black-hole'?(expanded?180:73):(triple?(expanded?211:70):(expanded?245:106)))/Math.max(1,total-1));
 const projection=s.projection;
 const radius=s.orbitRadii?slot=>{const i=Math.max(0,Math.min(s.orbitRadii.length-1,slot-1)),a=Math.floor(i),b=Math.ceil(i);return (s.orbitRadii[a]+(s.orbitRadii[b]-s.orbitRadii[a])*(i-a))*(expanded?1:.44)}:projection?slot=>baseRadius(1)+(baseRadius(total)-baseRadius(1))*projection.span*Math.pow((slot-1)/Math.max(1,total-1),projection.curve):baseRadius;
 if(showBelts&&s.beltSlot)drawBelt(chart,s,seed,radius,cx,cy,expanded);
 const movers=[];orbits.forEach(b=>{const rx=radius(b.layoutSlot),ry=rx*(s.solarAnalogue?.64:(projection?.flatten??.64)+Math.sin(seed+b.layoutSlot*.7)*.04),tilt=s.solarAnalogue?-12:(projection?.tilt??-12)+Math.sin(seed*.1+b.layoutSlot*.3)*5,rad=tilt*Math.PI/180;
  svg('ellipse',{cx,cy,rx,ry,transform:`rotate(${tilt} ${cx} ${cy})`,'data-orbit-slot':b.layoutSlot,class:'orbit-track'+(b.synthetic?' filler':'')+((b.name&&selectedWorld===b.name)||moons.some(m=>m.name===selectedWorld&&m.parent===b.name)?' active':'')},chart);
  textSVG(String(b.layoutSlot),{x:cx+rx*Math.cos(rad)+3,y:cy+rx*Math.sin(rad)+3,class:'orbit-number'+(b.confirmed?' known':'')},chart);
  movers.push({...b,rx,ry,rad,phase:s.solarAnalogue?[.4,2,3.6,5.2,1.2,3,4.4,5.7][b.layoutSlot-1]:seed*.013+b.layoutSlot*2.4,duration:20+b.layoutSlot*11});
 });
 if(s.centralBodyType!=='black-hole'&&s.centralBodyType!=='silent-darkened'&&!EXOTIC_TYPES[s.centralBodyType])svg('circle',{cx,cy,r:40*scale,fill:'url(#systemHalo)'},chart);
 const stellarScale=EXOTIC_TYPES[s.centralBodyType]?(expanded?3:1.6):scale;
 const stars=starRecords(s),stellarMovers=[],stream=s.centralBodyType==='cataclysmic-variable'?svg('path',{class:'mass-transfer-stream',fill:'none',stroke:'#e8b794','stroke-width':1.6,opacity:.65,'pointer-events':'none'},chart):null;
 if(stars.length>1)svg('ellipse',{cx,cy,rx:(s.centralBodyType==='black-hole'?46:triple?30:21)*stellarScale,ry:(s.centralBodyType==='black-hole'?32.2:triple?23:15)*stellarScale,fill:'none',stroke:'#b6a782','stroke-width':.6,'stroke-dasharray':'2 4',opacity:.3,class:'binary-guide'},chart);
 const pairGuide=triple?svg('ellipse',{rx:10*scale,ry:8*scale,fill:'none',stroke:'#b6a782','stroke-width':.7,'stroke-dasharray':'2 3',opacity:.4,'pointer-events':'none'},chart):null;
 stars.forEach((star,i)=>{
  const black=star.blackHole,g=objectTarget(star.name,{class:'orbit-body stellar-body'+(selectedWorld===star.name?' selected':''),tabindex:0,role:'button','data-star-name':star.name,'aria-label':'Inspect '+star.name+' '+(black?'black hole':'star')},chart);
  svg('title',{},g).textContent=star.name;svg('circle',{r:(black?29:triple?8:stars.length>1?12:19)*stellarScale,fill:'transparent'},g);svg('circle',{r:(black?28:triple?7:stars.length>1?11:17)*stellarScale,fill:'none',stroke:star.tint,'stroke-width':1,class:'body-focus'},g);
  if(s.centralBodyType==='silent-darkened')deadStarGlyph(g,0,0,scale*1.3);else if(black)blackHoleGlyph(g,0,0,scale*1.8);else if(EXOTIC_TYPES[s.centralBodyType])exoticGlyph(g,s.centralBodyType,0,0,stellarScale,i);else {svg('circle',{r:(stars.length>1?10:15)*stellarScale,fill:star.tint,opacity:.12},g);svg('circle',{r:(triple?[4.6,3.6,4.1][i]:stars.length>1?(i?5:6):8)*stellarScale,fill:star.tint},g)}
  bindOrbitalSelection(g,star.name);stellarMovers.push({element:g,index:i});
 });
 moons.forEach((b,i)=>{if(!movers.some(p=>p.name===b.parent))return;const rx=(s.solarAnalogue?15:25+i*9)*scale,ry=rx*.72,track=svg('ellipse',{cx:0,cy:0,rx,ry,'data-moon-track':b.name,class:'orbit-track'+(selectedWorld===b.name?' active':'')},chart);movers.push({...b,rx,ry,rad:0,phase:1.3+i*1.7,duration:9+i*3,track})});
 const visibleStations=stations.filter(b=>(!expanded||stationFilters.has(b.category)));
 visibleStations.filter(b=>b.parent||b.lane).forEach((b,i)=>{
  i=stations.findIndex(x=>x.name===b.name);const parent=b.parent?movers.find(p=>p.name===b.parent):null;if(b.parent&&!parent)return;
  const rx=parent?(parent.type==='Moon'?11:16)*scale:radius(b.lane),ry=rx*(parent?.type==='Moon'?.9:parent?.6:.73),rad=parent?0:.17;
  const track=svg('ellipse',{cx:parent?0:cx,cy:parent?0:cy,rx,ry,transform:parent?'':`rotate(${rad*180/Math.PI} ${cx} ${cy})`,'data-station-track':b.name,class:'orbit-track station-track'+(selectedWorld===b.name?' active':'')},chart);
  movers.push({...b,rx,ry,rad,phase:seed*.017+i*2.7+2,duration:parent?12+i*2:50+i*9,track:parent?track:null});
 });
 entities.forEach(b=>{const rx=radius(b.lane),ry=rx*.68;svg('ellipse',{cx,cy,rx,ry,class:'orbit-track entity-track','data-entity-track':b.name},chart);movers.push({...b,rx,ry,rad:0,phase:2.6,duration:b.animationDuration||2400})});
 movers.forEach(b=>{const moon=b.type==='Moon',station=b.type==='Station',entity=b.type==='Entity';
  if(b.synthetic){
   const r=b.size*scale,g=svg('g',{'aria-hidden':'true','data-filler-slot':b.layoutSlot,'data-planet-kind':b.kind,opacity:.6,'pointer-events':'none'},chart);
   svg('circle',{r,fill:b.tint,opacity:.92},g);
   if(['gas','ringed','ice-giant'].includes(b.kind))svg('path',{d:'M-.88-.34Q0-.10 .91-.31M-.92 .23Q0 .44 .91 .26',transform:'scale('+r+')',fill:'none',stroke:'#e9dcc8','stroke-width':.17,opacity:.52},g);
   svg('path',{d:'M0-1A1 1 0 0 1 0 1Q1 0 0-1',transform:'scale('+r+')',fill:'#152637',opacity:.56},g);
   if(b.kind==='ringed')svg('ellipse',{rx:r*1.75,ry:r*.39,fill:'none',stroke:b.tint,'stroke-width':scale*.85,opacity:.8,transform:'rotate(-24)'},g);
   b.element=g;return}
  const g=objectTarget(b.name,{opacity:b.renderOpacity??1,class:'orbit-body'+(selectedWorld===b.name?' selected':''),tabindex:0,role:'button','data-orbit-name':b.name,'data-layout-slot':b.layoutSlot||(entity?'entity':station?'station':'moon'),'aria-label':`Inspect ${planetName(b.name)}${entity?', Silent macroform in a slow stellar orbit':station?', '+b.category+' station':moon?', moon of '+b.parent:b.slot?', orbital position '+b.slot:', schematic orbit '+b.layoutSlot}`},chart);
  svg('title',{},g).textContent=planetName(b.name)+(station?' · '+b.category:'');svg('circle',{r:(station?9:moon?11:15)*scale,fill:'transparent'},g);svg('circle',{r:(moon?8:station?11:11)*scale,fill:'none',stroke:b.tint,'stroke-width':1,class:'body-focus'},g);
  if(entity)nefandumGlyph(g,expanded?1.2:.65);else if(station)stationGlyph(g,b.tint,b.category,expanded?1:.7,b.ruined);else if(DATA.worlds[b.name]?.solarAnalogue){solarPlanetGlyph(g,b.name,(b.size||6.5)*scale)}else{const bodySize=moon?3.5:(b.size||6.5);svg('circle',{r:bodySize*scale,fill:b.tint},g);if(b.appearance==='ringed')svg('ellipse',{rx:bodySize*1.8*scale,ry:bodySize*.5*scale,transform:'rotate(-24)',fill:'none',stroke:b.tint,'stroke-width':1,opacity:.7},g);if(b.appearance==='scarred')svg('path',{d:'M-2-3L1-1-1 2 2 4',transform:`scale(${scale*.6})`,stroke:'#452e39','stroke-width':1,fill:'none'},g);svg('path',{d:'M0-7 A7 7 0 0 1 0 7 A4 7 0 0 0 0-7',transform:`scale(${bodySize/7*scale})`,fill:'#0b1420',opacity:'.5'},g)}
  textSVG(entity?'':station?b.code:moon?(expanded?'':'M'):String(b.layoutSlot)+(b.confirmed?'':'*'),{x:(moon?8:10)*scale,y:(moon?-7:-9)*scale,class:'body-number'},g);
  if(expanded&&(!station||stations.length===1)&&!(b.type==='World'&&DATA.worlds[b.name]?.proposed&&!planetTitleRecord(b.name)?.title))b.label=svgLink(b.name,b.name,{x:0,y:(entity?43:moon?19:25),class:'focus-body-label','text-anchor':'middle'},g).querySelector('text');
  if(b.category==='TORA'&&!widgetMode)bindToraControl(g,b.name);else bindOrbitalSelection(g,b.name,b.type==='World');b.element=g;
 });
 // Named planets paint above stations so a crossing orbit cannot intercept the planet's click.
 for(const b of movers)if(b.type==='World'&&!b.synthetic)chart.appendChild(b.element);
 const unlocated=[...visibleStations.filter(b=>!b.parent&&!b.lane),...sites];
 if(unlocated.length){const y=expanded?530:230;textSVG('HOST ORBIT UNSPECIFIED',{x:expanded?30:12,y:y-17,class:'orbit-number'},chart);unlocated.forEach((b,i)=>{const x=(expanded?52:30)+i*(expanded?220:130),g=objectTarget(b.name,{transform:`translate(${x} ${y})`,class:'orbit-body'+(selectedWorld===b.name?' selected':''),tabindex:0,role:'button','data-unlocated-name':b.name,'aria-label':'Inspect '+b.name+'; host orbit unspecified'},chart);svg('rect',{x:-14,y:-13,width:30,height:27,fill:'transparent'},g);svg('circle',{r:12,fill:'none',stroke:b.tint,class:'body-focus'},g);if(b.type==='Station')stationGlyph(g,b.tint,b.category,.9,b.ruined);else svg('rect',{x:-5,y:-5,width:10,height:10,fill:'none',stroke:b.tint},g);svgLink(b.name,expanded?b.name:(b.code||'Colony '+(i+1)),{x:15,y:4,class:'focus-body-label'},g);if(b.category==='TORA'&&!widgetMode)bindToraControl(g,b.name);else bindOrbitalSelection(g,b.name)})}
 function paint(){
  const phase=orbitClock*2*Math.PI/28;
  if(triple){
   const outer=orbitClock*2*Math.PI/47+.56,inner=orbitClock*2*Math.PI/11+1.3;
   const dx=Math.cos(outer)*stellarScale,dy=Math.sin(outer)*.77*stellarScale;
   const pairX=cx-13*dx,pairY=cy-13*dy;
   pairGuide.setAttribute('transform',`translate(${pairX} ${pairY})`);
   stellarMovers.forEach(({element,index})=>{
    const r=(index===0?9:-11)*stellarScale;
    const x=index===2?cx+30*dx:pairX+r*Math.cos(inner);
    const y=index===2?cy+30*dy:pairY+r*.8*Math.sin(inner);
    element.setAttribute('transform',`translate(${x} ${y})`);
   });
  }else{
   stellarMovers.forEach(({element,index})=>{
    const r=s.centralBodyType==='black-hole'?(index?46*stellarScale:0):stellarMovers.length===2?(index?21:16)*stellarScale:0,a=phase+index*Math.PI;
    element.setAttribute('transform',`translate(${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r*.7})`);
   });
  }
  if(stream){const a=orbitClock*2*Math.PI/28,x=Math.cos(a)*stellarScale,y=Math.sin(a)*stellarScale*.7;stream.setAttribute('d',`M${cx-21*x} ${cy-21*y}Q${cx-12*y} ${cy+12*x} ${cx+16*x} ${cy+16*y}`)}movers.forEach(b=>{const a=b.phase+orbitClock*2*Math.PI/b.duration,parent=b.parent?movers.find(p=>p.name===b.parent):null,x=b.rx*Math.cos(a),y=b.ry*Math.sin(a),centerX=parent?parent.px:cx,centerY=parent?parent.py:cy;b.px=centerX+x*Math.cos(b.rad)-y*Math.sin(b.rad);b.py=centerY+x*Math.sin(b.rad)+y*Math.cos(b.rad);b.element.setAttribute('transform',`translate(${b.px} ${b.py})`);if(b.track)b.track.setAttribute('transform',`translate(${centerX} ${centerY})`)});movers.forEach(b=>{if(!b.label)return;const moon=movers.find(m=>m.type==='Moon'&&m.parent===b.name),parent=b.type==='Moon'?movers.find(m=>m.name===b.parent):null;if(moon)b.label.setAttribute('y',moon.py>=b.py?-42:52);else if(parent)b.label.setAttribute('y',b.py>=parent.py?40:-32)})}
 function frame(now){if(orbitLastTime!==null&&!document.hidden)orbitClock+=Math.min((now-orbitLastTime)/1000,.1);orbitLastTime=now;paint();orbitFrame=requestAnimationFrame(frame)}
 paint();if(!orbitPaused&&(movers.length||stellarMovers.length>1))orbitFrame=requestAnimationFrame(frame);
 if($('orbitToggle'))$('orbitToggle').onclick=()=>toggleAtlasMotion('orbitToggle');
}
