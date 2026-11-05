function setSystemFocus(active){const s=allRecords.find(x=>x.id===selected);beginNavigation();
 if(active&&hasOrbitChart(s)&&!systemFocused){if(s.region&&view!==s.region&&!federationOverview)setView(s.region,true);regionalCamera={view,federationOverview,camera:{...vb},baseWidth}}
 if(!active&&planetFocus&&localChartParent(s,selectedWorld))selectedWorld=planetFocus;planetFocus=null;systemFocused=!!active&&hasOrbitChart(s);
 if(!systemFocused&&regionalCamera){const saved=regionalCamera;setView(saved.view,true,false,saved.federationOverview);vb={...saved.camera};baseWidth=saved.baseWidth;applyView();regionalCamera=null}
 renderDetail();setDetailOpen(false);(systemFocused?$('backToRegion'):$('focusSystem'))?.focus({preventScroll:true});endNavigation();}
