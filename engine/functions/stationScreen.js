function stationScreen(s,st){
 const sc=schematicOf(st);if(!sc)return '';
 // Text in a schematic is a string, or a link { link, label?, cls? }; "$station" means this station.
 const text=p=>typeof p==='string'?esc(p):link(p.link==='$station'?st.name:p.link,p.label||p.link,p.cls||'');
 const run=list=>(list||[]).map(text).join('');
 const units=sc.units?stationRecords(s).filter(u=>u.schematic===sc.key):[];
 const label=sc.units?.aria||sc.navLabel;
 const nav=`<nav class="tora-units"${label?` aria-label="${esc(label)}"`:''}>${units.map((u,i)=>`<button data-unit="${esc(u.name)}" aria-pressed="${u.name===st.name}">${esc(sc.units.noun)} 0${i+1}</button>`).join('')}${run(sc.links)}</nav>`;
 // A drawing is markup in the data, or the name of a function the atlas defines: fn(station, system).
 const draw=sc.drawing?.function?(typeof window[sc.drawing.function]==='function'?window[sc.drawing.function](st,s):''):sc.drawing?.svg||'';
 return `<section class="station-screen${sc.screenClass?' '+esc(sc.screenClass):''}"><div class="tora-nav"><button id="leaveStation" class="back-region">← Return to system</button><button id="rebuildStation" class="orbit-toggle">↻ Replay build</button></div><div class="tora-kicker">${esc(sc.kicker||'STATION OVERVIEW')} <span>/</span> ${systemLink(s,s.name.toUpperCase())}</div><h2>${link(st.name)}</h2><p class="tora-deck">${esc(sc.deck||'')}</p>${nav}
 ${draw}
 <div class="tora-instrument"><div class="tora-tags">${(sc.parts||[]).map((p,i)=>`<button data-part="${i}" aria-pressed="false"><small>0${i+1}</small> ${esc(p.title)}</button>`).join('')}</div><div id="partReadout" aria-live="polite"></div></div>
 <div class="tora-specs">${(sc.specs||[]).map(([k,v])=>`<div><small>${esc(k)}</small><b>${text(v)}</b></div>`).join('')}</div>${sc.lore?`<p class="foundry-lore">${run(sc.lore)}</p>`:''}
 <p class="tora-foot">${run(sc.footnote)}</p></section>`;
}
