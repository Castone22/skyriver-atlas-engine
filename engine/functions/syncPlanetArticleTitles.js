async function syncPlanetArticleTitles(force=false){
 if(typeof fetch!=='function'||document.hidden)return;
 if(planetTitleSyncInFlight)return planetTitleSyncInFlight;
 if(!force&&Date.now()-planetTitleLastChecked<PLANET_TITLE_REFRESH_MS)return;
 planetTitleSyncInFlight=(async()=>{
  const names=Object.keys(DATA.worlds),cachedIds=new Map();
  for(const [name,id] of planetArticleIDs){if(!cachedIds.has(id))cachedIds.set(id,[]);cachedIds.get(id).push(name)}
  let changed=false,successfulBatches=0;
  const apply=(name,page,byId=false)=>{
   if(!DATA.worlds[name]||!page?.pageid||page.missing)return;
   const oldId=planetArticleIDs.get(name);
   // Stable IDs take precedence over an unrelated article recreated at the old title.
   if(!byId&&oldId&&oldId!==page.pageid)return;
   planetArticleIDs.set(name,page.pageid);
   if(planetName(name)!==page.title)changed=true;
   planetResolvedTitles.set(name,page.title);
  };
  // Query known page IDs first: they keep following a page after a move, even
  // when the wiki move has been configured not to leave a redirect.
  const idChunks=planetQueryChunks([...cachedIds.keys()].map(String));
  await Promise.all(idChunks.map(async chunk=>{
   try{const query=await planetWikiQuery({pageids:chunk.join('|')});successfulBatches++;
    for(const page of query.pages){const associated=cachedIds.get(Number(page.pageid))||[];
     for(const name of associated)apply(name,page,true)}
   }catch{}
  }));
  // Discover new articles and follow ordinary redirect moves for all 265 names.
  const chunks=planetQueryChunks(names);
  await Promise.all(chunks.map(async chunk=>{
   try{const query=await planetWikiQuery({titles:chunk.map(n=>DATA.worlds[n].articleTitle||n).join('|')});successfulBatches++;
    for(const {name,page} of planetNamesFromQuery(chunk,query))apply(name,page);
   }catch{}
  }));
  if(successfulBatches){
   planetTitleLastChecked=Date.now();persistPlanetTitleCache();
   if(changed){
    // Rebuild only the panels whose visible labels and links depend on titles;
    // IDs, focus, zoom, orbit counts, and all system data remain untouched.
    draw();scaleLabels();renderIndex();renderDetail();
   }
  }
 })();
 try{return await planetTitleSyncInFlight}finally{planetTitleSyncInFlight=null}
}
