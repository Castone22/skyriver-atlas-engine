function setView(key,keepSelection=false){
 if(key!=='all'&&!DATA.regions[key])return;
 beginNavigation();stationOverview=false;planetFocus=null;
 if(systemFocused){systemFocused=false;syncSystemFocus(null);if(keepSelection)renderDetail()}
 regionalCamera=null;view=key;highlightedRegion=key==='all'?null:key;
 if(widgetMode&&widgetRegion){widgetRegion=key;document.body.classList.add('region-widget')}
 updateRegionDisplay();renderMapLegend(key);fitBounds(DATA.regions[key]?.bounds||ATLAS_BOUNDS);
 if(!keepSelection){selected=null;selectedWorld=null;updateSelection();renderDetail()}
 renderIndex();endNavigation();
}
