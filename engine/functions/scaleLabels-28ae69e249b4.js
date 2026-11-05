function scaleLabels(){const width=$('map').getBoundingClientRect().width;if(!width)return;const unit=vb.w/width,overview=(view==='all'&&vb.w>2300)||vb.w>=DATA.atlasExtent[2]*.75,percent=zoomPercent();
 const regionSelected=view!=='all',labelsEnabled=$('labels').checked;
 const localSystems=federationOverview?272:64,otherSystems=federationOverview?332:80;
 const localPlanets=federationOverview?332:80,otherPlanets=federationOverview?(regionSelected?332:495):125;
 document.querySelectorAll('.region-ink').forEach(e=>{
  e.style.display=view==='all'||overview||!$('labels').checked?'none':'';
  e.style.fontSize=Math.min(30,Math.max(14*unit,Math.min(23*unit,22)))+'px';
 });
 document.querySelectorAll('.node-label').forEach(e=>{
  const inRegion=regionSelected&&e.closest('[data-region]').dataset.region===view;
  const x=+e.dataset.x,y=+e.dataset.y,k=unit*(innerWidth<=700?.66:.78);
  e.setAttribute('transform',`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`);
  const showName=percent>=(inRegion?localSystems:otherSystems);
  e.classList.toggle('hide-world-names',percent<(inRegion?localPlanets:otherPlanets));
  e.style.display=labelsEnabled&&showName?'':'none';
  e.style.opacity=regionSelected&&!inRegion?'0.30':'';
 });
 document.querySelectorAll('.region-title,.region-subtitle').forEach(e=>{const title=e.classList.contains('region-title');e.style.display=(view==='all'||overview)&&(title||!overview)?'':'none';e.style.fontSize=(title?(overview?Math.min(13,Math.max(6,84/unit)):17):8)*unit+'px'});$('neighborLabel').style.display=view==='all'?'':'none'}
