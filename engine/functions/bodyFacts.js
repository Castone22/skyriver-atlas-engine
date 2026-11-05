function bodyFacts(s,w,entry){
 if(Array.isArray(entry?.facts)&&(entry.facts.length||!__ATLAS__.flags.emptyDossierFactsFallBack)){
 const facts=entry.facts.map(([label,value])=>[label,label==='Natural satellites'&&w?.satelliteExpansion?String(w.naturalSatellites):value]);
 if(w?.satelliteExpansion&&!facts.some(([label])=>label==='Natural satellites'))facts.push(['Natural satellites',String(w.naturalSatellites)]);
 return factGrid(facts);
 }
 const facts=[];
 if(__ATLAS__.flags.architectureFacts){
  if(!w)facts.push(['Stellar architecture',s.architecture],['Star components',String(s.stars.length)],['Primary planets',String(s.worlds.length)],['Permanent stations',String(s.stationCount)],['TORA arrays',String(s.toraCount)],['Other stations',String(s.otherStationCount)]);
  if(w?.orbitalPosition)facts.push(['Designation',w.catalogueDesignation],['Orbital host',w.orbitHost==='AB'?'Inner pair AB':'[['+s.primaries[0]+']]'],['Moon inventory',String(w.naturalSatellites)+' charted']);
 }
 if(w?.population)facts.push(['Population',String(w.population)]);
 if(w?.capital)facts.push(['Capital','[['+w.capital+']]']);
 const count=Number.isInteger(w?.naturalSatellites)?`<div class="satellite-count">${w.naturalSatellites} natural satellite${w.naturalSatellites===1?'':'s'}</div>`:'';
 const status=w?.status?'<div class="note">'+esc(w.status)+'</div>':'';
 const content=affiliationMarkup(s)+orbitalFact(w,s)+count+factGrid(facts)+status;
 return content?'<div class="eyebrow">Atlas record</div>'+content:'';
}
