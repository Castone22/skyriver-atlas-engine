async function openAtlas(id,animate=false,route=null){
 let r=records.get(id);if(!r)return;
 const wasGalaxy=active==='galaxy';if(wasGalaxy)savedView={...view};
 resetRealm();darkGate.hidden=true;const my=++generation;active=id;currentRoute=route;setIndex(false);$('atlasSelect').value=id;$('back').hidden=false;$('sourceLink').href=sourceURL(r.slug);$('sourceLink').hidden=false;
 try{history.replaceState(null,'','#atlas='+encodeURIComponent(id))}catch(e){}
 clearTimeout(loadTimer);
 if(frame){frame.remove();frame=null} $('host').hidden=true;
 if(animate&&wasGalaxy&&!reduced)finishWarp=transit.warp(id);
 $('orbitRoot').hidden=true;
 $('heading').hidden=true;$('tools').hidden=true;$('mapNote').hidden=true;
 overlay(r.name,'Reading the latest published atlas…');status('Loading '+r.name+'…');
 try{
  let result;
  if(P.ids.includes(id)){
   const pair=await Promise.all(P.ids.map(async key=>{const record=records.get(key);if(!record)return null;try{const source=await loadSource(record);try{indexSource(record,source)}catch{}return [key,source]}catch{return null}}));
   if(my!==generation)return;const sources=new Map(pair.filter(Boolean));
   const resolved=P.resolve(sharedPolicy,id,route);if(sources.has(resolved.id)){id=resolved.id;route=resolved.route;r=records.get(id)}
   result=sources.get(id);if(!result)throw new Error('The preferred atlas could not be loaded. Retry or open its Codex source.');
   active=id;currentRoute=route;$('atlasSelect').value=id;$('sourceLink').href=sourceURL(r.slug);try{history.replaceState(null,'','#atlas='+encodeURIComponent(id))}catch{}
  }else result=await loadSource(r);
  if(my!==generation)return;validateHTML(result.html);try{indexSource(r,result)}catch{}if(result.live){r.live=true;renderIndex()}
  const token=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
  const child=document.createElement('iframe');child.title=r.name+' stellar atlas';child.setAttribute('sandbox','allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox');child.setAttribute('referrerpolicy','no-referrer');
  child.dataset.token=token;child.dataset.live=String(result.live);child.dataset.name=r.name;child.dataset.reason=result.reason||'';
  child.srcdoc=adaptHTML(result.html,r,token,result.url,route);frame=child;$('host').replaceChildren(child);$('host').hidden=false;
  loadTimer=setTimeout(()=>{if(my===generation&&!$('loading').hidden){cancelTransit();overlay(r.name,'The atlas has not finished starting. Retry, or open its source using the link below.',true)}},25000);
 }catch(e){if(my!==generation)return;cancelTransit();overlay(r.name,e.message,true);status('Unable to open '+r.name)}
}
