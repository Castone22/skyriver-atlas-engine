function leadInfobox(wikitext){
 const lead=wikitext.split(/^\s*={1,6}[^=]/m)[0].replace(/<!--[\s\S]*?-->/g,''),matches=[...lead.matchAll(/{{\s*(?:Template:)?InfoboxNeue[^|{}]*(?=[|}])/gi)];
 if(!matches.length){const marker=lead.search(/<blockquote[^>]*>\s*\[!infobox/i);return marker<0?null:legacyInfobox(wikitext.replace(/<!--[\s\S]*?-->/g,'').slice(marker))}if(matches.length!==1)throw Error('Ambiguous infobox');
 const start=matches[0].index;let i=start,depth=0;
 while(i<lead.length){if(lead.startsWith('{{',i)){depth++;i+=2}else if(lead.startsWith('}}',i)){depth--;i+=2;if(!depth)break}else i++}
 if(depth)throw Error('Unclosed infobox');
 const fields=new Map(),positional=[];
 for(const parameter of splitWiki(lead.slice(start+2,i-2)).slice(1)){
  const [key,...rest]=splitWiki(parameter,'=');
  if(!rest.length){positional.push(parameter);continue}
  const name=key.trim().toLowerCase().replace(/_/g,' '),value=rest.join('=').trim();
  if(name==='image' && fields.has(name))throw Error('Duplicate image field');
  fields.set(name,value);
  if(name==='1')positional.push(value);
 }
 for(const [key,value] of [...fields]){const m=key.match(/^label(\d+)$/);if(m){const v=fields.get('value'+m[1])||fields.get('content'+m[1]);if(v)fields.set(value.toLowerCase().trim(),v)}}return {fields,positional};
}
