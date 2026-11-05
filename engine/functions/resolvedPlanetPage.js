function resolvedPlanetPage(query,r,byId=false){
 const pages=query.pages||[],direct=byId?pages.find(p=>p.pageid===r.pageid):null;
 if(planetPageExists(direct))return direct;
 const edges=new Map([...(query.normalized||[]),...(query.converted||[]),...(query.redirects||[])].map(e=>[e.from,e]));
 let title=byId?r.title:r.seed;const seen=new Set();
 while(edges.has(title)){if(seen.has(title))return null;seen.add(title);const edge=edges.get(title);if(edge.tofragment)return null;title=edge.to;}
 const page=pages.find(p=>p.title===title);return planetPageExists(page)?page:null;
}
