function restorePlanetArticles(){
 try{
  const saved=JSON.parse(localStorage.getItem('atlas-planet-articles-v1:'+__ATLAS__.id)||'{}');
  for(const [key,v] of Object.entries(saved)){
   if(rememberPlanetArticle(key,{title:v?.title,displaytitle:v?.display,pageid:v?.pageid})&&Array.isArray(v.aliases))
    DATA.planetArticles[key].aliases=v.aliases.filter(t=>typeof t==='string').slice(-20);
  }
 }catch{}
}
