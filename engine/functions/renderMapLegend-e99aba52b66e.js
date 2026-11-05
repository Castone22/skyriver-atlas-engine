function renderMapLegend(key){
 const entries=key==='all'?Object.values(DATA.regions).map(r=>[r.color,r.name]):[['#8ac9ee','Union system'],['#ffde94','Capital system']];
 $('mapLegend').innerHTML=entries.map(([c,n])=>`<span style="--c:${c}">${key==='all'?link(n):esc(n)}</span>`).join('')+'<span style="--c:#398cff">TORA shroud</span>';
}
