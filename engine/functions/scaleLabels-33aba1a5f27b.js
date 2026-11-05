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
 const wide=overviewMode&&percent<145;
 document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled&&hasRegion&&!wide?'':'none';e.style.fontSize=Math.min(30,Math.max(14*unit,22))+'px'});
 document.querySelectorAll('.region-title,.region-subtitle').forEach(e=>{const title=e.classList.contains('region-title');e.style.display=enabled&&wide?'':'none';e.style.fontSize=(title?12:7)*unit+'px'});
}
