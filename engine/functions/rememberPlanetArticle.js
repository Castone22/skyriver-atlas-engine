// Keep what the wiki says about a planet's article. Returns true when something changed.
function rememberPlanetArticle(key,page){
 if(!DATA.worlds[key]||page?.missing||page?.invalid||page?.ns!==undefined&&page.ns!==0||!Number.isInteger(page?.pageid)||page.pageid<=0||typeof page.title!=='string'||!page.title.trim())return false;
 const articles=DATA.planetArticles||(DATA.planetArticles={}),old=articles[key];
 // DISPLAYTITLE comes as HTML; keep its text.
 const plain=t=>String(t).replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&amp;/g,'&').trim();
 const display=page.displaytitle!==undefined?plain(page.displaytitle)||page.title:old?.title===page.title?old.display||page.title:page.title;
 const aliases=[...(old?.aliases||[])];
 for(const t of [old?.title,old?.display])if(t&&t!==page.title&&t!==display&&!aliases.includes(t))aliases.push(t);
 const changed=old?.title!==page.title||old?.pageid!==page.pageid||old?.display!==display;
 articles[key]={title:page.title,display,pageid:page.pageid,aliases:aliases.slice(-20)};
 planetKey.index=null;canonicalTitle.map=null;
 return changed;
}
