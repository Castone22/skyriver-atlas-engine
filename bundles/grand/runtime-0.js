(function(root){
'use strict';
const norm=s=>String(s||'').replace(/[ħĦ]/g,'h').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
// Read only the JSON data block. Never execute a downloaded atlas in the parent.
function readData(html){
 const match=/\b(?:const|let|var)\s+DATA\s*=\s*(\{)/.exec(html);
 if(!match)throw new Error('No supported atlas data block');
 const start=match.index+match[0].length-1;let depth=0,string=false,escape=false;
 for(let i=start;i<html.length;i++){
  const c=html[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;continue}
  if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){const data=JSON.parse(html.slice(start,i+1));if(!Array.isArray(data.systems)||!data.regions)throw new Error('Unsupported atlas schema');return data}
 }
 throw new Error('Incomplete atlas data');
}
function indexData(data){
 const entries=[],seen=new Set(),systems=[...(data.systems||[]),...(data.unplaced||[])],byId=new Map(systems.map(s=>[s.id,s])),owners=new Map();
 const regions=data.regions||{},worlds=data.worlds||{};
 for(const s of systems)for(const name of s.worlds||[])owners.set(name,s);
 function add(record,type,system=null,route=null,name=record.name){
  if(!name)return;
  const key=[type,system?.id||'',name].join('|');if(seen.has(key))return;seen.add(key);
  entries.push({name,type,article:record.referencePage||record.articleTitle||name,section:record.referenceSection||'',aliases:[record.id,record.nickname,...(record.aliases||[])].filter(v=>typeof v==='string'),system:system?.name||'',region:regions[system?.region]?.name||'',route});
 }
 for(const [id,r] of Object.entries(regions))add(r,'Region',null,{region:id});
 for(const s of systems){
  const chart=!!s.region||s.unplottedSystem||Array.isArray(s.worlds)&&s.worlds.length>0;
  add({...s,articleTitle:chart?(s.systemDataArticle||(/\bSystem$/i.test(s.articleTitle||'')?s.articleTitle:s.name+' System')):s.articleTitle},chart?'System':'Location',s,{system:s.name,object:'',...(!chart?{focus:'region'}:{})});
  for(const name of s.worlds||[]){
   const w=worlds[name]||{},type=w.bodyType==='Moon'?'Moon':/station|orbital|structure/i.test(w.bodyType||w.tag||'')?'Station':'Planet';
   const planet=type==='Moon'?w.parent:type==='Planet'?name:null;
   add(w,type,s,{system:s.name,object:name,...(planet?{planet}:{})},name);
  }
  const stars=s.stars?.length?s.stars:(s.primaries||[]).map(name=>({name}));
  for(const star of stars){const name=star.name||star.designation;if(name&&name!==s.name)add(star,'Star',s,{system:s.name,object:name},name)}
 }
 for(const [field,type] of [['satellites','Moon'],['stations','Station'],['entities','Entity']])for(const b of data[field]||[]){
  const s=byId.get(b.system)||owners.get(b.parent),t=b.category==='TORA'?'TORA array':type;
  const schematic=typeof b.schematic==='string'?b.schematic:b.schematic?.id;
  add(b,t,s,s?{system:s.name,object:b.name,...(b.parent?{planet:b.parent}:{}),...(schematic?{schematic}:t==='TORA array'?{focus:'station'}:{})}:null);
 }
 for(const [name,w] of Object.entries(worlds))if(!owners.has(name))add(w,w.bodyType||'Location',null,null,name);
 for(const b of data.historicalSites||[])add(b,'Historical site');
 return entries;
}
function rank(entry,query,atlasName=''){
 const q=norm(query),n=norm(entry.name);if(!q)return -1;
 if(n===q)return 0;if(n.startsWith(q))return 1;if(n.includes(q))return 2;
 if((entry.aliases||[]).some(a=>norm(a).includes(q)))return 3;
 const text=norm([entry.name,entry.article,entry.type,entry.system,entry.region,atlasName,...(entry.aliases||[])].join(' '));
 return q.split(' ').every(word=>text.includes(word))?4:-1;
}
const api={norm,readData,indexData,rank};root.GrandAtlasSearch=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
