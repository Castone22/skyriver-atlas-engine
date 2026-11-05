function endPointer(e){const region=drag?.region;if(e.type!=='pointercancel'&&!moved&&pointers.size===1&&region)highlightRegion(region);pointers.delete(e.pointerId);drag=null;pinch=null;}
