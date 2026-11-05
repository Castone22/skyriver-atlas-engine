function bindDetail(){
 const classified=$('classifiedSystem');
 if(classified)classified.onclick=()=>select(classified.dataset.system);
 $('refreshArticleData')?.addEventListener('click',()=>{syncPlanetTitles(true);refreshVisibleImage(true)});$('detail').querySelector('.detail-close').onclick=()=>setDetailOpen(false);document.querySelectorAll('[data-notable]').forEach(b=>b.onclick=()=>chooseSystemWorld(b.dataset.notable))}
