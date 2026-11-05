function setSystemFocus(active){const s=allRecords.find(x=>x.id===selected);beginNavigation();stationOverview=false;
 if(active&&hasOrbitChart(s)&&!systemFocused){regionalCamera={view,highlightedRegion,camera:{...vb},baseWidth}}
 if(!active&&planetFocus&&localChartParent(s,selectedWorld))selectedWorld=planetFocus;planetFocus=null;systemFocused=!!active&&hasOrbitChart(s);
 if(!systemFocused&&regionalCamera){const saved=regionalCamera;setView(saved.view,true);vb={...saved.camera};baseWidth=saved.baseWidth;highlightedRegion=saved.highlightedRegion??(saved.view==='all'?null:saved.view);updateRegionDisplay();applyView();regionalCamera=null}
 renderDetail();setDetailOpen(false);(systemFocused?$('backToRegion'):$('focusSystem'))?.focus({preventScroll:true});endNavigation();}
