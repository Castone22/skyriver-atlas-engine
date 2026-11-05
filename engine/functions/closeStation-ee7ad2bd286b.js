function closeStation(){
 beginNavigation();stationOverview=false;renderDetail();$('systemFocus').scrollTop=0;
 const target=Array.from(document.querySelectorAll('[data-tora-open], [data-foundry-open]')).find(el=>(el.dataset.toraOpen||el.dataset.foundryOpen)===selectedWorld);target?.focus({preventScroll:true});endNavigation();
}
