function closeStation(){
 beginNavigation();stationOverview=false;renderDetail();$('systemFocus').scrollTop=0;
 const target=Array.from(document.querySelectorAll('[data-schematic-open]')).find(el=>el.dataset.schematicOpen===selectedWorld);target?.focus({preventScroll:true});endNavigation();
}
