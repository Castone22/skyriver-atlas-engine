function drawBelt(chart,s,seed,radius,cx,cy,expanded){
 const hole=s.centralBodyType==='black-hole',total=solarLayout(s).total,slot=s.beltSlot??(hole?2.55:Math.min(total-.55,2.5+seed%Math.max(1,total-3)));
 const rx=radius(slot),ry=rx*(s.projection?.flatten??.66),g=svg('g',{class:'asteroid-belt','aria-hidden':'true','pointer-events':'none',transform:`translate(${cx} ${cy}) rotate(${s.projection?.tilt??-12})`},chart);
 svg('ellipse',{rx,ry,fill:'none',stroke:hole?'#9e8aa7':'#8e9596','stroke-width':expanded?9:5,opacity:.045},g);
 let random=seed+17;const rand=()=>{random=(random*16807)%2147483647;return(random-1)/2147483646};
 for(let i=0;i<(expanded?144:74);i++){const a=rand()*Math.PI*2,spread=(rand()-.5)*(expanded?12:6),r=(expanded?.55:.35)+rand()*(expanded?1.05:.6);svg('circle',{cx:(rx+spread)*Math.cos(a),cy:(ry+spread*.65)*Math.sin(a),r,fill:hole?'#b7a5be':'#b1b1a4',opacity:.12+rand()*.28},g)}
}
