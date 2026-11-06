async function loadLiveImage(title,force=false){
 if(liveImageRequests.has(title))return liveImageRequests.get(title);
 const saved=liveImages.get(title);if(!force&&saved&&Date.now()-saved.checkedAt<IMAGE_REFRESH_MS)return saved;
 const request=(async()=>{
  let facts=saved?.facts;
  try{
   const key=planetKey(title),identity=key&&DATA.planetArticles?.[key];
   const page=await imageAPI({...identity?.pageid?{pageids:String(identity.pageid)}:{titles:title},prop:'revisions',rvprop:'ids|content',rvslots:'main'});
   if(key&&rememberPlanetArticle(key,page)){savePlanetArticles();refreshPlanetTitleUI()}
   let asset={articleTitle:title,image:null,imageSource:{articleTitle:title,articleUrl:url(page.title||title)}};
   if(page.missing)facts=null;
   if(!page.missing){const revision=page.revisions?.[0],content=revision?.slots?.main?.content;if(typeof content!=='string')throw Error('Missing article content');const box=leadInfobox(content);facts=dossierFacts(box);const file=fileFromInfobox(box);
    if(file){const filePage=await imageAPI({titles:file,prop:'imageinfo',iiprop:'url|sha1|mime|timestamp',iiurlwidth:'768'});
     if(!filePage.missing){const info=filePage.imageinfo?.[0];if(!info?.url||!info.mime?.startsWith('image/'))throw Error('Missing file information');const address=safeImageURL(info.thumburl||info.url);address.searchParams.set('atlasImageRevision',info.sha1||info.timestamp||String(revision.revid));asset={...asset,image:address.href,imageSource:{...asset.imageSource,articleRevision:revision.revid,fileTitle:filePage.title}};}
    }
   }
   const entry={asset,facts,checkedAt:Date.now(),error:false};liveImages.set(title,entry);return entry;
  }catch{const entry={asset:saved?.asset,facts,checkedAt:Date.now(),error:true};liveImages.set(title,entry);return entry;}
 })();liveImageRequests.set(title,request);try{return await request}finally{liveImageRequests.delete(title)}
}
