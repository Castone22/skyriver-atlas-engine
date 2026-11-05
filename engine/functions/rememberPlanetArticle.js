function rememberPlanetArticle(key,page){
 if(!DATA.worlds[key]||page?.missing||page?.invalid||page?.ns!==undefined&&page.ns!==0||!Number.isInteger(page?.pageid)||page.pageid<=0||typeof page.title!=='string'||!page.title.trim())return false;
 const old=planetArticles[key],changed=old?.title!==page.title||old?.pageid!==page.pageid;
 planetArticles[key]={title:page.title,pageid:page.pageid};return changed;
}
