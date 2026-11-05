(function(root){
'use strict';
const validSlug=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(s);
const stellar=s=>/(?:^|[-_\s])stellar[-_\s]+(?:atlas|altas)(?:$|[-_\s])/i.test(s);
const key=s=>s.toLowerCase().replace(/_/g,'-').replace(/stellar-altas/g,'stellar-atlas').replace(/^elysium-/, 'elysian-');
const label=s=>s.replace(/[-_]stellar[-_](?:atlas|altas)$/i,'').split(/[-_]/).map(w=>/^(uacs|iulr)$/i.test(w)?w.toUpperCase():w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
function foldEvents(events){
 const seen=new Set(),out=[];
 for(const e of [...events].sort((a,b)=>(b.logid||0)-(a.logid||0)||String(b.timestamp).localeCompare(String(a.timestamp)))){
  const slug=e.params?.slug||e.title?.split('AtlasEmbed/')[1];
  if(!validSlug(slug)||!stellar(slug)||/^(?:skyriver[-_])?grand[-_]stellar[-_](?:atlas|altas)$/i.test(slug)||!['upload','delete'].includes(e.action)||seen.has(slug))continue;
  seen.add(slug);out.push({slug,id:key(slug),name:label(slug),deleted:e.action==='delete',updated:e.timestamp||'',logid:e.logid||0});
 }
 return out;
}
const api={validSlug,stellar,key,label,foldEvents};root.GrandAtlasCore=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
