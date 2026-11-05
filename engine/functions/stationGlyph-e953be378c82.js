function stationGlyph(parent,tint,category,scale=1,ruined=false){if(category==='TORA'){
 const icon=svg('g',{transform:'scale('+scale+')','data-station-shape':'TORA'},parent);
 svg('circle',{r:9,fill:'#102a44',stroke:tint,'stroke-dasharray':'12 5','stroke-width':2},icon);
 svg('circle',{r:2.5,fill:tint},icon);svg('circle',{cx:8,cy:-4,r:2,fill:'#398cff'},icon);return}
 const shape=STATION_SILHOUETTES[category],g=svg('g',{transform:`scale(${scale})`,'data-station-shape':category,...(ruined?{'data-ruined':'true',opacity:.65}:{})},parent);svg('path',{d:shape.hull,fill:'#122331',stroke:tint,'stroke-width':1.2,'fill-rule':'evenodd','stroke-linejoin':'round'},g);svg('path',{d:shape.detail,fill:'none',stroke:tint,'stroke-width':.85,opacity:.85},g);if(ruined)svg('path',{d:'M-11 8L-3 2 0 4 10-9',stroke:'#090f17','stroke-width':2.5,fill:'none'},g);}
