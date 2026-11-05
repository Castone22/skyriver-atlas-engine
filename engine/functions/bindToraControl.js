function bindToraControl(el,name,single=()=>chooseSystemWorld(name)){
 el.setAttribute('title','Double-click for Station Overview');
 el.onclick=e=>{
  if(e.target.closest('a'))return;
  clearTimeout(planetClickTimer);
  if(!e.detail){if(el.dataset.stationFilter)single();else openStation(name);return}
  if(e.detail===1)planetClickTimer=setTimeout(()=>{if(document.documentElement.contains(el))single()},MARKER_DOSSIER_DELAY);
 };
 el.ondblclick=e=>{if(!e.target.closest('a')){e.preventDefault();clearTimeout(planetClickTimer);openStation(name)}};
 el.onkeydown=e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();clearTimeout(planetClickTimer);openStation(name)}};
}
