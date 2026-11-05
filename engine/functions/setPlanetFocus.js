function setPlanetFocus(name){
 const s=resolveSystem(selected),target=name?focusableWorld(s,name):null;if(name&&!target)return;
 beginNavigation();stationOverview=false;if(target&&!systemFocused)setSystemFocus(true);if(!target&&planetFocus&&localChartParent(s,selectedWorld))selectedWorld=planetFocus;planetFocus=target;systemZoom=1;if(target)selectedWorld=target;
 renderDetail();$('systemFocus').scrollTop=0;setDetailOpen(false);(target?$('backToSystem'):$('backToRegion'))?.focus({preventScroll:true});endNavigation();
}
