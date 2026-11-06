// The title of the wiki article for a name: the live title of a planet, else the article title or name of
// the catalogue record the name (or one of its aliases) belongs to.
function canonicalTitle(name){
 const live=planetArticle(name);if(live)return live;
 if(!canonicalTitle.map){
  const map=new Map(),add=(label,title)=>{const n=label&&normalizedName(label);if(n&&!map.has(n))map.set(n,title)};
  for(const r of [...allRecords,...Object.entries(DATA.worlds).map(([name,w])=>({name,...w})),...(DATA.stations||[]),...(DATA.satellites||[]),...(DATA.entities||[]),...Object.values(DATA.regions),...(DATA.historicalSites||[])])
   for(const label of [r.name,...(r.aliases||[])])add(label,r.articleTitle||r.name);
  // A single-star system shares its star's name; the star's own article wins for that name.
  for(const s of DATA.systems)for(const star of s.stars||[])for(const label of [star.designation,...(star.aliases||[])]){const n=label&&normalizedName(label);if(n)map.set(n,star.articleTitle||star.designation)}
  canonicalTitle.map=map;
 }
 return canonicalTitle.map.get(normalizedName(name))||String(name).replace(/[‘’]/g,"'");
}
