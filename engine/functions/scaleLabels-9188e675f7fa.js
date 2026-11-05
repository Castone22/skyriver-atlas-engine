function scaleLabels(){
 const width=$('map').getBoundingClientRect().width;if(!width)return;
 const unit=vb.w/width,percent=zoomPercent(),enabled=$('labels').checked,hasRegion=view!=='all';
 const thresholds=labelThresholds();
 document.querySelectorAll('.node-label').forEach(e=>{
  const active=hasRegion&&e.closest('[data-region]').dataset.region===view;
  const levels=active?thresholds.active:thresholds.other;
  const x=+e.dataset.x,y=+e.dataset.y,k=unit*(innerWidth<=700?.66:.78);
  e.setAttribute('transform',`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`);
  e.style.display=enabled&&percent>=levels[0]?'':'none';
  e.classList.toggle('hide-world-names',percent<levels[1]);
  e.style.opacity=hasRegion&&!active?'0.30':'';
 });
 document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled&&!overviewMode?'':'none';e.style.fontSize=Math.min(30,Math.max(14*unit,Math.min(23*unit,22)))+'px';e.style.opacity=hasRegion&&e.dataset.regionInk!==view?'0.10':'0.25'});
 document.querySelectorAll('.region-title').forEach(e=>{e.style.display=enabled&&overviewMode?'':'none';e.style.fontSize=Math.min(13,Math.max(6,84/unit))*unit*1.25+'px';e.style.opacity=hasRegion&&e.dataset.regionTitle!==view?'0.12':'0.32'});
}
