function renderMapLegend(key){
 const legend=__ATLAS__.policies.legend,region=DATA.regions[key],span=(c,inner)=>`<span style="--c:${c}">${inner}</span>`;
 let items;
 if(legend.tiers&&(region?.silentPresence||region?.cordon))items=Object.entries(TIER_NAMES).map(([tier,name])=>span(TIER_COLORS[tier],esc(`T${tier} ${name}`)));
 else if(legend.regions?.[key])items=legend.regions[key].map(([c,n])=>span(c,esc(n)));
 else if(legend.overviewRegions&&key==='all')items=Object.values(DATA.regions).map(r=>span(r.color,link(r.name)));
 else items=legend.entries.map(([c,n])=>span(c,esc(n)));
 $('mapLegend').innerHTML=items.join('')+(legend.append||[]).map(([c,n])=>span(c,esc(n))).join('');
}
