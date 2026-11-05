function bindSystemControls(){
 for(const el of document.querySelectorAll('[data-foundry-open]'))el.onclick=()=>openStation('Foundry');
 if(stationOverview){
  $('leaveStation').onclick=closeStation;
  for(const el of document.querySelectorAll('[data-unit]'))el.onclick=()=>{if(el.dataset.unit!==selectedWorld)openStation(el.dataset.unit)};
  $('rebuildStation').onclick=()=>{const el=$('systemFocus').querySelector('.tora-plate');el.classList.add('tora-reset');void el.getBoundingClientRect();el.classList.remove('tora-reset')};
  for(const el of document.querySelectorAll('[data-part]')){
   el.onclick=()=>highlightPart(Number(el.dataset.part));
   if(el.tagName.toLowerCase()==='g')el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.onclick()}};
  }
  highlightPart(__ATLAS__.flags.keepStationPart?stationPart:0);
  if(widgetMode)return;
 }
 if(!widgetMode)for(const el of document.querySelectorAll('.tora-register-link'))bindToraName(el,el.textContent);
 for(const el of document.querySelectorAll('[data-tora-open]'))el.onclick=()=>openStation(el.dataset.toraOpen);

 $('focusPlanet')?.addEventListener('click',()=>setPlanetFocus(selectedWorld));
 $('backToSystem')?.addEventListener('click',()=>setPlanetFocus(null));
 $('beltToggle')?.addEventListener('click',()=>{showBelts=!showBelts;renderDetail();$('beltToggle')?.focus({preventScroll:true})});
 $('inspectSystem')?.addEventListener('click',()=>{beginNavigation();planetFocus=null;selectedWorld=null;renderDetail();if(innerWidth<=700||embedMode)setDetailOpen(true);$('inspectSystem')?.focus({preventScroll:true});endNavigation()});
 $('systemZoomIn')?.addEventListener('click',()=>{systemZoom=Math.min(3,systemZoom*1.25);applySystemZoom()});$('systemZoomOut')?.addEventListener('click',()=>{systemZoom=Math.max(.75,systemZoom/1.25);applySystemZoom()});
 $('focusSystem')?.addEventListener('click',()=>setSystemFocus(true));$('backToRegion')?.addEventListener('click',()=>setSystemFocus(false));$('returnSystem')?.addEventListener('click',()=>setSystemFocus(false));
 document.querySelectorAll('[data-world]').forEach(b=>{if(b.getAttribute('data-tora')!==null)bindToraControl(b,b.dataset.world);else b.onclick=()=>chooseSystemWorld(b.dataset.world)});
 document.querySelectorAll('[data-station-filter]').forEach(b=>{
  const name=b.dataset.stationFilter;
  const toggle=()=>{if(stationFilters.has(name))stationFilters.delete(name);else stationFilters.add(name);renderDetail();$(b.id)?.focus({preventScroll:true})};
  if(name==='TORA'&&!planetFocus){
   const st=stationRecords(resolveSystem(selected)).find(item=>item.category==='TORA');
   if(st){bindToraControl(b,st.name,toggle);b.onkeydown=null;return}
  }
  b.onclick=toggle;
 });
 $('showAllStations')?.addEventListener('click',()=>{Object.keys(STATION_TYPES).forEach(n=>stationFilters.add(n));renderDetail();$('showAllStations')?.focus({preventScroll:true})});
 $('focusFullscreen')?.addEventListener('click',()=>$('fullscreen').click());
}
