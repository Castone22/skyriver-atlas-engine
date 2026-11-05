function drawMarkers(){
 $('markers').replaceChildren();for(const r of seeds.filter(r=>r.position)){
  const [nx,ny]=r.position,x=250+nx*1000,y=ny*1000,[dx,dy,w]=r.label;
  const g=node('g',{class:'marker',tabindex:0,role:'button','aria-label':'Explore '+r.name,'data-atlas':r.id});
  g.append(node('title',{},r.name+' · Open stellar atlas'));
  const elbowX=x+dx,elbowY=y+dy;
  const label=node('text',{x:elbowX,y:elbowY-7,fill:r.color,color:r.color,'text-anchor':w<0?'end':'start'},r.name.toUpperCase());
  $('markers').append(g);
  g.append(label);
  const endX=elbowX+Math.sign(w)*label.getComputedTextLength();
  g.append(node('circle',{cx:x,cy:y,r:15,fill:r.color,class:'halo'}),node('circle',{cx:x,cy:y,r:8,fill:'#0b1420',stroke:r.color,'stroke-width':1}),node('circle',{cx:x,cy:y,r:3.5,fill:r.color}));
  g.append(node('path',{d:`M ${x} ${y} L ${elbowX} ${elbowY} H ${endX}`,stroke:r.color}));
  g.append(label);
  g.append(node('rect',{x:Math.min(x-23,elbowX,endX),y:Math.min(y-23,elbowY-27),width:Math.max(x+23,elbowX,endX)-Math.min(x-23,elbowX,endX),height:Math.max(y+23,elbowY+7)-Math.min(y-23,elbowY-27),class:'hit'}));
  g.onclick=()=>{if(!dragged)openAtlas(r.id,true)};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAtlas(r.id,true)}};
 }
}
