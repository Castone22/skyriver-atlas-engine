function stationScreen(s,st){
 if(st?.schematic==='foundry')return foundryScreen(s);
 if(st?.schematic==='triad')return triadScreen(s,st);
 const units=stationRecords(s).filter(unit=>unit.category==='TORA');
 const switcher=`<nav class="tora-units" aria-label="Reflector arrays in this system">${units.map((unit,i)=>`<button data-unit="${esc(unit.name)}" aria-pressed="${unit.name===st.name}">Array 0${i+1}</button>`).join('')}${link(TORA_CLASS,'Go to Article','tora-article')}</nav>`;

 return `<section class="station-screen"><div class="tora-nav"><button id="leaveStation" class="back-region">← Return to system</button><button id="rebuildStation" class="orbit-toggle">↻ Replay build</button></div><div class="tora-kicker">STATION OVERVIEW <span>/</span> ${systemLink(s,s.name.toUpperCase())}</div><h2>${link(st.name)}</h2><p class="tora-deck">Terranos Omnidirectional Reflector Array</p>${switcher}
 ${toraElevation()}
 <div class="tora-instrument"><div class="tora-tags">${toraParts.map((p,i)=>`<button data-part="${i}" aria-pressed="false"><small>0${i+1}</small> ${esc(p.title)}</button>`).join('')}</div><div id="partReadout" aria-live="polite"></div></div>
 <div class="tora-specs">${[['Height','4.35 km'],['Width','1.2 km'],['Crew per unit','≈2,500'],['Power plant','Classified']].map(([k,n])=>`<div><small>${k}</small><b>${n}</b></div>`).join('')}</div>
 <p class="tora-foot">Shielding · RAMAGAUS Deflection Membrane and Wide-Scope Bubble Field. Component labels interpret the published exterior illustration. ${link(TORA_CLASS,'Class record ↗')} · ${link('File:TerranosTall.png','Reference illustration ↗')}</p></section>`;
}
