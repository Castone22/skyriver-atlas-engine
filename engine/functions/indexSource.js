function indexSource(r,result){
 const data=S.readData(result.html),entries=S.indexData(data);
 if(P.ids.includes(r.id)){sharedSources[r.id]={data:P.summarize(data),live:result.live,stamp:Number(r.logid)||Date.parse(r.timestamp)||0};sharedPolicy=P.policy(sharedSources,priorityBaseline);if(frame)frame.contentWindow.postMessage({channel:'grand-atlas-priority',token:frame.dataset.token,policy:sharedPolicy},'*')}
 locationIndexes.set(r.id,{entries,live:result.live,signature:[r.slug,r.logid||0,r.deleted||false].join('|'),checked:Date.now()});renderIndex();
}
