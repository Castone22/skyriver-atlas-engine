function nefandumGlyph(parent,scale=1){
 const g=svg('g',{'data-nefandum':'Nefmaat',transform:`scale(${scale})`},parent);
 const ring=svg('g',{class:'nefandum-ring'},g);svg('circle',{r:11,fill:'none',stroke:'#bd8ea7','stroke-width':1.4},ring);
 for(let i=0;i<12;i++)svg('path',{d:'M-2-12L-3-17 0-22 3-17 2-12Z',transform:`rotate(${i*30})`,fill:'#43364d',stroke:'#c49db2','stroke-width':.7,'data-nefandum-petal':i+1},ring);
 svg('path',{d:'M0-29L4-9 3 13 0 29-3 13-4-9Z',fill:'#b8acbf',stroke:'#e2c5d7','stroke-width':.65},g);svg('path',{d:'M0-23V23',stroke:'#593c58','stroke-width':1},g);return g;
}
