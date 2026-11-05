function applyView(){
 $('map').setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);$('nodes').classList.toggle('overview',false);$('regionLayer').classList.toggle('overview',vb.w>2300);
 $('zoomLabel').textContent=zoomPercent()+'%';drawMinimap();scaleLabels();persistRoute();
}
