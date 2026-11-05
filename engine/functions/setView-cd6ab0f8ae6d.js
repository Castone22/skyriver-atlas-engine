function setView(key,keepSelection=false,keepCamera=false,federal=keepCamera?federationOverview:key==='all'){beginNavigation();planetFocus=null;if(systemFocused){systemFocused=false;syncSystemFocus(null);if(keepSelection)renderDetail()}regionalCamera=null;view=key;federationOverview=federal;
 const picker=$('regionPicker');$('overviewSelection')?.remove();
 if(federal&&DATA.regions[key]){
  const option=document.createElement('option');
  option.id='overviewSelection';option.value='overview-selection';option.disabled=true;
  option.textContent='Federation overview · '+DATA.regions[key].name;
  picker.append(option);picker.value=option.value;
 }else picker.value=key;
 const r=DATA.regions[key];$('mapTitle').textContent=r?r.name:'{{brand|jsstr}}';$('mapTitle').href=url(r?r.name:'{{brand|jsstr}}');
 $('mapKicker').textContent=({all:'FEDERAL TERRITORIAL OVERVIEW',makor:'01 / IMPERIAL HEARTLAND',lendor:'02 / FIRST EXPANSION',narthezk:'03 / ACQUIRED TERRITORIES',frontier:'04 / ELYSIAN COLLECTIVE',valteo:'05 / ACQUIRED IMPERIAL MARCHES','tserazk-makai':'06 / KURZENZKA SECTOR'})[key]||(r?.silentPresence?'KURZENZKA SECTOR / SILENT OCCUPATION':'FEDERATION / REGIONAL CHART');
 $('mapSubtitle').textContent=r?(key==='narthezk'?'Turahk homeworld · Haktur system':key==='frontier'?'Elysian Collective · Prathia is the Kadaymian foothold':r.subtitle+' · '+DATA.systems.filter(s=>s.region===key).length+' charted systems'):'Regional positions are schematic · remote holdings shown separately';
 renderMapLegend(key);
 if(!widgetMode)document.querySelectorAll('[data-region-outline]').forEach(area=>area.setAttribute('aria-pressed',String(area.dataset.regionOutline===key)));
 if(keepCamera)applyView();else fitBounds(r&&!federal?r.bounds:DATA.atlasExtent);
 if(!keepSelection){selected=null;selectedWorld=null;updateSelection();renderDetail()}
 renderIndex();endNavigation();
}
