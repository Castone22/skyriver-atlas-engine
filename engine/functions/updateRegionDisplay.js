function updateRegionDisplay(){
 const r=DATA.regions[highlightedRegion]||DATA.regions[view];
 $('regionSelect').value=view;
 $('mapTitle').textContent=r?r.name:'{{brand|jsstr}}';
 $('mapTitle').href=url(r?r.name:DATA.name);
 $('mapKicker').textContent=view==='all'?'UNION OVERVIEW'+(r?' / REGION HIGHLIGHTED':''):'REGIONAL CHART / '+DATA.regions[view].name.toUpperCase();
 $('mapSubtitle').textContent=r?r.subtitle+' · '+r.systemCount+' charted systems':'41 systems · select a territory to highlight';
 document.querySelectorAll('[data-region-outline]').forEach(el=>{
  const active=el.dataset.regionOutline===highlightedRegion;
  el.setAttribute('aria-pressed',String(active));
  el.classList.toggle('region-active',active);
 });
}
