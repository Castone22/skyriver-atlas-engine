function blackHoleGlyph(parent,cx,cy,scale=1){
 const g=svg('g',{class:'black-hole-glyph',transform:`translate(${cx} ${cy}) scale(${scale})`,'aria-hidden':'true'},parent);
 const disk=svg('g',{transform:'rotate(-24)'},g);
 svg('ellipse',{rx:20,ry:7.5,fill:'none',stroke:'#6c589f','stroke-width':4,opacity:.25},disk);
 svg('ellipse',{rx:17,ry:6,fill:'none',stroke:'#a897dc','stroke-width':2.5},disk);
 svg('ellipse',{rx:17,ry:6,pathLength:100,fill:'none',stroke:'#f4d6ae','stroke-width':2.3,'stroke-dasharray':'19 31 7 43','stroke-linecap':'round',class:'black-hole-flow'},disk);
 svg('ellipse',{rx:20,ry:7.5,pathLength:100,fill:'none',stroke:'#b9b1ef','stroke-width':1,'stroke-dasharray':'7 18 4 29 12 30',class:'black-hole-flow outer'},disk);
 svg('circle',{r:9.5,fill:'#020307',stroke:'#b6c7e6','stroke-width':1.2},g);
 svg('path',{d:'M-13 1A13 11 0 0 1 13 1',fill:'none',stroke:'#e7d2bf','stroke-width':1.5,opacity:.85},g);
 svg('path',{d:'M-17 4Q0 10 17-4',fill:'none',stroke:'#a16b65','stroke-width':2},g);
 svg('path',{d:'M-17 4Q0 10 17-4',pathLength:100,fill:'none',stroke:'#ffe6bb','stroke-width':2,'stroke-dasharray':'20 80',class:'black-hole-flow foreground'},g);
 return g;
}
