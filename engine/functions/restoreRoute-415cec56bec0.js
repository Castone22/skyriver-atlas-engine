function restoreRoute(state=null,preferHash=false){
 restoringRoute=true;
 const params=atlasParams(),querySystem=resolveSystem(params.get('system')),queryPlanet=params.get('planet');
 const planetRoute=queryPlanet?(querySystem?(focusableWorld(querySystem,queryPlanet)?{system:querySystem,object:focusableWorld(querySystem,queryPlanet)}:null):resolvePlanetRoute(queryPlanet)):null;
 const explicitRegion=resolveRegion(params.get('region'));
 const fragment=!preferHash&&!querySystem&&!queryPlanet&&explicitRegion?null:resolveHashRoute(),exact=!!querySystem&&params.has('object')&&!preferHash;
 const route=exact?{system:querySystem,object:resolveObjectName(querySystem,params.get('object'))}:widgetMode&&(queryPlanet||params.get('system'))?(queryPlanet?planetRoute:querySystem?{system:querySystem}:null):fragment||planetRoute||(querySystem?{system:querySystem}:null);
 widgetRegion=null;
 if(widgetMode && !params.get('system') && !queryPlanet){
  widgetRegion=params.get('region')?resolveRegion(params.get('region')):route?.region||null;
 }
 document.body.classList.toggle('region-widget',!!widgetRegion);
 const record=widgetRegion?null:route?.system,regional=exact&&!widgetMode&&params.get('focus')==='region';
 const region=widgetRegion||route?.region||explicitRegion||record?.region||(record?.unplottedSystem?'all':'avendonraik');
 systemFocused=false;planetFocus=null;selected=null;selectedWorld=null;regionalCamera=null;setView(region,true);
 if(record){
  select(record.id,route.object||null);
  if(hasOrbitChart(record)&&!regional){
   setSystemFocus(true);
   const object=route.object||(!fragment?queryPlanet:null),moon=moonRecords(record).find(m=>m.name===object);
   const planet=exact?focusableWorld(record,queryPlanet):focusableWorld(record,object)||focusableWorld(record,moon?.parent)||localChartParent(record,object);
   if(planet)setPlanetFocus(planet);
  }
  if(exact){systemFocused=hasOrbitChart(record)&&!regional;planetFocus=systemFocused?focusableWorld(record,queryPlanet):null;selectedWorld=route.object;renderDetail();}
  else if(route.object){selectedWorld=route.object;renderDetail();}
 }else{renderDetail();updateSelection();renderIndex()}
 const requestedHighlight=resolveRegion(params.get('highlight'));
 if(requestedHighlight&&requestedHighlight!=='all')highlightedRegion=requestedHighlight;
 if(state?.atlas){const historical=resolveSystem(state.selected);if(resolveRegion(state.view)){setView(state.view,true);highlightedRegion=state.highlightedRegion===null?null:resolveRegion(state.highlightedRegion)||highlightedRegion;selected=historical?.id||null;selectedWorld=resolveObjectName(historical,state.selectedWorld);systemFocused=!!state.focused&&hasOrbitChart(historical);regionalCamera=state.regionalCamera||null;planetFocus=systemFocused?focusableWorld(historical,state.planetFocus):null;renderDetail();renderIndex();updateSelection()}
 if(state.camera&&['x','y','w','h'].every(k=>Number.isFinite(state.camera[k]))&&state.camera.w>0&&state.camera.h>0){vb={...state.camera};baseWidth=state.baseWidth||vb.w;applyView()}}
 const wantsStation=state?.atlas?state.stationOverview:params.get('focus')==='station';
 if(!widgetMode&&systemFocused&&wantsStation&&stationRecords(resolveSystem(selected)).some(b=>b.category==='TORA'&&b.name===selectedWorld)){
  stationOverview=true;planetFocus=null;renderDetail();
 }
 updateRegionDisplay();scaleLabels();
 if(record&&!hasOrbitChart(record))setDetailOpen(true);
 restoringRoute=false;persistRoute();lastRestoredURL=location.href;
}
