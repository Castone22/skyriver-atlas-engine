function labelThresholds(active){
 const policy=__ATLAS__.features?.labels||__ATLAS__.policies.labels;
 const box=$('map').getBoundingClientRect();
 if(__ATLAS__.flags.perSystemLabels){
  const scale=Math.max(1,520/Math.max(1,Math.min(box.width,box.height)));
  return policy.levels[view==='all'?'overview':'regional'][active?'active':'neighbor'].map(n=>Math.ceil(n*scale));
 }
 const factor=policy.fixed?1:Math.max(1,640/Math.max(1,box.width),360/Math.max(1,box.height));
 const base=policy[overviewMode?'overview':'regional'];
 return Object.fromEntries(Object.entries(base).map(([key,pair])=>[key,pair.map(v=>Math.ceil(v*factor))]));
}
