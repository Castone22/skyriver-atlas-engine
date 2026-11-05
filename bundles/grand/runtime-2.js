(function(root){
'use strict';
const E='elysian-stellar-atlas',K='kadaym-stellar-atlas',ids=[E,K];
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const owner=s=>/elysian|elysium/i.test(s||'')?E:/kadaym/i.test(s||'')?K:null;
function summarize(data){return {regions:Object.fromEntries(Object.entries(data.regions||{}).map(([id,r])=>[id,r.name])),systems:[...(data.systems||[]),...(data.unplaced||[])].map(s=>({id:s.id,name:s.name,aliases:s.aliases||[],region:s.region,affiliation:s.affiliation}))}}
function policy(sources,baseline){
 const systems={},regions={},known=new Map();
 for(const id of ids){const d=sources[id]?.data;if(!d)continue;for(const [key,name]of Object.entries(d.regions))if(norm(name)==='draysonhinterlands')regions[id]=key;for(const s of d.systems){const key=norm(s.name);if(!known.has(key))known.set(key,{});known.get(key)[id]=s}}
 for(const [key,pair]of known){
  if(!ids.some(id=>pair[id]&&pair[id].region===regions[id]))continue;
  const preferred=key==='kevak'?K:E;
  // Only an explicit Elysian <-> Kadaym affiliation transfer overrides the rule.
  const changed=ids.flatMap(id=>{
   const s=pair[id],before=baseline[id]?.systems.find(b=>norm(b.name)===key),from=owner(before?.affiliation),to=owner(s?.affiliation);
   return from&&to&&from!==to?[{to,id,live:!!sources[id]?.live,stamp:sources[id]?.stamp||0}]:[];
  }).sort((a,b)=>Number(b.live)-Number(a.live)||b.stamp-a.stamp||Number(b.id===preferred)-Number(a.id===preferred));
  const requested=changed[0]?.to||preferred;
  const target=pair[requested]?requested:pair[preferred]?preferred:ids.find(id=>pair[id]);
  const s=pair[target],entry={atlas:target,system:s.name,region:s.region};
  for(const v of Object.values(pair))for(const name of [v.name,v.id,...v.aliases])systems[norm(name)]=entry;
 }
 return {systems,regions};
}
function resolve(p,id,route){
 if(!ids.includes(id)||!route)return {id,route};
 if(route.system){const hit=p.systems[norm(route.system)];if(hit)return {id:hit.atlas,route:{...route,system:hit.system,region:hit.region}}}
 if(!route.system&&p.regions[E]&&[...Object.values(p.regions),'Drayson Hinterlands'].some(x=>x&&norm(x)===norm(route.region)))return {id:E,route:{...route,region:p.regions[E]}};
 return {id,route};
}
const api={ids,E,K,norm,summarize,policy,resolve};root.GrandAtlasPriority=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
