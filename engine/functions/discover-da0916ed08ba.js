async function discover(){
 if(discoverTask)return discoverTask;
 discoverTask=(async()=>{
  if(active==='galaxy')status('Checking the Codex atlas directory…');
  try{
   let continuation={},events=[];
   do{const j=await api({list:'logevents',letype:'atlasembed',leprop:'title|type|timestamp|details|ids',lelimit:500,...continuation});events.push(...(j.query?.logevents||[]));continuation=j.continue||null}while(continuation);
   const current=C.foldEvents(events),next=new Map(seeds.map(r=>[r.id,{...r,live:false,deleted:false}]));
   // Reconcile by actual slug first. A deleted misspelled slug must not hide a live corrected slug.
   for(const e of current.filter(e=>e.deleted)){const r=next.get(e.id);if(r&&!current.some(a=>a.id===e.id&&!a.deleted)){r.deleted=true;r.live=false}}
   for(const e of [...current.filter(e=>!e.deleted)].reverse()){
    const prior=next.get(e.id);next.set(e.id,{...prior,...e,name:prior?.name||e.name,live:true,deleted:false});
   }
   records=next;discoveryOK=true;lastDiscovery=Date.now();rebuild();refreshSearch();
   if(active==='galaxy')status(records.size+' stellar atlases · directory updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),true);
   return true;
  }catch(e){discoveryOK=false;refreshSearch();if(active==='galaxy')status('Directory unavailable · showing known atlases');return false}
  finally{discoverTask=null}
 })();return discoverTask;
}
