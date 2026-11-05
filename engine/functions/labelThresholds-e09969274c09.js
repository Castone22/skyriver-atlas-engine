function labelThresholds(active){
 const box=$('map').getBoundingClientRect(),factor=Math.max(1,520/Math.max(1,Math.min(box.width,box.height)));
 return LABEL_ZOOM[view==='all'?'overview':'regional'][active?'active':'neighbor'].map(n=>Math.ceil(n*factor));
}
