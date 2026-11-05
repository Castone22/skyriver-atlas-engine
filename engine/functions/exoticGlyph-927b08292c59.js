function exoticGlyph(parent,type,cx,cy,scale=1,component=0){
 const g=svg('g',{class:'exotic-glyph '+type,transform:`translate(${cx} ${cy}) scale(${scale})`,'aria-hidden':'true'},parent);
 if(type==='cataclysmic-variable'){
  if(component===1){svg('circle',{r:7,fill:'#dc8c73'},g);return g}
  const disk=svg('g',{class:'variable-disk'},g);
  svg('ellipse',{rx:19,ry:8,fill:'none',stroke:'#dbb9f0','stroke-width':5,opacity:.6,transform:'rotate(-22)'},disk);
  svg('ellipse',{rx:13,ry:5,fill:'none',stroke:'#98d9f3','stroke-width':2,transform:'rotate(-22)'},disk);
  svg('circle',{r:5,fill:'#e8f8ff'},g);return g;
 }
 const tint=type==='magnetar'?'#cfaaed':'#8edce9';
 const beams=svg('g',{class:'exotic-beams'},g);
 svg('path',{d:'M-3-4L-6-33 6-33 3-4Z M-3 4L-6 33 6 33 3 4Z',fill:tint,opacity:.2},beams);
 svg('path',{d:'M0-7V-33M0 7V33',stroke:tint,'stroke-width':1.2,opacity:.8,class:'jet-axis'},beams);
 const ribbon=svg('g',{class:'jet-ribbon'},beams);svg('path',{d:'M0-6C8-11-8-17 0-22S6-29 0-33M0 6C-8 11 8 17 0 22S-6 29 0 33',fill:'none',stroke:tint,'stroke-width':1.4,opacity:.85},ribbon);
 if(type==='magnetar'){
  const field=svg('g',{class:'magnetic-field'},g);
  [-45,0,45].forEach((angle,index)=>{
   const line={rx:21,ry:9,fill:'none',transform:`rotate(${angle})`};
   svg('ellipse',{...line,stroke:tint,'stroke-width':.8,opacity:.5},field);
   svg('ellipse',{...line,stroke:'#eee0ff','stroke-width':1.5,pathLength:100,class:'magnetic-current',style:`animation-delay:-${index*1.3}s`},field);
  });
 }
 svg('circle',{r:12,fill:tint,opacity:.1},g);svg('circle',{r:5,fill:'#e5f7ff',stroke:tint,'stroke-width':1.5},g);return g;
}
