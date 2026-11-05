async function syncPlanetTitles(force=false){
 if(typeof fetch!=='function'||document.hidden)return;
 if(planetTitleRequest)return planetTitleRequest;
 if(Date.now()-planetTitleCheckedAt<(force?3000:60000))return;
 planetTitleCheckedAt=Date.now();
 planetTitleRequest=(async()=>{
  let changed=false;const records=[...planetTitles.values()],untracked=records.filter(r=>!r.pageid),tracked=records.filter(r=>r.pageid);
  for(let i=0;i<tracked.length;i+=40){const batch=tracked.slice(i,i+40);try{const q=await planetTitleAPI({pageids:[...new Set(batch.map(r=>r.pageid))].join('|')});for(const r of batch){const p=resolvedPlanetPage(q,r,true);if(p)changed=acceptPlanetPage(r,p)||changed;else untracked.push(r)}}catch{}}
  for(let i=0;i<untracked.length;i+=40){const batch=untracked.slice(i,i+40);try{const q=await planetTitleAPI({titles:[...new Set(batch.map(r=>r.seed))].join('|')});for(const r of batch)changed=acceptPlanetPage(r,resolvedPlanetPage(q,r))||changed}catch{}}
  savePlanetTitles();if(changed&&routeReady)refreshPlanetTitleUI();
 })();try{await planetTitleRequest}finally{planetTitleRequest=null}
}
