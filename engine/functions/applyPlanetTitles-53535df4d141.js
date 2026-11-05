function applyPlanetTitles(){
 for(const el of document.querySelectorAll('[data-planet-title]'))el.textContent=planetName(el.dataset.planetTitle);
 for(const el of document.querySelectorAll('[data-planet-link]'))el.setAttribute('href',url(el.dataset.planetLink));
 for(const el of document.querySelectorAll('[data-world], [data-orbit-name], [data-local-center], [data-local-name]')){
  const key=el.dataset.world||el.dataset.orbitName||el.dataset.localCenter||el.dataset.localName;if(!DATA.worlds[key])continue;
  for(const attr of ['aria-label','title']){const original=el.getAttribute('data-original-'+attr)||el.getAttribute(attr);if(original){el.setAttribute('data-original-'+attr,original);el.setAttribute(attr,original.split(key).join(planetName(key)))}}
  const title=el.querySelector('title');if(title)title.textContent=planetName(key);
 }
 if(selected&&$('mobileInspect'))$('mobileInspect').textContent=planetName(selectedWorld||resolveSystem(selected)?.name)+' dossier ↗';
}
