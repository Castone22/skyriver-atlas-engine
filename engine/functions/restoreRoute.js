function restoreRoute(state=null,preferHash=false){
 restoringRoute=true;
 const flags=__ATLAS__.flags,OV=flags.overviewStateKey;
 const params=atlasParams(),querySystem=resolveSystem(params.get('system')),queryPlanet=params.get('planet');
 const planetRoute=queryPlanet?(querySystem?(focusableWorld(querySystem,queryPlanet)?{system:querySystem,object:focusableWorld(querySystem,queryPlanet)}:null):resolvePlanetRoute(queryPlanet)):null;
 const explicitRegion=resolveRegion(params.get('region'));
 const fragment=flags.hashIgnoredWithRegion&&!preferHash&&!querySystem&&!queryPlanet&&explicitRegion?null:resolveHashRoute(),exact=!!querySystem&&params.has('object')&&!preferHash;
 const route=exact?{system:querySystem,object:resolveObjectName(querySystem,params.get('object'))}:widgetMode&&(queryPlanet||params.get('system'))?(queryPlanet?planetRoute:querySystem?{system:querySystem}:null):fragment||planetRoute||(querySystem?{system:querySystem}:null);
 widgetRegion=null;
 if(widgetMode && !params.get('system') && !queryPlanet){
  widgetRegion=params.get('region')?resolveRegion(params.get('region')):route?.region||null;
 }
 document.body.classList.toggle('region-widget',!!widgetRegion);
 const record=widgetRegion?null:route?.system,regional=exact&&!widgetMode&&params.get('focus')==='region';
 const overviewRoute=!flags.noOverviewRoute&&!widgetMode&&!preferHash&&params.get('chart')===flags.overviewChart;
 const region=widgetRegion||(overviewRoute?explicitRegion:null)||(regional&&!flags.focusRegionIgnoresRegion?explicitRegion:null)||route?.region||(flags.addressRegionWins?explicitRegion:null)||record?.region||(flags.addressRegionWins?null:explicitRegion)||(record?.unplottedSystem?'all':flags.fallbackRegion);
 systemFocused=false;planetFocus=null;selected=null;selectedWorld=null;regionalCamera=null;if(flags.regionHighlight)setView(region,true);else setView(region,true,false,overviewRoute||region==='all');
 if(record){
  select(record.id,route.object||null);
  if(hasOrbitChart(record)&&!regional){
   setSystemFocus(true);
   const object=route.object||(!fragment?queryPlanet:null),moon=moonRecords(record).find(m=>m.name===object);
   const planet=exact?(flags.noLocalChartFallback?focusableWorld(record,queryPlanet):(focusableWorld(record,queryPlanet)||localChartParent(record,object))):focusableWorld(record,object)||focusableWorld(record,moon?.parent)||localChartParent(record,object);
   if(planet)setPlanetFocus(planet);
  }
  if(exact){systemFocused=hasOrbitChart(record)&&!regional;planetFocus=systemFocused?(flags.noLocalChartFallback?focusableWorld(record,queryPlanet):(focusableWorld(record,queryPlanet)||localChartParent(record,route.object))):null;selectedWorld=route.object;renderDetail();}
  else if(route.object){selectedWorld=route.object;renderDetail();}
 }else{renderDetail();updateSelection();renderIndex()}
 if(flags.highlightRouteParam){const requestedHighlight=resolveRegion(params.get('highlight'));if(requestedHighlight&&requestedHighlight!=='all')highlightedRegion=requestedHighlight;}
 if(state?.atlas){const historical=resolveSystem(state.selected);if(resolveRegion(state.view)){if(flags.regionHighlight)setView(state.view,true);else setView(state.view,true,false,state[OV]);if(flags.highlightedRegionState)highlightedRegion=state.highlightedRegion===null?null:resolveRegion(state.highlightedRegion)||highlightedRegion;selected=historical?.id||null;selectedWorld=resolveObjectName(historical,state.selectedWorld);systemFocused=!!state.focused&&hasOrbitChart(historical);regionalCamera=state.regionalCamera||null;planetFocus=systemFocused?focusableWorld(historical,state.planetFocus):null;renderDetail();renderIndex();updateSelection()}
 if(state.camera&&['x','y','w','h'].every(k=>Number.isFinite(state.camera[k]))&&state.camera.w>0&&state.camera.h>0){vb={...state.camera};baseWidth=state.baseWidth||vb.w;applyView()}}
 if(flags.stationRoute){
  const wantsStation=flags.stationRoute==='focus'?(state?.atlas?state.stationOverview:params.get('focus')==='station'):(state?.stationOverview||params.get('station')==='1');
  if((flags.widgetStationOverview||!widgetMode)&&systemFocused&&wantsStation&&stationRecords(resolveSystem(selected)).some(b=>hasStationSchematic(b)&&b.name===selectedWorld)){
   stationOverview=true;if(flags.stationRoute==='focus')planetFocus=null;renderDetail();
  }
 }
 if(flags.regionHighlight){updateRegionDisplay();scaleLabels();}
 if(record&&!hasOrbitChart(record))setDetailOpen(true);
 restoringRoute=false;persistRoute();lastRestoredURL=location.href;
}
