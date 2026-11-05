function bindSystemControls(){
 $('focusPlanet')?.addEventListener('click',()=>setPlanetFocus(selectedWorld));
 $('backToSystem')?.addEventListener('click',()=>setPlanetFocus(null));
 $('beltToggle')?.addEventListener('click',()=>{showBelts=!showBelts;renderDetail();$('beltToggle')?.focus({preventScroll:true})});
 $('inspectSystem')?.addEventListener('click',()=>{beginNavigation();planetFocus=null;selectedWorld=null;renderDetail();if(innerWidth<=700||embedMode)setDetailOpen(true);$('inspectSystem')?.focus({preventScroll:true});endNavigation()});
 $('systemZoomIn')?.addEventListener('click',()=>{systemZoom=Math.min(3,systemZoom*1.25);applySystemZoom()});$('systemZoomOut')?.addEventListener('click',()=>{systemZoom=Math.max(.75,systemZoom/1.25);applySystemZoom()});
 $('focusSystem')?.addEventListener('click',()=>setSystemFocus(true));$('backToRegion')?.addEventListener('click',()=>setSystemFocus(false));$('returnSystem')?.addEventListener('click',()=>setSystemFocus(false));
 document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>chooseSystemWorld(b.dataset.world));
 document.querySelectorAll('[data-station-filter]').forEach(b=>b.onclick=()=>{const name=b.dataset.stationFilter;if(stationFilters.has(name))stationFilters.delete(name);else stationFilters.add(name);renderDetail();$(b.id)?.focus({preventScroll:true})});
 $('showAllStations')?.addEventListener('click',()=>{Object.keys(STATION_TYPES).forEach(n=>stationFilters.add(n));renderDetail();$('showAllStations')?.focus({preventScroll:true})});
 $('focusFullscreen')?.addEventListener('click',()=>$('fullscreen').click());
}
