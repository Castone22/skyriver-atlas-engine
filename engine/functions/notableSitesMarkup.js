function notableSitesMarkup(s){
 const local=planetFocus?localBodies(s,planetFocus):null,visible=local?new Set([planetFocus,...local.moons.map(b=>b.name),...local.stations.map(b=>b.name)]):null;
 const hiddenStations=new Set(local?[]:stationRecords(s).filter(st=>st.visibility!=='system').map(st=>st.name));
 const sites=(s.notableSites||[]).filter(site=>!hiddenStations.has(site.name)&&resolveObjectName(s,site.name)&&(!visible||visible.has(site.name)));
 if(!sites.length)return '';
 return `<section class="notable-sites" aria-label="Notable sites in ${esc(planetFocus||s.name)}"><div class="orbit-site-heading">NOTABLE SITES</div><div class="notable-grid">${sites.map(site=>`<article class="notable-card ${selectedWorld===site.name?'active':''}"><h3>${link(site.name)}</h3><p>${esc(site.summary)}</p><button data-notable="${esc(site.name)}" aria-label="Inspect notable site ${esc(site.name)}">Inspect site →</button></article>`).join('')}</div></section>`;
}
