function scaleLabels(){
 const width=$('map').getBoundingClientRect().width;if(!width)return;
 const unit=vb.w/width,percent=zoomPercent(),enabled=$('labels').checked,hasRegion=view!=='all';
 const thresholds=labelThresholds();
 document.querySelectorAll('.node-label').forEach(e=>{
  const active=hasRegion&&e.closest('[data-region]').dataset.region===view;
  const levels=active?thresholds.active:thresholds.other;
  const x=+e.dataset.x,y=+e.dataset.y,k=unit*(innerWidth<=700?.78:.88);
  e.setAttribute('transform',`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`);
  e.style.display=enabled&&percent>=levels[0]?'':'none';
  e.classList.toggle('hide-world-names',percent<levels[1]);
  e.style.opacity=hasRegion&&!active?'0.30':'';
 });
 document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled?'':'none';e.style.fontSize=Math.min(84,Math.max(24,12*unit))+'px';e.style.opacity=hasRegion&&e.dataset.regionInk!==view?'0.13':'0.26'});
}
