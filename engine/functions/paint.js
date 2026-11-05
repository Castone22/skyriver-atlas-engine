function paint(){ $('camera').setAttribute('transform',`translate(${view.x} ${view.y}) scale(${view.k})`);$('zoom').value=Math.round(view.k*100)+'%'}
