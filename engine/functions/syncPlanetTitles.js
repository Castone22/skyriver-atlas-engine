// Ask the wiki what each planet's article is called now: by page id where it is known (a page keeps its
// id when moved, with or without a redirect), by title otherwise. Offline, or on any error, the titles
// already known stay.
async function syncPlanetTitles(force=false){
 const state=syncPlanetTitles.state||(syncPlanetTitles.state={request:null,timer:0,checked:0});
 if(typeof fetch!=='function'||document.hidden)return;
 if(state.request)return state.request;
 if(!force&&Date.now()-state.checked<60000)return;
 clearTimeout(state.timer);
 state.request=(async()=>{
  const articles=DATA.planetArticles||(DATA.planetArticles={}),jobs=[];
  for(const known of [true,false]){
   const keys=Object.keys(DATA.worlds).filter(k=>Boolean(articles[k]?.pageid)===known);
   for(let i=0;i<keys.length;i+=40)jobs.push({keys:keys.slice(i,i+40),known});
  }
  let changed=false;
  const work=async()=>{while(jobs.length){const {keys,known}=jobs.shift();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const address=new URL('{{wikiBase|jsstr}}/api.php');
    const params={action:'query',format:'json',formatversion:'2',redirects:'1',crossorigin:'',maxage:'0',smaxage:'0',prop:'info',inprop:'displaytitle',[known?'pageids':'titles']:keys.map(k=>known?articles[k].pageid:DATA.worlds[k].articleTitle||k).join('|')};
    Object.entries(params).forEach(([k,v])=>address.searchParams.set(k,v));
    const response=await fetch(address.href,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Wiki unavailable');
    const result=await response.json();if(result.error)throw Error('Wiki unavailable');changed=acceptPlanetTitleBatch(keys,result)||changed;
   }catch{/* Keep the titles already known during an outage. */}finally{clearTimeout(timeout)}
  }};
  await Promise.all([work(),work()]);state.checked=Date.now();
  if(changed){savePlanetArticles();refreshPlanetTitleUI();if(!selected&&atlasParams().get('planet'))restoreRoute(null,true)}
 })();
 try{await state.request}finally{state.request=null;state.timer=setTimeout(()=>syncPlanetTitles(true),60000)}
}
