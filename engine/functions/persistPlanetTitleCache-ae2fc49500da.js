function persistPlanetTitleCache(){
 const ids={},names={};
 for(const [name,id] of planetArticleIDs)if(DATA.worlds[name])ids[name]=id;
 for(const [name,title] of planetResolvedTitles)if(DATA.worlds[name])names[name]=title;
 try{localStorage.setItem(PLANET_TITLE_CACHE_KEY,JSON.stringify({ids,names}))}catch{}
}
