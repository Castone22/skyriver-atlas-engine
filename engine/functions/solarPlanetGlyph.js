function solarPlanetGlyph(parent,world,radius){
 const w=DATA.worlds[world],kind=w.solarAnalogue;
 const g=svg('g',{transform:`scale(${radius/32})`,'data-solar-analogue':kind,'pointer-events':'none'},parent);
 const ring=()=>svg('ellipse',{rx:55,ry:17,fill:'none',stroke:'#c9bda0','stroke-width':8,transform:'rotate(-23)'},g);
 if(kind==='Saturn')ring();
 svg('circle',{r:32,fill:w.tint},g);
 const id='solar-limb-'+(++solarGlyphSequence),clip=svg('clipPath',{id},g);svg('circle',{r:32},clip);
 const surface=svg('g',{'clip-path':`url(#${id})`},g);
 if(kind==='Mercury')[[12,-12,7],[-13,8,5],[9,17,4],[-16,-17,3]].forEach(([cx,cy,r])=>{svg('circle',{cx,cy,r,fill:'#626160',opacity:.55},surface);svg('path',{d:`M${cx-r} ${cy}a${r} ${r} 0 0 1 ${r*2} 0`,fill:'none',stroke:'#c2bdb4',opacity:.5},surface)});
 if(['Venus','Jupiter','Saturn','Uranus','Neptune'].includes(kind)){
  const palette=kind==='Jupiter'?['#ab7b57','#e2c9a6','#c09b78']:kind==='Saturn'?['#bbab81','#e8d8ad','#d3c093']:kind==='Venus'?['#dfc38f','#f1dfb8','#cdb783']:kind==='Uranus'?['#a9d2d6','#bfe1df','#a3ccd1']:['#789fac','#9dbcc6','#7295a9'];
  [-23,-14,-5,5,15,24].forEach((y,i)=>svg('path',{d:`M-36 ${y}Q-12 ${y+5} 8 ${y+2}T36 ${y+1}`,fill:'none',stroke:palette[i%3],'stroke-width':kind==='Jupiter'?5:3,opacity:kind==='Uranus'?.25:.7},surface));
 }
 if(kind==='Jupiter'){svg('ellipse',{cx:13,cy:12,rx:8,ry:4,fill:'#a76449'},surface);svg('ellipse',{cx:12,cy:11,rx:5,ry:2,fill:'#c58361'},surface)}
 if(kind==='Earth'){
  svg('path',{d:'M-26-22L-13-26-5-19-9-12-3-8-7-2-16-5-17 5-24 1-29-10Z M-12 8L-3 6 3 15-2 25-9 32-12 20Z M8-23L25-24 35-10 24-7 20 1 11-3 5-12Z M20 17L29 16 33 24 24 27Z',fill:'#78956b'},surface);
  ['M-31-13Q-15-22 0-14T32-17','M-26 4Q-9 0 5 6T33 3','M-23 23Q-9 16 8 22'].forEach(d=>svg('path',{d,fill:'none',stroke:'#e5eef0','stroke-width':2.8,opacity:.8},surface));
 }
 if(kind==='Mars'){svg('path',{d:'M-25-4Q-11-16 3-3T29 12L16 20-2 10-17 14Z',fill:'#805f50',opacity:.6},surface);svg('ellipse',{cy:-29,rx:12,ry:6,fill:'#e4ddd1'},surface)}
 svg('path',{d:'M0-32A32 32 0 0 1 0 32Q23 0 0-32',fill:'#08111c',opacity:.42},g);
 svg('ellipse',{cx:-11,cy:-12,rx:10,ry:15,fill:'#ffffff',opacity:.07,transform:'rotate(-30)'},g);
 if(kind==='Saturn'){
  const front=svg('g',{transform:'rotate(-23)'},g);
  svg('path',{d:'M-55 0A55 17 0 0 0 55 0',fill:'none',stroke:'#d8c9a5','stroke-width':8},front);
  svg('path',{d:'M-55 0A55 17 0 0 0 55 0',fill:'none',stroke:'#655b4e','stroke-width':1.1},front);
 }
 return g;
}
