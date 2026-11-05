function solarLayout(s){
 const bodies=systemBodies(s),allStations=stationRecords(s),stations=allStations.filter(b=>b.visibility==='system'),entities=entityRecords(s),planets=bodies.filter(b=>b.type==='World'),used=new Set(planets.filter(b=>b.slot).map(b=>b.slot));
 const seed=Array.from(s.name).reduce((a,c)=>a+c.charCodeAt(0),0);
 const assigned=planets.map((b,i)=>{let slot=b.slot||b.diagramSlot;if(!slot){slot=s.centralBodyType==='black-hole'?i+1:2+i*2;while(used.has(slot))slot++;used.add(slot)}return {...b,layoutSlot:slot,confirmed:!!b.slot,synthetic:false}});
 const maxSlot=Math.max(0,...assigned.map(b=>b.layoutSlot));
 const stationSlots=allStations.map(b=>Math.ceil(b.lane||0)), entitySlots=entities.map(b=>Math.ceil(b.lane||0));
 let total;
 if(s.schematicPlanets||s.sparseOrbits){
  total=Math.max(maxSlot,...Object.keys(s.schematicPlanets||{}).map(Number),...stationSlots,...entitySlots);
 }else if(s.centralBodyType==='black-hole'||EXOTIC_TYPES[s.centralBodyType]||s.kind==='uncertain'&&!planets.length){
  total=maxSlot;
 }else{
  total=Math.max(5+seed%3,maxSlot+2,...stationSlots);
 }
 const orbits=[];
 for(let slot=1;slot<=total;slot++){
  const known=assigned.filter(b=>b.layoutSlot===slot);
  if(known.length){orbits.push(...known);continue}
  if(s.sparseOrbits)continue;
  const kinds=slot>=total-1?['icy','gas','ice-giant','ringed']:['rocky','cinder','desert'];
  const kind=s.schematicPlanets?s.schematicPlanets[slot]:kinds[(slot+seed)%kinds.length];
  if(Object.hasOwn(illustrativeTypes,kind))orbits.push(illustrativePlanet(slot,kind));
 }
 return {orbits,entities,moons:bodies.filter(b=>b.type==='Moon'),sites:bodies.filter(b=>!['World','Moon'].includes(b.type)),stations,total,seed};
}
