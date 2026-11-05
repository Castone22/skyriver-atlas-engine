function legacyInfobox(wikitext){
 const match=wikitext.match(/<blockquote[^>]*>\s*\[!infobox[^]*?<\/blockquote>/i);if(!match)return null;
 const text=match[0],fields=new Map(),positional=[];
 const inline=text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,'[[$1§$2]]');
 for(const m of inline.matchAll(/\|\s*([^|\n<>]{2,60}?)\s*\|\s*([^|\n]+?)\s*\|/g)){const key=m[1].trim().toLowerCase();if(!/^[—\- ]+$/.test(key))fields.set(key,m[2].replaceAll('§','|').trim())}
 for(const row of text.split(/\n\|-/).slice(1)){const cells=row.split('\n').filter(l=>/^\|[^}-]/.test(l)).map(l=>l.slice(1).trim());if(cells.length>=2)fields.set(cells[0].toLowerCase(),cells.slice(1).join(' '))}
 const image=text.match(/!\[\[([^\]|]+\.(?:png|webp|jpg|jpeg|gif))/i);if(image)fields.set('image','File:'+image[1]);
 return {fields,positional};
}
