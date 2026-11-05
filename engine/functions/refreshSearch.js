async function refreshSearch(){
 if(indexTask)return indexTask;
 indexTask=(async()=>{
  const queue=sorted().filter(r=>{const old=locationIndexes.get(r.id);return !old||old.signature!==[r.slug,r.logid||0,r.deleted||false].join('|')||Date.now()-old.checked>=300000});
  indexBusy=queue.length;renderIndex();
  await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
   while(queue.length){const r=queue.shift();try{const result=await loadSource(r);if(records.get(r.id)?.slug===r.slug)indexSource(r,result)}catch(e){const old=locationIndexes.get(r.id);if(old)old.live=false}finally{indexBusy--;renderIndex()}}
  }));
  for(const id of locationIndexes.keys())if(!records.has(id))locationIndexes.delete(id);
 })().finally(()=>{indexTask=null;renderIndex()});return indexTask;
}
