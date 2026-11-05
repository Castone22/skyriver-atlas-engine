function regionPath(region){
 const [x,y]=region.bounds;
 return 'M'+region.outline.map(([dx,dy])=>[x+dx,y+dy]).join(' L')+' Z';
}
