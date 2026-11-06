function routeSnapshot(){
 const flags=__ATLAS__.flags,snapshot={atlas:true,view};
 if(flags.highlightedRegionState)snapshot.highlightedRegion=highlightedRegion;else snapshot[flags.overviewStateKey]=overviewMode;
 if(flags.stationRoute)snapshot.stationOverview=stationOverview;
 return {...snapshot,selected,selectedWorld,focused:systemFocused,planetFocus,camera:{...vb},baseWidth,regionalCamera:regionalCamera?{...regionalCamera,camera:{...regionalCamera.camera}}:null};
}
