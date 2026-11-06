function scaleLabels(){
 if(__ATLAS__.flags.perSystemLabels){
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
  return;
 }
 const width=$('map').getBoundingClientRect().width;if(!width)return;
 const unit=vb.w/width,percent=zoomPercent(),enabled=$('labels').checked,hasRegion=view!=='all',style=__ATLAS__.flags.regionLabelStyle;
 const thresholds=labelThresholds(),[near,far]=__ATLAS__.policies.labels.nodeScale;
 document.querySelectorAll('.node-label').forEach(e=>{
  const active=hasRegion&&e.closest('[data-region]').dataset.region===view;
  const levels=active?thresholds.active:(hasRegion&&thresholds.otherRegion)||thresholds.other;
  const x=+e.dataset.x,y=+e.dataset.y,k=unit*(innerWidth<=700?near:far);
  e.setAttribute('transform',`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`);
  e.style.display=enabled&&percent>=levels[0]?'':'none';
  e.classList.toggle('hide-world-names',percent<levels[1]);
  e.style.opacity=hasRegion&&!active?'0.30':'';
 });
 if(style==='ink'){
  document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled?'':'none';e.style.fontSize=Math.min(84,Math.max(24,12*unit))+'px';e.style.opacity=hasRegion&&e.dataset.regionInk!==view?'0.13':'0.26'});
 }else if(style==='ink-title'){
  document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled&&!overviewMode?'':'none';e.style.fontSize=Math.min(30,Math.max(14*unit,Math.min(23*unit,22)))+'px';e.style.opacity=hasRegion&&e.dataset.regionInk!==view?'0.10':'0.25'});
  document.querySelectorAll('.region-title').forEach(e=>{e.style.display=enabled&&overviewMode?'':'none';e.style.fontSize=Math.min(13,Math.max(6,84/unit))*unit*1.25+'px';e.style.opacity=hasRegion&&e.dataset.regionTitle!==view?'0.12':'0.32'});
 }else if(style==='title-subtitle-ink'){
  const wide=overviewMode&&percent<145;
  document.querySelectorAll('.region-ink').forEach(e=>{e.style.display=enabled&&hasRegion&&!wide?'':'none';e.style.fontSize=Math.min(30,Math.max(14*unit,22))+'px'});
  document.querySelectorAll('.region-title,.region-subtitle').forEach(e=>{const title=e.classList.contains('region-title');e.style.display=enabled&&wide?'':'none';e.style.fontSize=(title?12:7)*unit+'px'});
 }else{
  const overview=(view==='all'&&vb.w>2300)||vb.w>=DATA.atlasExtent[2]*.75;
  document.querySelectorAll('.region-ink').forEach(e=>{
   e.style.display=view==='all'||overview||!$('labels').checked?'none':'';
   e.style.fontSize=Math.min(30,Math.max(14*unit,Math.min(23*unit,22)))+'px';
  });
  document.querySelectorAll('.region-title,.region-subtitle').forEach(e=>{const title=e.classList.contains('region-title');e.style.display=(view==='all'||overview)&&(title||!overview)?'':'none';e.style.fontSize=(title?(overview?Math.min(13,Math.max(6,84/unit)):17):8)*unit+'px'});$('neighborLabel').style.display=view==='all'?'':'none';
 }
}
