function scaleLabels(){
 const box=$('map').getBoundingClientRect();if(!box.width||!box.height)return;
 const unit=Math.max(vb.w/box.width,vb.h/box.height),percent=zoomPercent(),enabled=$('labels').checked;
 document.querySelectorAll('.node-label').forEach(el=>{
  const record=DATA.systems.find(s=>s.id===el.dataset.id),active=record.region===highlightedRegion;
  const [names,planets]=labelThresholds(active),x=+el.dataset.x,y=+el.dataset.y,k=unit*.78;
  el.setAttribute('transform',`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`);
  el.style.display=enabled&&percent>=names?'':'none';
  el.style.opacity=highlightedRegion&&!active?'.34':'1';
  el.querySelectorAll('.world-label').forEach(label=>label.parentNode.style.display=percent>=planets?'':'none');
 });
 document.querySelectorAll('.region-inscription').forEach(el=>el.style.display=enabled?'':'none');
 const primary=labelThresholds(!!highlightedRegion),neighbor=labelThresholds(false);
 $('zoomLabel').title='System names ≥ '+primary[0]+'% · planet labels ≥ '+primary[1]+'%'+(highlightedRegion?' · neighbors ≥ '+neighbor[0]+'% / '+neighbor[1]+'%':'');
}
