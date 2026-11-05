function closeStation(){
 beginNavigation();stationOverview=false;renderDetail();$('systemFocus').scrollTop=0;
 const target=Array.from(document.querySelectorAll('[data-tora-open]')).find(el=>el.dataset.toraOpen===selectedWorld);target?.focus({preventScroll:true});endNavigation();
}
