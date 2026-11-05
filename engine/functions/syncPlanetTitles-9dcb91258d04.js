async function syncPlanetTitles(force=false){
 if(typeof fetch!=='function'||document.hidden)return;
 if(planetTitleRequest)return planetTitleRequest;
 if(!force&&Date.now()-planetTitlesChecked<60000)return;
 clearTimeout(planetTitleTimer);
 planetTitleRequest=(async()=>{
  const jobs=[];for(const known of [true,false]){
   const keys=Object.keys(DATA.worlds).filter(k=>Boolean(planetArticles[k]?.pageid)===known);
   for(let i=0;i<keys.length;i+=40)jobs.push({keys:keys.slice(i,i+40),known});
  }
  let changed=false;
  const work=async()=>{while(jobs.length){const {keys,known}=jobs.shift();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const address=new URL('https://skyrivercodex.lzridgecodes.net/api.php');
    const params={action:'query',format:'json',formatversion:'2',redirects:'1',crossorigin:'',maxage:'0',smaxage:'0',prop:'info',[known?'pageids':'titles']:keys.map(k=>known?planetArticles[k].pageid:DATA.worlds[k].articleTitle||k).join('|')};
    Object.entries(params).forEach(([k,v])=>address.searchParams.set(k,v));
    const response=await fetch(address.href,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Codex unavailable');
    const result=await response.json();if(result.error)throw Error('Codex unavailable');changed=acceptPlanetTitleBatch(keys,result)||changed;
   }catch{/* Preserve the catalogue or last confirmed title during outages. */}finally{clearTimeout(timeout)}
  }};
  await Promise.all([work(),work()]);planetTitlesChecked=Date.now();
  if(changed){savePlanetArticles();applyPlanetTitles();if(!selected&&atlasParams().get('planet'))restoreRoute(null,true)}
 })();
 try{await planetTitleRequest}finally{planetTitleRequest=null;planetTitleTimer=setTimeout(()=>syncPlanetTitles(true),60000)}
}
