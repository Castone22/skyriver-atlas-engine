function bindDetail(){
 const classified=$('classifiedSystem');
 if(classified)classified.onclick=()=>select(classified.dataset.system);
 $('refreshArticleData')?.addEventListener('click',()=>{refreshVisibleImage(true);syncPlanetArticleTitles(true)});$('detail').querySelector('.detail-close').onclick=()=>setDetailOpen(false);document.querySelectorAll('[data-notable]').forEach(b=>b.onclick=()=>chooseSystemWorld(b.dataset.notable))}
