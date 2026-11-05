function acceptPlanetTitleBatch(keys,result){
 const query=result?.query;if(!query||!Array.isArray(query.pages))throw Error('Invalid title response');
 const redirects=new Map([...(query.normalized||[]),...(query.redirects||[])].map(r=>[r.from,r.to]));
 let changed=false;
 for(const key of keys){
  const known=planetArticles[key];let target=DATA.worlds[key].articleTitle||key;const seen=new Set();
  while(redirects.has(target)&&!seen.has(target)){seen.add(target);target=redirects.get(target)}
  const page=known?.pageid?query.pages.find(p=>p.pageid===known.pageid):query.pages.find(p=>p.title===target);
  changed=rememberPlanetArticle(key,page)||changed;
 }
 return changed;
}
