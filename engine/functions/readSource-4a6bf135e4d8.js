async function readSource(r){
 if(!r.deleted){
  const url=new URL(sourceURL(r.slug));url.searchParams.set('_ga',String(Date.now()));
  try{const html=await fetchText(url.href);validateHTML(html);return {html,live:true,url:sourceURL(r.slug)}}catch(e){
   if(!snapshots[r.id])throw new Error('The published atlas could not be loaded. Check your connection or open its Codex source.');
   return {html:await unpack(r.id),live:false,url:sourceURL(r.slug),reason:r.live?'Live source unavailable':'Not yet published'};
  }
 }
 return {html:await unpack(r.id),live:false,url:sourceURL(r.slug),reason:'Source removed from Codex'};
}
