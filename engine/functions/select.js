function select(id,world=null,focus=false,openDrawer=true){const flags=__ATLAS__.flags,OV=flags.overviewStateKey,s=resolveSystem(id);if(!s)return;id=s.id;beginNavigation();stationOverview=false;
 const keepSystemFocus=systemFocused;planetFocus=null;if(selected!==id)systemZoom=1;
 const rememberCamera=()=>flags.highlightedRegionState?{view,highlightedRegion,camera:{...vb},baseWidth}:{view,[OV]:overviewMode,camera:{...vb},baseWidth};
 const followRegion=()=>{if(!flags.selectKeepsRegion&&s.region&&view!==s.region&&!overviewMode)setView(s.region,true)};
 followRegion();
 if(focus&&s.region){setView(s.region,true)}
 if((keepSystemFocus||s.unplottedSystem)&&hasOrbitChart(s)&&!regionalCamera)regionalCamera=rememberCamera();systemFocused=Boolean((keepSystemFocus||s.unplottedSystem)&&hasOrbitChart(s));if(!hasOrbitChart(s))regionalCamera=null;selected=id;selectedWorld=resolveObjectName(s,world)||(flags.selectFirstWorld&&!widgetMode?(s.worlds.find(w=>DATA.worlds[w])||null):null);const localHost=localChartParent(s,selectedWorld);if(localHost&&hasOrbitChart(s)){followRegion();if(!regionalCamera)regionalCamera=rememberCamera();systemFocused=true;planetFocus=localHost;}updateSelection();renderIndex();renderDetail();if(openDrawer&&innerWidth<=700)setDetailOpen(true);else if(!openDrawer)setDetailOpen(false);if(flags.closeSidebarOnSelect)$('sidebar').classList.remove('open');endNavigation();
}
