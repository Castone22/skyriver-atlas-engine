function select(id,world=null,focus=false,openDrawer=true){const s=resolveSystem(id);if(!s)return;id=s.id;beginNavigation();
 const keepSystemFocus=systemFocused;planetFocus=null;if(selected!==id)systemZoom=1;
 if(s.region&&view!==s.region&&!overviewMode)setView(s.region,true);
 if(focus&&s.region){setView(s.region,true)}
 if((keepSystemFocus||s.unplottedSystem)&&hasOrbitChart(s)&&!regionalCamera)regionalCamera={view,federationOverview: overviewMode,camera:{...vb},baseWidth};systemFocused=Boolean((keepSystemFocus||s.unplottedSystem)&&hasOrbitChart(s));if(!hasOrbitChart(s))regionalCamera=null;selected=id;selectedWorld=resolveObjectName(s,world)||(s.worlds.find(w=>DATA.worlds[w])||null);const localHost=localChartParent(s,selectedWorld);if(localHost&&hasOrbitChart(s)){if(s.region&&view!==s.region&&!overviewMode)setView(s.region,true);if(!regionalCamera)regionalCamera={view,federationOverview: overviewMode,camera:{...vb},baseWidth};systemFocused=true;planetFocus=localHost;}updateSelection();renderIndex();renderDetail();if(openDrawer&&innerWidth<=700)setDetailOpen(true);else if(!openDrawer)setDetailOpen(false);$('sidebar').classList.remove('open');endNavigation();
}
