function bodyFacts(s,w,entry){
 if(Array.isArray(entry?.facts))return factGrid(entry.facts);
 const facts=[];
 if(w?.population)facts.push(['Population',String(w.population)]);
 if(w?.capital)facts.push(['Capital','[['+w.capital+']]']);
 const count=Number.isInteger(w?.naturalSatellites)?`<div class="satellite-count">${w.naturalSatellites} natural satellite${w.naturalSatellites===1?'':'s'}</div>`:'';
 const status=w?.status?'<div class="note">'+esc(w.status)+'</div>':'';
 const content=affiliationMarkup(s)+orbitalFact(w,s)+count+factGrid(facts)+status;
 return content?'<div class="eyebrow">Atlas record</div>'+content:'';
}
