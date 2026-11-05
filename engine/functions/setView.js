function setView(key,keepSelection=false,keepCamera=false,overview=keepCamera?overviewMode:key==='all'){
 if(__ATLAS__.flags.regionHighlight){
  if(key!=='all'&&!DATA.regions[key])return;
  beginNavigation();stationOverview=false;planetFocus=null;
  if(systemFocused){systemFocused=false;syncSystemFocus(null);if(keepSelection)renderDetail()}
  regionalCamera=null;view=key;highlightedRegion=key==='all'?null:key;
  if(widgetMode&&widgetRegion){widgetRegion=key;document.body.classList.add('region-widget')}
  updateRegionDisplay();renderMapLegend(key);fitBounds(DATA.regions[key]?.bounds||ATLAS_BOUNDS);
  if(!keepSelection){selected=null;selectedWorld=null;updateSelection();renderDetail()}
  renderIndex();endNavigation();
  return;
 }
 if(!resolveRegion(key))return;
 beginNavigation();planetFocus=null;stationOverview=false;
 if(systemFocused){systemFocused=false;syncSystemFocus(null);if(keepSelection)renderDetail()}
 regionalCamera=null;view=key;overviewMode=overview;
 const picker=$('regionPicker');$('overviewSelection')?.remove();
 if(overview&&DATA.regions[key]){const option=document.createElement('option');option.id='overviewSelection';option.value='overview-selection';option.disabled=true;option.textContent='{{overviewOptionLabel|jsstr}}'+DATA.regions[key].name;picker.append(option);picker.value=option.value}else picker.value=key;
 const r=DATA.regions[key];$('mapTitle').textContent=r?r.name:'{{brand|jsstr}}';$('mapTitle').href=url(r?r.name:'{{brand|jsstr}}');
 $('mapKicker').textContent=r?(r.mapKicker??(overview?'{{overviewTitle|jsstr}} / REGION HIGHLIGHTED':'REGIONAL CHART / '+r.subtitle.toUpperCase())):'{{overviewTitle|jsstr}}';
 $('mapSubtitle').textContent=r?(r.mapSubtitle??r.subtitle+' · '+DATA.systems.filter(s=>s.region===key).length+' charted systems'):'{{overviewSubtitle|jsstr}}';
 renderMapLegend(key);
 if(__ATLAS__.flags.widgetOutlineState||!widgetMode)document.querySelectorAll('[data-region-outline]').forEach(area=>area.setAttribute('aria-pressed',String(area.dataset.regionOutline===key)));
 if(keepCamera)applyView();else fitBounds(r&&!overview?r.bounds:DATA.atlasExtent);
 if(!keepSelection){selected=null;selectedWorld=null;updateSelection();renderDetail()}
 renderIndex();endNavigation();
}
