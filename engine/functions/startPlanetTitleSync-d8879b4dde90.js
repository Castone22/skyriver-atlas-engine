function startPlanetTitleSync(){
 syncPlanetTitles(true);
 addEventListener('focus',()=>syncPlanetTitles(true));addEventListener('online',()=>syncPlanetTitles(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPlanetTitles(true)});
 setInterval(()=>syncPlanetTitles(),60000);
}
