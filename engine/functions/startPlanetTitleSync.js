// Restore the titles saved from earlier visits, then keep them current.
function startPlanetTitleSync(){
 restorePlanetArticles();
 addEventListener('focus',()=>syncPlanetTitles(true));addEventListener('online',()=>syncPlanetTitles(true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(syncPlanetTitles.state?.timer);else syncPlanetTitles(true)});
 syncPlanetTitles(true);
}
