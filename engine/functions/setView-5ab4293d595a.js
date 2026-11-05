function setView(key,keepSelection=false,keepCamera=false,overview=keepCamera?overviewMode:key==='all'){
 if(!resolveRegion(key))return;
 beginNavigation();planetFocus=null;stationOverview=false;
 if(systemFocused){systemFocused=false;syncSystemFocus(null);if(keepSelection)renderDetail()}
 regionalCamera=null;view=key;overviewMode=overview;
 const picker=$('regionPicker');$('overviewSelection')?.remove();
 if(overview&&DATA.regions[key]){const option=document.createElement('option');option.id='overviewSelection';option.value='overview-selection';option.disabled=true;option.textContent='Overview · '+DATA.regions[key].name;picker.append(option);picker.value=option.value}else picker.value=key;
 const r=DATA.regions[key];$('mapTitle').textContent=r?r.name:'United Alliance of Commonwealth States';$('mapTitle').href=url(r?r.name:'United Alliance of Commonwealth States');
 $('mapKicker').textContent=overview?'ALLIANCE OVERVIEW'+(r?' / REGION HIGHLIGHTED':''):'REGIONAL CHART / '+r.subtitle.toUpperCase();
 $('mapSubtitle').textContent=r?r.subtitle+' · '+DATA.systems.filter(s=>s.region===key).length+' charted systems':'42 charted systems · five adjoining regional charts';
 renderMapLegend(key);
 document.querySelectorAll('[data-region-outline]').forEach(area=>area.setAttribute('aria-pressed',String(area.dataset.regionOutline===key)));
 if(keepCamera)applyView();else fitBounds(r&&!overview?r.bounds:DATA.atlasExtent);
 if(!keepSelection){selected=null;selectedWorld=null;updateSelection();renderDetail()}
 renderIndex();endNavigation();
}
