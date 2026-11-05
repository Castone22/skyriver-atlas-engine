function factValue(label,raw){
 const value=raw.replace(/<ref\b[^>]*\/>|<ref\b[^>]*>[\s\S]*?<\/ref>/gi,'')
  .replace(/<br\s*\/?>/gi,', ').replace(/<[^>]*>/g,'').replace(/'{2,5}/g,'').trim();
 // Render article links and text only. Wiki markup is never inserted as HTML.
 const parts=value.split(/(\[\[[^\[\]]+\]\])/g);
 return parts.map(part=>{
  const match=part.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
  if(!match)return esc(part);
  const target=match[1].trim(),caption=match[2]||target;
  return label==='System'?link(systemNameTitle(target),systemNameTitle(caption)):link(target,caption);
 }).join('');
}
