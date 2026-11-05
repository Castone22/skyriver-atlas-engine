function rebuild(){
 const select=$('atlasSelect');select.replaceChildren(new Option('Galaxy View','galaxy'));
 for(const [label,condition] of [['Plotted empires',r=>r.position],['Other stellar atlases',r=>!r.position]]){
  const group=document.createElement('optgroup');group.label=label;
  sorted().filter(condition).forEach(r=>group.append(new Option(r.name+(r.deleted?' · archived preview':''),r.id)));
  if(group.children.length)select.append(group);
 }
 select.value=records.has(active)?active:'galaxy';renderIndex();
 $('countNote').textContent=seeds.filter(r=>r.position).length+' plotted empires · '+records.size+' atlases available';
}
