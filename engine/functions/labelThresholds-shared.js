function labelThresholds(){
 const box=$('map').getBoundingClientRect(),factor=Math.max(1,640/Math.max(1,box.width),360/Math.max(1,box.height));
 const policy=__ATLAS__.features?.labels||__ATLAS__.policies.labels;
 const base=policy[overviewMode?'overview':'regional'];
 return Object.fromEntries(Object.entries(base).map(([key,pair])=>[key,pair.map(v=>Math.ceil(v*factor))]));
}
