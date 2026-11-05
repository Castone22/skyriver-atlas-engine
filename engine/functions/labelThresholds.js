function labelThresholds(){
 const policy=__ATLAS__.features?.labels||__ATLAS__.policies.labels;
 const box=$('map').getBoundingClientRect(),factor=policy.fixed?1:Math.max(1,640/Math.max(1,box.width),360/Math.max(1,box.height));
 const base=policy[overviewMode?'overview':'regional'];
 return Object.fromEntries(Object.entries(base).map(([key,pair])=>[key,pair.map(v=>Math.ceil(v*factor))]));
}
