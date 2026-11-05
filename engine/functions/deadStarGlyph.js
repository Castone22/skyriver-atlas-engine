function deadStarGlyph(parent,cx,cy,scale=1){
 const g=svg('g',{class:'dead-star-glyph',transform:`translate(${cx} ${cy}) scale(${scale})`,'aria-hidden':'true'},parent);
 svg('circle',{r:13,fill:'#030308',stroke:'#996179','stroke-width':1.5},g);
 svg('path',{d:'M-11-6L-3-4 0-11 4-3 12 1M-9 7L-3 3 3 7 7 12',fill:'none',stroke:'#473248','stroke-width':1.5},g);
 svg('path',{d:'M-12 3A13 13 0 0 1-4-12M7 11A13 13 0 0 0 12-4',fill:'none',stroke:'#d497a9','stroke-width':1,opacity:.6},g);return g;
}
