function bodyFacts(s,w,entry){
 if(entry?.facts?.length)return factGrid(entry.facts);
 const facts=[];
 if(!w)facts.push(['Stellar architecture',s.architecture],['Star components',String(s.stars.length)],['Primary planets',String(s.worlds.length)],['Permanent stations',String(s.stationCount)],['TORA arrays',String(s.toraCount)],['Other stations',String(s.otherStationCount)]);
 if(w?.orbitalPosition)facts.push(['Designation',w.catalogueDesignation],['Orbital host',w.orbitHost==='AB'?'Inner pair AB':'[['+s.primaries[0]+']]'],['Moon inventory',String(w.naturalSatellites)+' charted']);
 if(w?.population)facts.push(['Population',String(w.population)]);
 if(w?.capital)facts.push(['Capital','[['+w.capital+']]']);
 const count=Number.isInteger(w?.naturalSatellites)?`<div class="satellite-count">${w.naturalSatellites} natural satellite${w.naturalSatellites===1?'':'s'}</div>`:'';
 const status=w?.status?'<div class="note">'+esc(w.status)+'</div>':'';
 const content=affiliationMarkup(s)+orbitalFact(w,s)+count+factGrid(facts)+status;
 return content?'<div class="eyebrow">Atlas record</div>'+content:'';
}
