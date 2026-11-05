function bindOrbitalSelection(g,name,openPlanet=false){
 if(widgetMode)return;
 g.onclick=e=>{
  if(e.target.closest('a'))return;
  if(!openPlanet||!e.detail){chooseSystemWorld(name);return}
  // Keep the moving SVG target mounted until the browser can deliver dblclick.
  clearTimeout(planetClickTimer);
  if(e.detail===1)planetClickTimer=setTimeout(()=>{if($('orbitDiagram')?.contains(g))chooseSystemWorld(name)},MARKER_DOSSIER_DELAY);
 };
 if(openPlanet)g.ondblclick=e=>{
  if(e.target.closest('a'))return;
  e.preventDefault();clearTimeout(planetClickTimer);setPlanetFocus(name);
 };
 g.onkeydown=e=>{if(e.target===g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();chooseSystemWorld(name)}}}
