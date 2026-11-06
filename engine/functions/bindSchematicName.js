function bindSchematicName(el,name){
 const address=el.getAttribute('href');
 el.setAttribute('title','Click for the Codex article · double-click for Station Overview');
 el.onclick=e=>{
  if(!e.detail||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();e.stopPropagation();clearTimeout(planetClickTimer);
  if(e.detail===1)planetClickTimer=setTimeout(()=>{
   if(!document.documentElement.contains(el))return;
   const page=window.open('about:blank','_blank');
   if(page){page.opener=null;page.location.replace(address)}
   else location.href=address;
  },MARKER_DOSSIER_DELAY);
 };
 el.ondblclick=e=>{
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();e.stopPropagation();clearTimeout(planetClickTimer);openStation(name);
 };
}
