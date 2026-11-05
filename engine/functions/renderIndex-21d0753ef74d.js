function renderIndex(){
 const list=$('indexList'),q=$('search').value.trim();list.replaceChildren();
 function row(r,e=null,regional=false){
  const box=document.createElement('div');box.className='index-row'+(regional?' region-row':'');box.style.setProperty('--c',r.color||'#8f9ead');
  const name=e?.name||r.name,article=e?.article||r.article,href=article?articleURL(article)+(e?.section?'#'+encodeURIComponent(e.section):''):sourceURL(r.slug);
  const b=document.createElement(e&&!e.route?'a':'button');
  if(b.tagName==='A'){b.href=href;b.target='_blank';b.rel='noopener';b.className='article-name'}
  else b.onclick=()=>openAtlas(r.id,!!r.position,e?.route||null);
  const dot=document.createElement('i');b.append(dot,document.createTextNode(name));
  const sub=document.createElement('small');
  sub.textContent=e?[e.type,r.name,e.system&&e.type!=='System'?e.system:'',!locationIndexes.get(r.id)?.live?'Preview':''].filter(Boolean).join(' · '):(r.position?'Plotted empire':'Atlas')+' · '+(r.deleted?'Archived preview':r.live?'Published on Codex':'Bundled preview');
  if(q||active!=='galaxy')b.append(sub);const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener';a.textContent='↗';a.title='Open '+name+' in Codex';a.setAttribute('aria-label',a.title);box.append(b,a);list.append(box);
 }
 const available=sorted(),missing=available.filter(r=>!locationIndexes.has(r.id)).length,previews=available.filter(r=>locationIndexes.has(r.id)&&!locationIndexes.get(r.id).live).length;
 let message=indexBusy?'Updating galaxy search…':missing?missing+' atlas'+(missing===1?'':'es')+' could not be indexed.':previews?'Search includes '+previews+' bundled preview'+(previews===1?'':'s')+'.':'Search covers all '+available.length+' atlases.';
 if(!q){
  for(const r of available){
   if(active==='galaxy'){row(r);continue}
   row(r);
   for(const e of locationIndexes.get(r.id)?.entries||[])if(e.type==='Region')row(r,e,true);
  }
 }
 else{
  const results=[];
  for(const r of available){const score=S.rank({name:r.name,aliases:[r.slug,r.article||'',...(r.aliases||[])]},q);if(score>=0)results.push({r,e:null,score});for(const e of locationIndexes.get(r.id)?.entries||[]){if(!preferredEntry(r.id,e))continue;const score=S.rank(e,q,r.name);if(score>=0)results.push({r,e,score})}}
  results.sort((a,b)=>a.score-b.score||(a.e?.name||a.r.name).localeCompare(b.e?.name||b.r.name)||a.r.name.localeCompare(b.r.name));
  for(const hit of results.slice(0,resultLimit))row(hit.r,hit.e);
  message=results.length+' result'+(results.length===1?'':'s')+' · '+message;
  if(results.length>resultLimit){const more=document.createElement('button');more.className='show-more';more.textContent='Show more ('+(results.length-resultLimit)+' remaining)';more.onclick=()=>{resultLimit+=100;renderIndex()};list.append(more)}
  if(!results.length){const p=document.createElement('p');p.textContent=indexBusy?'Searching the remaining atlases…':'No matching locations. Try another name or spelling.';list.append(p)}
 }
 $('searchStatus').textContent=q||active!=='galaxy'?message:'';
}
