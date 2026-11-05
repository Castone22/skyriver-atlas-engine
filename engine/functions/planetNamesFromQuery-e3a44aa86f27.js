function planetNamesFromQuery(names,query){
 // The API returns pages by canonical name rather than input order. MediaWiki
 // normalization and redirect tables are used to map each old atlas title to it.
 const renames=new Map();
 for(const pair of [...(query.normalized||[]),...(query.redirects||[])])renames.set(wikiTitleKey(pair.from),pair.to);
 const pages=new Map((query.pages||[]).filter(p=>!p.missing&&p.pageid>0&&p.ns===0).map(p=>[wikiTitleKey(p.title),p]));
 const resolved=[];
 for(const name of names){
  let title=DATA.worlds[name]?.articleTitle||name;
  const seen=new Set();
  for(let n=0;n<16;n++){
   const key=wikiTitleKey(title),next=renames.get(key);
   if(!next||seen.has(key))break;
   seen.add(key);title=next;
  }
  const page=pages.get(wikiTitleKey(title));
  if(page)resolved.push({name,page});
 }
 return resolved;
}
